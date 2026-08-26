import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOGIN_METHODS = new Set(['password', 'google', 'authenticator'])
const DEDUPE_WINDOW_MS = 90 * 1000

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

const firstForwardedIp = (value: string | null) => {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first || null
}

const getClientIp = (request: Request) => {
  return (
    firstForwardedIp(request.headers.get('x-forwarded-for')) ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    null
  )
}

const truncate = (value: unknown, max = 512) => {
  const text = String(value || '').trim()
  if (!text) return null
  return text.slice(0, max)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'La función no está configurada.' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const body = await request.json()
    const userId = Number(body?.userId)
    const usuario = String(body?.usuario || '').trim()
    const metodo = String(body?.metodo || '').trim()
    const userAgent = truncate(body?.userAgent || request.headers.get('user-agent'))
    const ipAddress = getClientIp(request)

    if (!Number.isInteger(userId) || userId <= 0 || !usuario) {
      return jsonResponse({ error: 'El usuario es obligatorio.' }, 400)
    }

    if (!LOGIN_METHODS.has(metodo)) {
      return jsonResponse({ error: 'El método de acceso no es válido.' }, 400)
    }

    const { data: profile, error: profileError } = await admin
      .from('Usuarios')
      .select('id, Usuario, auth_user_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile || profile.Usuario !== usuario) {
      return jsonResponse({ error: 'No se encontró ese usuario.' }, 404)
    }

    const authHeader = request.headers.get('Authorization') || ''
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (jwt && jwt !== anonKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data: authData } = await userClient.auth.getUser()
      if (authData?.user?.id && profile.auth_user_id && authData.user.id !== profile.auth_user_id) {
        return jsonResponse({ error: 'La sesión no coincide con este usuario.' }, 403)
      }
    }

    const loggedAt = new Date().toISOString()

    const { data: lastLog } = await admin
      .from('login_logs')
      .select('id, logged_at, ip_address')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastLoggedAt = lastLog?.logged_at ? new Date(lastLog.logged_at).getTime() : 0
    const isDuplicate =
      Boolean(lastLog) &&
      lastLog.ip_address === ipAddress &&
      Number.isFinite(lastLoggedAt) &&
      Date.now() - lastLoggedAt < DEDUPE_WINDOW_MS

    if (!isDuplicate) {
      const { error: insertError } = await admin.from('login_logs').insert({
        user_id: profile.id,
        usuario: profile.Usuario,
        ip_address: ipAddress,
        user_agent: userAgent,
        metodo,
        logged_at: loggedAt,
      })

      if (insertError) {
        return jsonResponse({ error: insertError.message }, 400)
      }
    }

    const { error: updateError } = await admin
      .from('Usuarios')
      .update({
        ultimo_login_at: loggedAt,
        ultimo_login_ip: ipAddress,
      })
      .eq('id', profile.id)

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400)
    }

    return jsonResponse({
      ok: true,
      ip_address: ipAddress,
      logged_at: loggedAt,
      duplicated: isDuplicate,
    })
  } catch (error) {
    console.error('record-login error:', error)
    return jsonResponse({ error: 'Ocurrió un error inesperado.' }, 500)
  }
})
