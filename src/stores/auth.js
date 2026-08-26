import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import { useCasasStore } from './casas'

export const USER_MANAGERS = ['Esteban B', 'JosephR', 'Ramiro Q']

export const LOGIN_METHODS = {
  password: 'password',
  google: 'google'
}

const PROFILE_FIELDS = 'id, Usuario, Rol, metodo_login, email, auth_user_id'

const loadStoredUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user'))

    if (!stored || typeof stored !== 'object') {
      return null
    }

    if ('password_hash' in stored) {
      delete stored.password_hash
      localStorage.setItem('user', JSON.stringify(stored))
    }

    return stored
  } catch (_error) {
    localStorage.removeItem('user')
    return null
  }
}

export function normalizeEmail (value) {
  return String(value || '').trim().toLowerCase()
}

function toProfile (row) {
  if (!row) return null
  return {
    id: row.id,
    Usuario: row.Usuario,
    Rol: row.Rol,
    metodo_login: row.metodo_login || LOGIN_METHODS.password,
    email: row.email || null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadStoredUser(),
    sessionExpiry: localStorage.getItem('sessionExpiry') ? new Date(localStorage.getItem('sessionExpiry')) : null,
    loading: false,
    error: null
  }),
  
  getters: {
    isLoggedIn: (state) => {
      if (!state.user) return false
      if (state.sessionExpiry && new Date() > state.sessionExpiry) {
        return false
      }
      return true
    },
    userId: (state) => {
      return state.user?.id || null
    },
    daysRemaining: (state) => {
      if (!state.sessionExpiry) return 0
      const now = new Date()
      const expiry = new Date(state.sessionExpiry)
      const diffTime = expiry - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    },
    canAdd: (state) => {
      if (!state.user) return false
      // inactivo users cannot add data
      if (state.user.Rol === 'inactivo') return false
      return true
    },
    canEdit: (state) => {
      if (!state.user) return false
      // inactivo users cannot edit data
      if (state.user.Rol === 'inactivo') return false
      return true
    },
    canView: (state) => {
      if (!state.user) return false
      return true
    },
    isSuperAdmin: (state) => {
      return state.user?.Rol === 'SuperAdmin'
    },
    canManageUsers: (state) => {
      return USER_MANAGERS.includes(state.user?.Usuario)
    }
  },
  
  actions: {
    persistSession (profile) {
      const user = toProfile(profile)
      this.user = user
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 6)
      this.sessionExpiry = expiryDate
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('sessionExpiry', expiryDate.toISOString())
    },

    async checkSessionExpiry() {
      if (this.sessionExpiry && new Date() > this.sessionExpiry) {
        await this.logout()
        return false
      }
      return true
    },
    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('Usuarios')
          .select(PROFILE_FIELDS)
          .eq('Usuario', username)
          .eq('password_hash', password)
          .single()

        if (error || !data) {
          this.error = 'Usuario o contraseña incorrectos'
          return { success: false, message: this.error }
        }

        if (data.metodo_login === LOGIN_METHODS.google) {
          this.error = 'Este usuario entra con Google. Usa el botón de Google.'
          return { success: false, message: this.error }
        }

        // Check if user is inactive
        if (data.Rol === 'inactivo') {
          this.error = 'Usuario inactivo. Contacte al administrador.'
          return { success: false, message: this.error }
        }

        this.persistSession(data)
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
        const redirectTo = `${window.location.origin}/`
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              prompt: 'select_account'
            }
          }
        })

        if (error) {
          this.error = error.message || 'No se pudo abrir Google'
          return { success: false, message: this.error }
        }

        return { success: true, redirected: true }
      } catch (err) {
        this.error = 'Ocurrió un error inesperado'
        console.error('Google login error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    async consumeGoogleRedirect () {
      try {
        const href = typeof window === 'undefined' ? '' : `${window.location.search}${window.location.hash}`
        const oauthReturn = /access_token|refresh_token|code=|error=/.test(href)

        if (this.isLoggedIn && !oauthReturn) {
          return { success: true, skipped: true }
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Google session error:', sessionError)
          return { success: false }
        }

        const session = sessionData?.session
        const email = normalizeEmail(session?.user?.email)
        if (!session || !email) {
          return { success: false, skipped: true }
        }

        const { data: rows, error } = await supabase
          .from('Usuarios')
          .select(PROFILE_FIELDS)
          .eq('metodo_login', LOGIN_METHODS.google)

        const data = (rows || []).find((row) => normalizeEmail(row.email) === email)

        if (error || !data) {
          await supabase.auth.signOut()
          this.error = 'Este correo de Google no está autorizado. Pide al administrador que lo asigne.'
          return { success: false, message: this.error }
        }

        if (data.Rol === 'inactivo') {
          await supabase.auth.signOut()
          this.error = 'Usuario inactivo. Contacte al administrador.'
          return { success: false, message: this.error }
        }

        if (session.user?.id && data.auth_user_id !== session.user.id) {
          await supabase
            .from('Usuarios')
            .update({ auth_user_id: session.user.id, email })
            .eq('id', data.id)
        }

        this.persistSession({ ...data, email })
        this.error = null
        return { success: true, userId: data.id }
      } catch (err) {
        console.error('Google redirect error:', err)
        this.error = 'No se pudo completar el inicio con Google'
        return { success: false, message: this.error }
      }
    },

    async logout() {
      const casasStore = useCasasStore()

      this.user = null
      this.sessionExpiry = null
      localStorage.removeItem('user')
      localStorage.removeItem('sessionExpiry')

      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Supabase signOut error:', error)
      }

      try {
        await casasStore.clearHomeSessionState()
      } catch (error) {
        console.error('Logout cleanup error:', error)
      }
    }
  }
})
