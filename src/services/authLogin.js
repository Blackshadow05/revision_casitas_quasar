import { supabase } from '../supabase'

const parseFunctionError = async (error) => {
  try {
    const context = error?.context
    if (context && typeof context.json === 'function') {
      const parsed = await context.json()
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch (_parseError) {
    return null
  }

  return null
}

const normalizeFailure = (payload, fallbackMessage) => ({
  ok: false,
  error: payload?.error || payload?.message || fallbackMessage,
  code: payload?.code || null,
  useGoogle: Boolean(payload?.useGoogle),
  useAuthenticator: Boolean(payload?.useAuthenticator)
})

export const passwordLogin = async ({ usuario, password }) => {
  try {
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: { usuario, password }
    })

    if (error) {
      const payload = await parseFunctionError(error)
      return normalizeFailure(payload, 'No se pudo iniciar sesión. Inténtalo de nuevo.')
    }

    if (!data?.ok || !data?.authUser?.email || !data?.authUser?.password) {
      return normalizeFailure(data, 'No se pudo iniciar sesión. Inténtalo de nuevo.')
    }

    return {
      ok: true,
      profile: data.profile,
      credentials: {
        email: data.authUser.email,
        password: data.authUser.password
      }
    }
  } catch (error) {
    console.error('passwordLogin error:', error)
    return {
      ok: false,
      error: 'No se pudo conectar con el servidor. Revisa tu conexión.',
      code: 'network_error',
      useGoogle: false,
      useAuthenticator: false
    }
  }
}

export const fetchSessionProfile = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('session-profile', {
      body: {}
    })

    if (error) {
      const payload = await parseFunctionError(error)
      return normalizeFailure(payload, 'No se pudo verificar la sesión.')
    }

    if (!data?.ok || !data?.profile) {
      return normalizeFailure(data, 'No se pudo verificar la sesión.')
    }

    return { ok: true, profile: data.profile }
  } catch (error) {
    console.error('fetchSessionProfile error:', error)
    return {
      ok: false,
      error: 'No se pudo conectar con el servidor. Revisa tu conexión.',
      code: 'network_error',
      useGoogle: false,
      useAuthenticator: false
    }
  }
}
