import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import { useCasasStore } from './casas'
import { recordLogin } from '../services/recordLogin'

export const USER_MANAGERS = ['Esteban B', 'JosephR', 'Ramiro Q']

export const LOGIN_METHODS = {
  password: 'password',
  google: 'google'
}

const LEGACY_SESSION_DAYS = 6
const SUPABASE_SESSION_HOURS = 8
const USER_STORAGE_KEY = 'user'
const EXPIRY_STORAGE_KEY = 'sessionExpiry'
const AUTH_MODE_KEY = 'authMode'
const SESSION_STARTED_KEY = 'sessionStartedAt'

const PROFILE_COLUMNS = 'id, Usuario, Rol, metodo_login, email, auth_user_id, totp_enrolled'

export function normalizeEmail (value) {
  return String(value || '').trim().toLowerCase()
}

const toProfile = (row) => {
  if (!row || typeof row !== 'object') return null

  return {
    id: row.id,
    Usuario: row.Usuario,
    Rol: row.Rol,
    metodo_login: row.metodo_login || LOGIN_METHODS.password,
    email: row.email || null,
    auth_user_id: row.auth_user_id || null,
    totp_enrolled: Boolean(row.totp_enrolled)
  }
}

const readDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeTotpSecret = (value) => {
  const secret = String(value || '').replace(/\s+/g, '').toUpperCase()
  return secret || null
}

const totpSecretFromEnroll = (totp) => {
  const fromField = normalizeTotpSecret(totp?.secret)
  if (fromField) return fromField

  const uri = String(totp?.uri || '')
  if (!uri) return null

  try {
    return normalizeTotpSecret(new URL(uri).searchParams.get('secret'))
  } catch {
    const match = uri.match(/[?&]secret=([^&]+)/i)
    return match ? normalizeTotpSecret(decodeURIComponent(match[1])) : null
  }
}

const DEFAULT_TOTP_NAME = 'Google Authenticator'
const DUPLICATE_FACTOR_RE = /friendly name|already exists|already been enrolled/i

const totpFactorsFromList = (factorsData) => {
  const fromAll = (factorsData?.all || []).filter((factor) => factor?.factor_type === 'totp')
  if (fromAll.length) return fromAll
  return factorsData?.totp || []
}

const isDuplicateTotpNameError = (error) => DUPLICATE_FACTOR_RE.test(String(error?.message || ''))

const mapMfaEnrollError = (error) => {
  if (isDuplicateTotpNameError(error)) {
    return 'Este Authenticator quedó a medias. Genera un QR nuevo o pide a un administrador que lo resetee en Usuarios.'
  }
  return error?.message || 'No se pudo generar el código de Authenticator'
}

const loadStoredAuthMode = () => {
  const mode = localStorage.getItem(AUTH_MODE_KEY)
  return mode === 'supabase' || mode === 'legacy' || mode === 'google' ? mode : null
}

const usesSupabaseSession = (mode = loadStoredAuthMode()) => {
  return mode === 'supabase' || mode === 'google'
}

const isGoogleProvider = (authUser) => {
  const provider = authUser?.app_metadata?.provider
  const identities = authUser?.identities || []
  return provider === 'google' || identities.some((identity) => identity.provider === 'google')
}

const loadStoredUser = () => {
  if (usesSupabaseSession()) {
    return null
  }

  try {
    const stored = JSON.parse(localStorage.getItem(USER_STORAGE_KEY))
    const profile = toProfile(stored)

    if (!profile) {
      return null
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
    return profile
  } catch (_error) {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

const loadStoredExpiry = () => {
  if (usesSupabaseSession()) {
    return null
  }

  return readDate(localStorage.getItem(EXPIRY_STORAGE_KEY))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadStoredUser(),
    sessionExpiry: loadStoredExpiry(),
    authMode: loadStoredAuthMode(),
    loading: false,
    restoring: false,
    googleLoginPending: false,
    error: null,
    mfa: {
      step: null,
      factorId: null,
      qrCode: null,
      secret: null
    }
  }),

  getters: {
    isLoggedIn: (state) => {
      if (!state.user) return false
      if (state.sessionExpiry && new Date() > state.sessionExpiry) {
        return false
      }
      return true
    },
    userId: (state) => state.user?.id || null,
    daysRemaining: (state) => {
      if (!state.sessionExpiry || usesSupabaseSession(state.authMode)) return 0
      const diffTime = new Date(state.sessionExpiry) - new Date()
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    },
    sessionRemainingLabel: (state) => {
      if (!state.sessionExpiry) return ''
      const diffMs = new Date(state.sessionExpiry) - Date.now()
      if (diffMs <= 0) return 'Expirada'

      if (usesSupabaseSession(state.authMode)) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`
      }

      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return days === 1 ? '1 día' : `${days} días`
    },
    canAdd: (state) => Boolean(state.user && state.user.Rol !== 'inactivo'),
    canEdit: (state) => Boolean(state.user && state.user.Rol !== 'inactivo'),
    canView: (state) => Boolean(state.user),
    isSuperAdmin: (state) => state.user?.Rol === 'SuperAdmin',
    canManageUsers: (state) => USER_MANAGERS.includes(state.user?.Usuario),
    usesAuthenticator: (state) => state.authMode === 'supabase',
    usesGoogle: (state) => state.authMode === 'google',
    usesHourlySession: (state) => usesSupabaseSession(state.authMode)
  },

  actions: {
    clearMfaState() {
      this.mfa = {
        step: null,
        factorId: null,
        qrCode: null,
        secret: null
      }
    },

    persistLocalSession(profile, expiryDate, mode, startedAt = new Date()) {
      const safeProfile = toProfile(profile)
      this.user = safeProfile
      this.sessionExpiry = expiryDate
      this.authMode = mode
      this.error = null

      if (safeProfile) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeProfile))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }

      localStorage.setItem(EXPIRY_STORAGE_KEY, expiryDate.toISOString())
      localStorage.setItem(AUTH_MODE_KEY, mode)
      localStorage.setItem(SESSION_STARTED_KEY, startedAt.toISOString())
    },

    clearLocalSession() {
      this.user = null
      this.sessionExpiry = null
      this.authMode = null
      this.error = null
      this.googleLoginPending = false
      this.clearMfaState()
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(EXPIRY_STORAGE_KEY)
      localStorage.removeItem(AUTH_MODE_KEY)
      localStorage.removeItem(SESSION_STARTED_KEY)
    },

    buildExpiry(mode) {
      const expiryDate = new Date()
      if (usesSupabaseSession(mode)) {
        expiryDate.setHours(expiryDate.getHours() + SUPABASE_SESSION_HOURS)
      } else {
        expiryDate.setDate(expiryDate.getDate() + LEGACY_SESSION_DAYS)
      }
      return expiryDate
    },

    sessionModeForAuthUser(authUser) {
      return isGoogleProvider(authUser) ? 'google' : 'supabase'
    },

    unauthorizedMessageForAuthUser(authUser) {
      if (isGoogleProvider(authUser)) {
        return 'Este correo de Google no está autorizado. Pide al administrador que lo asigne.'
      }
      return 'Tu correo no está autorizado. Contacte al administrador.'
    },

    async fetchAuthorizedProfile(authUser) {
      if (isGoogleProvider(authUser)) {
        return this.fetchGoogleProfile(authUser)
      }
      return this.fetchProfileForAuthUser(authUser)
    },

    async linkAuthUserToProfile(profile, authUser) {
      const nextProfile = toProfile(profile)
      if (!nextProfile || !authUser?.id) return nextProfile

      const email = normalizeEmail(authUser.email || nextProfile.email)
      if (nextProfile.auth_user_id === authUser.id && (!email || nextProfile.email === email)) {
        return nextProfile
      }

      await supabase
        .from('Usuarios')
        .update({ auth_user_id: authUser.id, email })
        .eq('id', nextProfile.id)

      return { ...nextProfile, auth_user_id: authUser.id, email }
    },

    isSupabaseSessionExpired() {
      const startedAt = readDate(localStorage.getItem(SESSION_STARTED_KEY))
      if (!startedAt) return true
      const maxAgeMs = SUPABASE_SESSION_HOURS * 60 * 60 * 1000
      return Date.now() - startedAt.getTime() > maxAgeMs
    },

    async fetchProfileForAuthUser(authUser) {
      const authUserId = authUser?.id
      const email = normalizeEmail(authUser?.email)

      if (authUserId) {
        const byId = await supabase
          .from('Usuarios')
          .select(PROFILE_COLUMNS)
          .eq('auth_user_id', authUserId)
          .maybeSingle()

        if (byId.data) return { profile: toProfile(byId.data), error: byId.error }
      }

      if (email) {
        const byEmail = await supabase
          .from('Usuarios')
          .select(PROFILE_COLUMNS)
          .ilike('email', email)
          .maybeSingle()

        if (byEmail.data) return { profile: toProfile(byEmail.data), error: byEmail.error }
        return { profile: null, error: byEmail.error }
      }

      return { profile: null, error: null }
    },

    async fetchGoogleProfile(authUser) {
      const email = normalizeEmail(authUser?.email)
      if (!email) {
        return { profile: null, error: null }
      }

      const { data: rows, error } = await supabase
        .from('Usuarios')
        .select(PROFILE_COLUMNS)
        .eq('metodo_login', LOGIN_METHODS.google)

      const match = (rows || []).find((row) => normalizeEmail(row.email) === email)
      return { profile: toProfile(match), error }
    },

    async markTotpEnrolled(profile) {
      if (!profile?.id || profile.totp_enrolled) {
        return toProfile(profile)
      }

      const { data, error } = await supabase
        .from('Usuarios')
        .update({ totp_enrolled: true })
        .eq('id', profile.id)
        .select(PROFILE_COLUMNS)
        .maybeSingle()

      if (error) {
        console.error('No se pudo marcar totp_enrolled:', error)
        return { ...toProfile(profile), totp_enrolled: true }
      }

      return toProfile(data) || { ...toProfile(profile), totp_enrolled: true }
    },

    async completeHourlySession(profile, mode) {
      const enrolledProfile = await this.markTotpEnrolled(profile)
      this.persistLocalSession(enrolledProfile, this.buildExpiry(mode), mode)
      this.googleLoginPending = false
      this.clearMfaState()
      this.recordSuccessfulLogin(enrolledProfile, mode === 'google' ? 'google' : 'authenticator')
      return { success: true, userId: enrolledProfile.id }
    },

    recordSuccessfulLogin(profile, metodo) {
      if (!profile?.id || !profile?.Usuario) return

      void recordLogin({
        userId: profile.id,
        usuario: profile.Usuario,
        metodo
      }).catch((error) => {
        console.error('No se pudo registrar IP y hora del acceso:', error)
      })
    },

    async tryRestoreHourlySession(profile, authUser, mode) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData?.currentLevel !== 'aal2') return null

      const linked = await this.linkAuthUserToProfile(profile, authUser)
      const startedAt = readDate(localStorage.getItem(SESSION_STARTED_KEY)) || new Date()
      const expiryDate = new Date(startedAt.getTime() + SUPABASE_SESSION_HOURS * 60 * 60 * 1000)

      if (Date.now() > expiryDate.getTime()) {
        await supabase.auth.signOut({ scope: 'global' }).catch(() => null)
        this.clearLocalSession()
        return false
      }

      this.persistLocalSession(linked, expiryDate, mode, startedAt)
      this.googleLoginPending = false
      this.clearMfaState()
      return true
    },

    async rejectUnauthorizedAuthSession(message) {
      this.clearMfaState()
      await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
      this.clearLocalSession()
      this.error = message
      return { success: false, message }
    },

    async prepareMfaStep() {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalError) {
        this.error = aalError.message || 'No se pudo verificar el segundo factor'
        return { success: false, message: this.error }
      }

      const { data: sessionData } = await supabase.auth.getUser()
      const authUser = sessionData?.user
      const mode = this.sessionModeForAuthUser(authUser)

      if (aalData?.currentLevel === 'aal2') {
        const { profile, error } = await this.fetchAuthorizedProfile(authUser)
        if (error || !profile) {
          return this.rejectUnauthorizedAuthSession(this.unauthorizedMessageForAuthUser(authUser))
        }
        if (profile.Rol === 'inactivo') {
          return this.rejectUnauthorizedAuthSession('Usuario inactivo. Contacte al administrador.')
        }
        const linked = await this.linkAuthUserToProfile(profile, authUser)
        return this.completeHourlySession(linked, mode)
      }

      return this.prepareMfaChallengeOrEnroll()
    },

    async listTotpFactors() {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) return { factors: [], error }
      return { factors: totpFactorsFromList(data), error: null }
    },

    async removeUnverifiedTotpFactors(extraFactorId = null) {
      const { factors, error } = await this.listTotpFactors()
      if (error) return { factors: [], error }

      const pendingIds = new Set(
        factors
          .filter((factor) => factor?.id && factor.status !== 'verified')
          .map((factor) => factor.id)
      )
      if (extraFactorId) pendingIds.add(extraFactorId)

      let firstError = null
      for (const factorId of pendingIds) {
        const result = await supabase.auth.mfa.unenroll({ factorId })
        if (result.error && !firstError) firstError = result.error
      }

      return { factors, error: firstError }
    },

    async prepareMfaChallengeOrEnroll() {
      this.error = null

      const { factors, error: factorsError } = await this.listTotpFactors()
      if (factorsError) {
        this.error = factorsError.message || 'No se pudieron leer los factores MFA'
        return { success: false, message: this.error }
      }

      const verified = factors.find((factor) => factor.status === 'verified')
      if (verified) {
        this.mfa = {
          step: 'challenge',
          factorId: verified.id,
          qrCode: null,
          secret: null
        }
        return { success: false, needsChallenge: true }
      }

      await this.removeUnverifiedTotpFactors()
      return this.startTotpEnrollment()
    },

    async enrollTotpFactor(friendlyName) {
      return supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName
      })
    },

    async startTotpEnrollment() {
      this.error = null

      let { data, error } = await this.enrollTotpFactor(DEFAULT_TOTP_NAME)

      if (error && isDuplicateTotpNameError(error)) {
        await this.removeUnverifiedTotpFactors()
        const retry = await this.enrollTotpFactor(DEFAULT_TOTP_NAME)
        data = retry.data
        error = retry.error
      }

      if (error && isDuplicateTotpNameError(error)) {
        const uniqueName = `${DEFAULT_TOTP_NAME} ${Date.now()}`
        const unique = await this.enrollTotpFactor(uniqueName)
        data = unique.data
        error = unique.error
      }

      if (error) {
        this.error = mapMfaEnrollError(error)
        return { success: false, message: this.error }
      }

      this.mfa = {
        step: 'enroll',
        factorId: data.id,
        qrCode: data.totp?.qr_code || null,
        secret: totpSecretFromEnroll(data.totp)
      }

      return { success: false, needsEnroll: true }
    },

    async regenerateTotpEnrollment() {
      this.loading = true
      this.error = null
      try {
        await this.removeUnverifiedTotpFactors(this.mfa.factorId)
        return this.startTotpEnrollment()
      } finally {
        this.loading = false
      }
    },

    async retryPendingAuthenticatorSetup() {
      this.loading = true
      this.error = null
      try {
        const { data } = await supabase.auth.getSession()
        if (!data?.session?.user) {
          this.error = 'Vuelve a entrar con Google o con Authenticator para generar un QR nuevo.'
          return { success: false, message: this.error, needsLogin: true }
        }
        return this.prepareMfaChallengeOrEnroll()
      } finally {
        this.loading = false
      }
    },

    async restoreSession() {
      this.restoring = true
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session

        if (session?.user) {
          if (this.mfa.step) {
            return false
          }

          const { profile, error } = await this.fetchAuthorizedProfile(session.user)
          const mode = this.sessionModeForAuthUser(session.user)

          if (error || !profile) {
            if (isGoogleProvider(session.user) || usesSupabaseSession(this.authMode)) {
              return this.rejectUnauthorizedAuthSession(this.unauthorizedMessageForAuthUser(session.user))
            }
            await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
          } else if (profile.Rol === 'inactivo') {
            return this.rejectUnauthorizedAuthSession('Usuario inactivo. Contacte al administrador.')
          } else {
            const restored = await this.tryRestoreHourlySession(profile, session.user, mode)
            if (restored === true) return true
            if (restored === false) return false

            await this.linkAuthUserToProfile(profile, session.user)
            this.authMode = mode
            await this.prepareMfaChallengeOrEnroll()
            return false
          }
        }

        if (usesSupabaseSession(this.authMode)) {
          this.clearLocalSession()
          return false
        }

        return this.checkSessionExpiry()
      } finally {
        this.restoring = false
      }
    },

    async checkSessionExpiry() {
      if (usesSupabaseSession(this.authMode) && this.isSupabaseSessionExpired()) {
        await this.logout()
        return false
      }

      if (this.sessionExpiry && new Date() > this.sessionExpiry) {
        await this.logout()
        return false
      }

      return Boolean(this.user)
    },

    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('Usuarios')
          .select(PROFILE_COLUMNS)
          .eq('Usuario', username)
          .eq('password_hash', password)
          .single()

        if (error || !data) {
          this.error = 'Usuario o contraseña incorrectos'
          return { success: false, message: this.error }
        }

        if (data.Rol === 'inactivo') {
          this.error = 'Usuario inactivo. Contacte al administrador.'
          return { success: false, message: this.error }
        }

        if (data.metodo_login === LOGIN_METHODS.google) {
          this.error = 'Este usuario entra con Google. Usa el botón de Google.'
          return { success: false, message: this.error, useGoogle: true }
        }

        if (data.totp_enrolled) {
          this.error = 'Tu cuenta ya usa Google Authenticator. Entra con el botón Authenticator.'
          return { success: false, message: this.error, useAuthenticator: true }
        }

        this.persistLocalSession(data, this.buildExpiry('legacy'), 'legacy')
        await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
        this.recordSuccessfulLogin(data, 'password')
        return { success: true, userId: data.id }
      } catch (err) {
        this.error = 'Ocurrió un error inesperado'
        console.error('Login error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async loginWithGoogle () {
      this.loading = true
      this.error = null
      try {
        const redirectTo = `${window.location.origin}/?google_return=1`
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account'
            }
          }
        })

        if (error || !data?.url) {
          this.googleLoginPending = false
          this.error = error?.message || 'No se pudo abrir Google'
          return { success: false, message: this.error }
        }

        this.googleLoginPending = true
        return { success: true, url: data.url }
      } catch (err) {
        this.googleLoginPending = false
        this.error = 'Ocurrió un error inesperado'
        console.error('Google login error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async resumeAfterExternalGoogleLogin () {
      if (this.restoring || this.isLoggedIn || this.mfa.step) {
        return this.isLoggedIn
      }

      const { data } = await supabase.auth.getSession()
      const user = data?.session?.user
      if (!user) return false
      if (!this.googleLoginPending && !isGoogleProvider(user)) return false

      return this.restoreSession()
    },

    async loginWithAuthenticator(email, password) {
      this.loading = true
      this.error = null
      this.clearMfaState()

      try {
        const normalizedEmail = email.trim().toLowerCase()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        })

        if (error || !data?.user) {
          this.error = 'Correo o contraseña incorrectos'
          return { success: false, message: this.error }
        }

        const { profile, error: profileError } = await this.fetchProfileForAuthUser(data.user)
        if (profileError || !profile) {
          return this.rejectUnauthorizedAuthSession('Tu correo no está autorizado. Contacte al administrador.')
        }

        if (profile.Rol === 'inactivo') {
          return this.rejectUnauthorizedAuthSession('Usuario inactivo. Contacte al administrador.')
        }

        if (profile.metodo_login === LOGIN_METHODS.google) {
          return this.rejectUnauthorizedAuthSession('Esta cuenta entra con Google. Usa el botón de Google.')
        }

        if (!profile.auth_user_id) {
          await supabase
            .from('Usuarios')
            .update({ auth_user_id: data.user.id, email: normalizedEmail })
            .eq('id', profile.id)
          profile.auth_user_id = data.user.id
          profile.email = normalizedEmail
        }

        this.authMode = 'supabase'
        return this.prepareMfaStep()
      } catch (err) {
        this.error = 'Ocurrió un error inesperado'
        console.error('Authenticator login error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async verifyAuthenticatorCode(code) {
      const trimmedCode = String(code || '').replace(/\s+/g, '')
      if (!this.mfa.factorId) {
        this.error = 'No hay un factor de Authenticator pendiente'
        return { success: false, message: this.error }
      }
      if (!/^\d{6}$/.test(trimmedCode)) {
        this.error = 'El código debe tener 6 dígitos'
        return { success: false, message: this.error }
      }

      this.loading = true
      this.error = null

      try {
        const challenge = await supabase.auth.mfa.challenge({ factorId: this.mfa.factorId })
        if (challenge.error) {
          this.error = challenge.error.message || 'No se pudo validar el código'
          return { success: false, message: this.error }
        }

        const verify = await supabase.auth.mfa.verify({
          factorId: this.mfa.factorId,
          challengeId: challenge.data.id,
          code: trimmedCode
        })

        if (verify.error) {
          this.error = 'Código incorrecto o vencido. Inténtalo de nuevo.'
          return { success: false, message: this.error }
        }

        const { data: userData } = await supabase.auth.getUser()
        const authUser = userData?.user
        const { profile, error } = await this.fetchAuthorizedProfile(authUser)
        if (error || !profile) {
          return this.rejectUnauthorizedAuthSession(this.unauthorizedMessageForAuthUser(authUser))
        }
        if (profile.Rol === 'inactivo') {
          return this.rejectUnauthorizedAuthSession('Usuario inactivo. Contacte al administrador.')
        }

        const linked = await this.linkAuthUserToProfile(profile, authUser)
        return this.completeHourlySession(linked, this.sessionModeForAuthUser(authUser))
      } catch (err) {
        this.error = 'Ocurrió un error inesperado'
        console.error('MFA verify error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async cancelAuthenticatorLogin() {
      this.clearMfaState()
      this.error = null
      this.googleLoginPending = false
      if (!this.user || usesSupabaseSession(this.authMode)) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
        if (usesSupabaseSession(this.authMode) && !this.user) {
          this.clearLocalSession()
        }
      }
    },

    async logout() {
      const casasStore = useCasasStore()
      const wasSupabase = usesSupabaseSession(this.authMode)

      this.clearLocalSession()

      if (wasSupabase) {
        await supabase.auth.signOut({ scope: 'global' }).catch((error) => {
          console.error('Supabase logout error:', error)
        })
      }

      try {
        await casasStore.clearHomeSessionState()
      } catch (error) {
        console.error('Logout cleanup error:', error)
      }
    }
  }
})
