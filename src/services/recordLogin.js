import { supabase } from '../supabase'

export const recordLogin = async ({ userId, usuario, metodo }) => {
  if (!userId || !usuario || !metodo) return null

  const { data, error } = await supabase.functions.invoke('record-login', {
    body: {
      userId,
      usuario,
      metodo,
      userAgent: typeof navigator === 'undefined' ? null : navigator.userAgent
    }
  })

  if (error) {
    throw new Error(error.message || 'No se pudo registrar el acceso')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
