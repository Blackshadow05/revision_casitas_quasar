import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3'
import {
  evaluateProfileAccess,
  PROFILE_COLUMNS,
  toClientProfile,
  type UsuarioRecord,
} from '../_shared/auth-rules.ts'
import {
  getBearerToken,
  jsonResponse,
  preflightResponse,
  resolveServiceKey,
  resolveSupabaseUrl,
} from '../_shared/http.ts'

const statusForCode = (code: string): number => {
  if (code === 'invalid_credentials') return 401
  if (code === 'authenticator_required') return 403
  return 403
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return preflightResponse()
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = resolveSupabaseUrl()
  const serviceKey = resolveServiceKey()

  if (!supabaseUrl || !serviceKey) {
    console.error('session-profile: falta configuración de Supabase.')
    return jsonResponse({ ok: false, error: 'El servicio de sesión no está configurado.' }, 500)
  }

  const jwt = getBearerToken(request)
  if (!jwt) {
    return jsonResponse({ ok: false, error: 'Sesión no válida o expirada.', code: 'no_session' }, 401)
  }

  try {
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: authData, error: authError } = await userClient.auth.getUser()
    const authUser = authData?.user

    if (authError || !authUser?.id) {
      return jsonResponse({ ok: false, error: 'Sesión no válida o expirada.', code: 'no_session' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: byId, error: byIdError } = await admin
      .from('Usuarios')
      .select(PROFILE_COLUMNS)
      .eq('auth_user_id', authUser.id)
      .maybeSingle<UsuarioRecord>()

    if (byIdError) {
      console.error('session-profile: error consultando Usuarios:', byIdError.message)
      return jsonResponse({ ok: false, error: 'Ocurrió un error inesperado.' }, 500)
    }

    let profile = byId

    if (!profile) {
      const usuarioMetadata = (authUser.user_metadata as Record<string, unknown> | null)?.Usuario
      const usuario = typeof usuarioMetadata === 'string' ? usuarioMetadata.trim() : ''

      if (usuario) {
        const { data: byUsuario, error: byUsuarioError } = await admin
          .from('Usuarios')
          .select(PROFILE_COLUMNS)
          .eq('Usuario', usuario)
          .maybeSingle<UsuarioRecord>()

        if (byUsuarioError) {
          console.error('session-profile: error consultando Usuarios:', byUsuarioError.message)
          return jsonResponse({ ok: false, error: 'Ocurrió un error inesperado.' }, 500)
        }

        profile = byUsuario
      }
    }

    const access = evaluateProfileAccess(profile)
    if (!access.allowed) {
      return jsonResponse(
        {
          ok: false,
          error: access.message,
          code: access.code,
          useGoogle: access.useGoogle,
          useAuthenticator: access.useAuthenticator,
        },
        statusForCode(access.code),
      )
    }

    return jsonResponse({
      ok: true,
      profile: toClientProfile(profile as UsuarioRecord),
    })
  } catch (error) {
    console.error('session-profile error:', error)
    return jsonResponse({ ok: false, error: 'Ocurrió un error inesperado.' }, 500)
  }
})
