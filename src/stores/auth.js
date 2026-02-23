import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
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
    }
  },
  
  actions: {
    checkSessionExpiry() {
      if (this.sessionExpiry && new Date() > this.sessionExpiry) {
        this.logout()
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
          .select('Usuario, Rol, id')
          .eq('Usuario', username)
          .eq('password_hash', password)
          .single()

        if (error) {
          this.error = 'Usuario o contraseña incorrectos'
          return { success: false, message: this.error }
        }

        if (data) {
          // Check if user is inactive
          if (data.Rol === 'inactivo') {
            this.error = 'Usuario inactivo. Contacte al administrador.'
            return { success: false, message: this.error }
          }
          this.user = data
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 6)
          this.sessionExpiry = expiryDate
          localStorage.setItem('user', JSON.stringify(data))
          localStorage.setItem('sessionExpiry', expiryDate.toISOString())
          return { success: true }
        }
      } catch (err) {
        this.error = 'Ocurrió un error inesperado'
        console.error('Login error:', err)
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.sessionExpiry = null
      localStorage.removeItem('user')
      localStorage.removeItem('sessionExpiry')
    }
  }
})
