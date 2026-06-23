import { supabase } from '../supabase'

function urlBase64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported () {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
}

export function pushDenied () {
  return pushSupported() && Notification.permission === 'denied'
}

export async function getSubscription () {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function isSubscribed () {
  const sub = await getSubscription()
  return !!sub
}

export async function subscribePush (identity, vapidPublic) {
  if (!pushSupported()) throw new Error('UNSUPPORTED')
  if (!vapidPublic) throw new Error('NO_VAPID')
  if (!identity || !identity.nombre || !identity.pin) throw new Error('NO_IDENTITY')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('PERM_DENIED')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic)
    })
  }

  const j = sub.toJSON()
  const { error } = await supabase.rpc('qn_guardar_push_sub', {
    p_nombre: identity.nombre,
    p_pin: identity.pin,
    p_endpoint: sub.endpoint,
    p_p256dh: j.keys.p256dh,
    p_auth: j.keys.auth,
    p_ua: navigator.userAgent
  })
  if (error) throw error
  return sub
}

export async function unsubscribePush () {
  const sub = await getSubscription()
  if (!sub) return
  try {
    await supabase.rpc('qn_borrar_push_sub', { p_endpoint: sub.endpoint })
  } catch (e) {}
  await sub.unsubscribe()
}
