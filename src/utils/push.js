import { deleteToken, getToken } from 'firebase/messaging'
import { supabase } from '../supabase'
import { getFirebaseMessaging } from '../firebase'

const TOKEN_KEY = 'qn_fcm_token'
const MIGR_KEY = 'qn_push_mig_fcm'
const VAPID_KEY = 'BEVnxviHX1d8x7LKFercuRy2hdzkM0fWq2V8CNAFy47wS92Rst9RLb8koDCWzqhHlYyt2P5eJ5wfJNJ3HJHQRow'

export async function limpiarPushAntiguo () {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGR_KEY) === '1') return
  try {
    if (localStorage.getItem(TOKEN_KEY)) { localStorage.setItem(MIGR_KEY, '1'); return }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      localStorage.setItem(MIGR_KEY, '1')
      return
    }
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (sub) {
      try { await supabase.rpc('qn_borrar_push_sub', { p_endpoint: sub.endpoint }) } catch (e) {}
      try { await sub.unsubscribe() } catch (e) {}
    }
  } catch (e) {}
  localStorage.setItem(MIGR_KEY, '1')
}

export function pushSupported () {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window
}

export function pushDenied () {
  return pushSupported() && Notification.permission === 'denied'
}

export async function getSubscription () {
  if (!pushSupported()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export async function isSubscribed () {
  return Notification.permission === 'granted' && !!(await getSubscription())
}

export async function subscribePush (identity, vapidPublic) {
  if (!pushSupported()) throw new Error('UNSUPPORTED')
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || vapidPublic || VAPID_KEY
  if (!vapidKey) throw new Error('NO_VAPID')
  if (!identity || !identity.nombre || !identity.pin) throw new Error('NO_IDENTITY')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('PERM_DENIED')

  const messaging = await getFirebaseMessaging()
  if (!messaging) throw new Error('UNSUPPORTED')

  const reg = await navigator.serviceWorker.ready
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: reg
  })
  if (!token) throw new Error('NO_TOKEN')

  const { error } = await supabase.rpc('qn_guardar_fcm_token', {
    p_nombre: identity.nombre,
    p_pin: identity.pin,
    p_token: token,
    p_ua: navigator.userAgent
  })
  if (error) throw error

  localStorage.setItem(TOKEN_KEY, token)
  return token
}

export async function unsubscribePush () {
  const token = await getSubscription()
  if (!token) return

  try {
    await supabase.rpc('qn_borrar_fcm_token', { p_token: token })
  } catch (e) {}

  try {
    const messaging = await getFirebaseMessaging()
    if (messaging) await deleteToken(messaging)
  } catch (e) {}

  localStorage.removeItem(TOKEN_KEY)
}
