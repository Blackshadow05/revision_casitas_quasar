import { deleteToken, getToken } from 'firebase/messaging'
import { getInstallations, deleteInstallations, getToken as getInstallationToken } from 'firebase/installations'
import { supabase } from '../supabase'
import { getFirebaseMessaging, firebaseApp, firebaseConfig } from '../firebase'

const TOKEN_KEY = 'qn_fcm_token'
const MIGR_KEY = 'qn_push_mig_fcm'
const FIS_KEY = 'qn_fis_installation'
const VAPID_KEY = 'BEVnxviHX1d8x7LKFercuRy2hdzkM0fWq2V8CNAFy47wS92Rst9RLb8koDCWzqhHlYyt2P5eJ5wfJNJ3HJHQRow'
const FCM_REGISTRATION_URL = 'https://fcmregistrations.googleapis.com/v1'
const FIS_URL = 'https://firebaseinstallations.googleapis.com/v1'
const FIS_SDK_VERSION = 'w:0.6.22'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function withTimeout (promise, ms, code) {
  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(code)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function randomBase64Url (length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(byte => alphabet[byte % alphabet.length]).join('')
}

function createFid () {
  return 'cdef'[crypto.getRandomValues(new Uint8Array(1))[0] % 4] + randomBase64Url(21)
}

function arrayBufferToBase64Url (buffer) {
  const bytes = new Uint8Array(buffer)
  let text = ''
  bytes.forEach(byte => { text += String.fromCharCode(byte) })
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToUint8Array (value) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)))
}

async function fetchJson (url, options, errorCode) {
  const response = await withTimeout(fetch(url, options), 15000, errorCode)
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch (e) {}
  if (!response.ok || (data && data.error)) {
    const message = (data && data.error && data.error.message) || text || errorCode
    throw new Error(message)
  }
  return data
}

function readFisCache () {
  try {
    const cached = JSON.parse(localStorage.getItem(FIS_KEY) || 'null')
    if (!cached || !cached.fid || !cached.refreshToken || !cached.authToken) return null
    return cached
  } catch (e) {
    return null
  }
}

function writeFisCache (data) {
  localStorage.setItem(FIS_KEY, JSON.stringify(data))
}

async function createInstallation () {
  const fid = createFid()
  const data = await fetchJson(`${FIS_URL}/projects/${firebaseConfig.projectId}/installations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-goog-api-key': firebaseConfig.apiKey
    },
    body: JSON.stringify({
      fid,
      authVersion: 'FIS_v2',
      appId: firebaseConfig.appId,
      sdkVersion: FIS_SDK_VERSION
    })
  }, 'FIS_CREATE_TIMEOUT')
  const expiresInMs = Number(String(data.authToken.expiresIn || '604800s').replace('s', '')) * 1000
  const cached = {
    fid: data.fid || fid,
    refreshToken: data.refreshToken,
    authToken: data.authToken.token,
    expiresAt: Date.now() + expiresInMs
  }
  writeFisCache(cached)
  return cached
}

async function refreshInstallationAuth (cached) {
  const data = await fetchJson(`${FIS_URL}/projects/${firebaseConfig.projectId}/installations/${cached.fid}/authTokens:generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-goog-api-key': firebaseConfig.apiKey,
      Authorization: `FIS ${cached.refreshToken}`
    },
    body: JSON.stringify({
      installation: {
        sdkVersion: FIS_SDK_VERSION,
        appId: firebaseConfig.appId
      }
    })
  }, 'FIS_AUTH_TIMEOUT')
  const expiresInMs = Number(String(data.expiresIn || '604800s').replace('s', '')) * 1000
  const next = { ...cached, authToken: data.token, expiresAt: Date.now() + expiresInMs }
  writeFisCache(next)
  return next
}

async function getInstallationAuth () {
  const cached = readFisCache()
  if (cached && cached.expiresAt > Date.now() + 60000) return cached
  if (cached) {
    try { return await refreshInstallationAuth(cached) } catch (e) {}
  }
  return createInstallation()
}

async function getPushSubscriptionForFcm (reg, vapidKey) {
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(vapidKey)
  })
}

async function getTokenViaRest (reg, vapidKey) {
  const [installation, subscription] = await Promise.all([
    getInstallationAuth(),
    getPushSubscriptionForFcm(reg, vapidKey)
  ])
  const data = await fetchJson(`${FCM_REGISTRATION_URL}/projects/${firebaseConfig.projectId}/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-goog-api-key': firebaseConfig.apiKey,
      'x-goog-firebase-installations-auth': `FIS ${installation.authToken}`
    },
    body: JSON.stringify({
      web: {
        origin: window.location.host,
        endpoint: subscription.endpoint,
        auth: arrayBufferToBase64Url(subscription.getKey('auth')),
        p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
        applicationPubKey: vapidKey
      }
    })
  }, 'FCM_REGISTRATION_TIMEOUT')
  if (!data || !data.token) throw new Error('NO_TOKEN')
  return data.token
}

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

  localStorage.removeItem(FIS_KEY)
  try { await withTimeout(deleteToken(messaging), 3000, 'DELETE_TOKEN_TIMEOUT') } catch (e) {}
  try { await borrarPushAntiguo(reg) } catch (e) {}

  const installations = getInstallations(firebaseApp)
  try { await deleteInstallations(installations) } catch (e) {}
  try { await withTimeout(getInstallationToken(installations, true), 3000, 'FIS_REFRESH_TIMEOUT') } catch (e) {}
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
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
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
    token = await withTimeout(
      getToken(messaging, { vapidKey, serviceWorkerRegistration: reg }),
      10000,
      'FCM_SDK_TIMEOUT'
    )
  } catch (e) {
    await resetFcmLocalState({ messaging, reg })
    try {
      token = await getTokenViaRest(reg, vapidKey)
    } catch (retryError) {
      if (needsFcmStateReset(e) || needsFcmStateReset(retryError) || e.message === 'FCM_SDK_TIMEOUT') throw new Error('FCM_STALE_DEVICE')
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
