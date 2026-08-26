import { boot } from 'quasar/wrappers'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'

export default boot(async () => {
  const authStore = useAuthStore()
  await authStore.restoreSession()

  const resumeIfNeeded = () => {
    authStore.resumeAfterExternalGoogleLogin()
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      resumeIfNeeded()
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      resumeIfNeeded()
    }
  })
  window.addEventListener('focus', resumeIfNeeded)
  window.addEventListener('pageshow', resumeIfNeeded)
})
