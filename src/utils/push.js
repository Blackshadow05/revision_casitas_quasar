import { deleteToken, getToken } from 'firebase/messaging'
import { getInstallations, deleteInstallations, getToken as getInstallationToken } from 'firebase/installations'
import { supabase } from '../supabase'
import { getFirebaseMessaging, firebaseApp } from '../firebase'

const TOKEN_KEY = 'qn_fcm_token'
const MIGR_KEY = 'qn_push_mig_fcm'
const VAPID_KEY = 'BEVnxviHX1d8x7LKFercuRy2hdzkM0fWq2V8CNAFy47wS92Rst9RLb8koDCWzqhHlYyt2P5eJ5wfJNJ3HJHQRow'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function fcmErrorText (error) {
  return [
    error && error.code,
    error && error.message,
    error && error.customData && error.customData.serverMessage,
    error && error.customData && error.customData.errorInfo
  ].filter(Boolean).join(' ').toLowerCase()
}

function needsFcmStateReset (error) {
  const text = fcmErrorText(error)
  return text.includes('token-subscribe-failed') ||
    text.includes('missing required authentication credential') ||
    text.includes('firebase-installations') ||
    text.includes('fis')
}

async function borrarPushAntiguo (reg) {
  if (!reg || !('PushManager' in window)) return false
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return false
  try { await supabase.rpc('qn_borrar_push_sub', { p_endpoint: sub.endpoint }) } catch (e) {}
  try { await sub.unsubscribe() } catch (e) {}
  return true
}

async function resetFcmLocalState ({ messaging, reg }) {
  const storedToken = localStorage.getItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)

  if (storedToken) {
    try { await supabase.rpc('qn_borrar_fcm_token', { p_token: storedToken }) } catch (e) {}
  }

  try { await deleteToken(messaging) } catch (e) {}
  try { await borrarPushAntiguo(reg) } catch (e) {}

  const installations = getInstallations(firebaseApp)
  try { await deleteInstallations(installations) } catch (e) {}
  try { await getInstallationToken(installations, true) } catch (e) {}
  await wait(300)
}

export async function limpiarPushAntiguo (registration) {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGR_KEY) === '1') return
  try {
    if (localStorage.getItem(TOKEN_KEY)) { localStorage.setItem(MIGR_KEY, '1'); return }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      localStorage.setItem(MIGR_KEY, '1')
      return
    }
    const reg = registration || await navigator.serviceWorker.getRegistration()
    await borrarPushAntiguo(reg)
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
  try { await reg.update() } catch (e) {}
  try { await borrarPushAntiguo(reg) } catch (e) {}

  let token
  try {
    token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg })
  } catch (e) {
    await resetFcmLocalState({ messaging, reg })
    try {
      token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg })
    } catch (retryError) {
      if (needsFcmStateReset(e) || needsFcmStateReset(retryError)) throw new Error('FCM_STALE_DEVICE')
      throw retryError
    }
  }
  if (!token) throw new Error('NO_TOKEN')

  const { error } = await supabase.rpc('qn_guardar_fcm_token', {
    p_nombre: identity.nombre,
    p_pin: identity.pin,
    p_token: token,
    p_ua: navigator.userAgent
  })
  if (error) throw error

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(MIGR_KEY, '1')
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
