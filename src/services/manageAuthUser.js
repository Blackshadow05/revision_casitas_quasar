import { supabase } from '../supabase'

const invokeManageAuthUser = async (payload) => {
  const { data, error } = await supabase.functions.invoke('manage-auth-user', {
    body: payload
  })

  if (error) {
    let message = error.message || 'No se pudo completar la operación'
    try {
      const context = error.context
      if (context && typeof context.json === 'function') {
        const parsed = await context.json()
        if (parsed?.error) message = parsed.error
      }
    } catch (_parseError) {
      // keep fallback message
    }
    throw new Error(message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

export const inviteAuthenticatorUser = (payload) =>
  invokeManageAuthUser({ action: 'invite', ...payload })

export const resetAuthenticatorFactor = (payload) =>
  invokeManageAuthUser({ action: 'reset_mfa', ...payload })
