import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USER_MANAGERS = ['Esteban B', 'JosephR', 'Ramiro Q']
const PROFILE_COLUMNS = 'id, Usuario, Rol, email, auth_user_id, totp_enrolled, password_hash'

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase()

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

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
    const action = body?.action === 'reset_mfa' ? 'reset_mfa' : 'invite'
    const usuarioNombre = String(body?.usuario || '').trim()

    if (!usuarioNombre) {
      return jsonResponse({ error: 'El usuario es obligatorio.' }, 400)
    }

    const authHeader = request.headers.get('Authorization') || ''
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    let managerNombre: string | null = null

    if (jwt) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${jwt}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        })
        const { data: authData } = await userClient.auth.getUser()
        if (authData?.user?.id) {
          const { data: managerProfile } = await admin
            .from('Usuarios')
            .select('Usuario, Rol')
            .eq('auth_user_id', authData.user.id)
            .maybeSingle()

          if (managerProfile && USER_MANAGERS.includes(managerProfile.Usuario) && managerProfile.Rol !== 'inactivo') {
            managerNombre = managerProfile.Usuario
          }
        }
      } catch (_error) {
        // El header puede traer la anon key durante el login legado.
      }
    }

    if (!managerNombre) {
      const managerUsuario = String(body?.managerUsuario || '').trim()
      const managerPassword = String(body?.managerPassword || '')
      if (!managerUsuario || !managerPassword) {
        return jsonResponse({ error: 'Confirma tu contraseña de administrador para continuar.' }, 401)
      }

      const { data: managerProfile } = await admin
        .from('Usuarios')
        .select('Usuario, Rol')
        .eq('Usuario', managerUsuario)
        .eq('password_hash', managerPassword)
        .maybeSingle()

      if (!managerProfile || !USER_MANAGERS.includes(managerProfile.Usuario) || managerProfile.Rol === 'inactivo') {
        return jsonResponse({ error: 'No tienes permiso para administrar autenticación.' }, 403)
      }

      managerNombre = managerProfile.Usuario
    }

    const { data: target, error: targetError } = await admin
      .from('Usuarios')
      .select(PROFILE_COLUMNS)
      .eq('Usuario', usuarioNombre)
      .maybeSingle()

    if (targetError || !target) {
      return jsonResponse({ error: 'No se encontró ese usuario en la app.' }, 404)
    }

    if (action === 'reset_mfa') {
      if (!target.auth_user_id) {
        return jsonResponse({ error: 'Ese usuario todavía no tiene cuenta de Authenticator.' }, 400)
      }

      const factorsRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${target.auth_user_id}/factors`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        },
      )
      const factorsJson = await factorsRes.json().catch(() => null)
      const factors = Array.isArray(factorsJson)
        ? factorsJson
        : (factorsJson?.factors || factorsJson?.totp || [])

      for (const factor of factors) {
        const factorId = factor?.id
        if (!factorId) continue
        await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${target.auth_user_id}/factors/${factorId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
            },
          },
        )
      }

      const { error: updateError } = await admin
        .from('Usuarios')
        .update({ totp_enrolled: false })
        .eq('id', target.id)

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 400)
      }

      return jsonResponse({
        ok: true,
        message: 'Authenticator restablecido. El usuario debe volver a escanear el QR.',
      })
    }

    const email = normalizeEmail(body?.email)
    const authPassword = String(body?.authPassword || '')

    if (!isEmail(email)) {
      return jsonResponse({ error: 'El correo no es válido.' }, 400)
    }
    if (authPassword.length < 6) {
      return jsonResponse({ error: 'La contraseña de Auth debe tener al menos 6 caracteres.' }, 400)
    }

    const { data: existingByEmail } = await admin
      .from('Usuarios')
      .select('id, Usuario')
      .ilike('email', email)
      .maybeSingle()

    if (existingByEmail && existingByEmail.id !== target.id) {
      return jsonResponse({ error: `Ese correo ya está asignado a ${existingByEmail.Usuario}.` }, 409)
    }

    let authUserId = target.auth_user_id as string | null

    if (!authUserId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: authPassword,
        email_confirm: true,
        user_metadata: {
          Usuario: target.Usuario,
          Rol: target.Rol,
          invited_by: managerNombre,
        },
      })

      if (createError) {
        const alreadyExists = /already been registered|already exists|duplicate/i.test(createError.message || '')
        if (!alreadyExists) {
          return jsonResponse({ error: createError.message }, 400)
        }

        const { data: listData, error: listError } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        })
        if (listError) {
          return jsonResponse({ error: listError.message }, 400)
        }

        const found = (listData?.users || []).find((user) => user.email?.toLowerCase() === email)
        if (!found) {
          return jsonResponse({ error: 'El correo ya existe en Auth pero no se pudo vincular.' }, 400)
        }

        const { error: updateAuthError } = await admin.auth.admin.updateUserById(found.id, {
          password: authPassword,
          email_confirm: true,
          user_metadata: {
            Usuario: target.Usuario,
            Rol: target.Rol,
            invited_by: managerNombre,
          },
        })
        if (updateAuthError) {
          return jsonResponse({ error: updateAuthError.message }, 400)
        }
        authUserId = found.id
      } else {
        authUserId = created.user?.id || null
      }
    } else {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(authUserId, {
        email,
        password: authPassword,
        email_confirm: true,
      })
      if (updateAuthError) {
        return jsonResponse({ error: updateAuthError.message }, 400)
      }
    }

    if (!authUserId) {
      return jsonResponse({ error: 'No se pudo crear la cuenta de Auth.' }, 500)
    }

    const { error: linkError } = await admin
      .from('Usuarios')
      .update({
        email,
        auth_user_id: authUserId,
        totp_enrolled: target.auth_user_id ? Boolean(target.totp_enrolled) : false,
      })
      .eq('id', target.id)

    if (linkError) {
      return jsonResponse({ error: linkError.message }, 400)
    }

    return jsonResponse({
      ok: true,
      message: 'Cuenta de Authenticator lista. El usuario debe entrar con correo, contraseña de Auth y el QR.',
      auth_user_id: authUserId,
      email,
    })
  } catch (error) {
    console.error('manage-auth-user error:', error)
    return jsonResponse({ error: 'Ocurrió un error inesperado.' }, 500)
  }
})
