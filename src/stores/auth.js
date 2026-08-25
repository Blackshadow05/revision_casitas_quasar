import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import { useCasasStore } from './casas'

export const USER_MANAGERS = ['Esteban B', 'JosephR', 'Ramiro Q']

const LEGACY_SESSION_DAYS = 6
const SUPABASE_SESSION_HOURS = 8
const USER_STORAGE_KEY = 'user'
const EXPIRY_STORAGE_KEY = 'sessionExpiry'
const AUTH_MODE_KEY = 'authMode'
const SESSION_STARTED_KEY = 'sessionStartedAt'

const PROFILE_COLUMNS = 'id, Usuario, Rol, email, auth_user_id, totp_enrolled'

const toProfile = (row) => {
  if (!row || typeof row !== 'object') return null

  return {
    id: row.id,
    Usuario: row.Usuario,
    Rol: row.Rol,
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

const loadStoredAuthMode = () => {
  const mode = localStorage.getItem(AUTH_MODE_KEY)
  return mode === 'supabase' || mode === 'legacy' ? mode : null
}

const loadStoredUser = () => {
  if (loadStoredAuthMode() === 'supabase') {
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
  if (loadStoredAuthMode() === 'supabase') {
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
      if (!state.sessionExpiry || state.authMode === 'supabase') return 0
      const diffTime = new Date(state.sessionExpiry) - new Date()
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    },
    sessionRemainingLabel: (state) => {
      if (!state.sessionExpiry) return ''
      const diffMs = new Date(state.sessionExpiry) - Date.now()
      if (diffMs <= 0) return 'Expirada'

      if (state.authMode === 'supabase') {
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
    usesAuthenticator: (state) => state.authMode === 'supabase'
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
      this.clearMfaState()
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(EXPIRY_STORAGE_KEY)
      localStorage.removeItem(AUTH_MODE_KEY)
      localStorage.removeItem(SESSION_STARTED_KEY)
    },

    buildExpiry(mode) {
      const expiryDate = new Date()
      if (mode === 'supabase') {
        expiryDate.setHours(expiryDate.getHours() + SUPABASE_SESSION_HOURS)
      } else {
        expiryDate.setDate(expiryDate.getDate() + LEGACY_SESSION_DAYS)
      }
      return expiryDate
    },

    isSupabaseSessionExpired() {
      const startedAt = readDate(localStorage.getItem(SESSION_STARTED_KEY))
      if (!startedAt) return true
      const maxAgeMs = SUPABASE_SESSION_HOURS * 60 * 60 * 1000
      return Date.now() - startedAt.getTime() > maxAgeMs
    },

    async fetchProfileForAuthUser(authUser) {
      const authUserId = authUser?.id
      const email = authUser?.email?.trim().toLowerCase()

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

    async completeAuthenticatorSession(profile) {
      const enrolledProfile = await this.markTotpEnrolled(profile)
      this.persistLocalSession(enrolledProfile, this.buildExpiry('supabase'), 'supabase')
      this.clearMfaState()
      return { success: true, userId: enrolledProfile.id }
    },

    async rejectUnauthorizedAuthSession(message) {
      this.error = message
      this.clearMfaState()
      await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
      return { success: false, message }
    },

    async prepareMfaStep() {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalError) {
        this.error = aalError.message || 'No se pudo verificar el segundo factor'
        return { success: false, message: this.error }
      }

      if (aalData?.currentLevel === 'aal2') {
        const { data: sessionData } = await supabase.auth.getUser()
        const { profile, error } = await this.fetchProfileForAuthUser(sessionData?.user)
        if (error || !profile) {
          return this.rejectUnauthorizedAuthSession('Tu correo no está autorizado. Contacte al administrador.')
        }
        if (profile.Rol === 'inactivo') {
          return this.rejectUnauthorizedAuthSession('Usuario inactivo. Contacte al administrador.')
        }
        return this.completeAuthenticatorSession(profile)
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) {
        this.error = factorsError.message || 'No se pudieron leer los factores MFA'
        return { success: false, message: this.error }
      }

      const verified = (factorsData?.totp || []).find((factor) => factor.status === 'verified')
      if (verified) {
        this.mfa = {
          step: 'challenge',
          factorId: verified.id,
          qrCode: null,
          secret: null
        }
        return { success: false, needsChallenge: true }
      }

      const unverified = (factorsData?.totp || []).filter((factor) => factor.status === 'unverified')
      for (const factor of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => null)
      }

      return this.startTotpEnrollment()
    },

    async startTotpEnrollment() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Google Authenticator'
      })

      if (error) {
        this.error = error.message || 'No se pudo generar el código de Authenticator'
        return { success: false, message: this.error }
      }

      this.mfa = {
        step: 'enroll',
        factorId: data.id,
        qrCode: data.totp?.qr_code || null,
        secret: data.totp?.secret || null
      }

      return { success: false, needsEnroll: true }
    },

    async restoreSession() {
      this.restoring = true
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session

        if (session?.user) {
          const { profile, error } = await this.fetchProfileForAuthUser(session.user)
          if (error || !profile || profile.Rol === 'inactivo') {
            await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
          } else {
            const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
            if (aalData?.currentLevel === 'aal2') {
              const startedAt = readDate(localStorage.getItem(SESSION_STARTED_KEY)) || new Date()
              const expiryDate = new Date(startedAt.getTime() + SUPABASE_SESSION_HOURS * 60 * 60 * 1000)
              if (Date.now() > expiryDate.getTime()) {
                await supabase.auth.signOut({ scope: 'global' }).catch(() => null)
                this.clearLocalSession()
                return false
              }
              this.persistLocalSession(profile, expiryDate, 'supabase', startedAt)
              return true
            }

            this.authMode = 'supabase'
            await this.prepareMfaStep()
            return false
          }
        }

        if (this.authMode === 'supabase') {
          this.clearLocalSession()
          return false
        }

        return this.checkSessionExpiry()
      } finally {
        this.restoring = false
      }
    },

    async checkSessionExpiry() {
      if (this.authMode === 'supabase' && this.isSupabaseSessionExpired()) {
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

        if (data.totp_enrolled) {
          this.error = 'Tu cuenta ya usa Google Authenticator. Entra con el botón Authenticator.'
          return { success: false, message: this.error, useAuthenticator: true }
        }

        this.persistLocalSession(data, this.buildExpiry('legacy'), 'legacy')
        await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
        return { success: true, userId: data.id }
      } catch (err) {
        this.error = 'Ocurrió un error inesperado'
        console.error('Login error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
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
        const { profile, error } = await this.fetchProfileForAuthUser(userData?.user)
        if (error || !profile) {
          return this.rejectUnauthorizedAuthSession('Tu correo no está autorizado. Contacte al administrador.')
        }
        if (profile.Rol === 'inactivo') {
          return this.rejectUnauthorizedAuthSession('Usuario inactivo. Contacte al administrador.')
        }

        return this.completeAuthenticatorSession(profile)
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
      if (!this.user || this.authMode === 'supabase') {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
        if (this.authMode === 'supabase' && !this.user) {
          this.clearLocalSession()
        }
      }
    },

    async logout() {
      const casasStore = useCasasStore()
      const wasSupabase = this.authMode === 'supabase'

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
