import { initializeApp } from 'firebase/app'
import { getMessaging, isSupported } from 'firebase/messaging'

const cleanConfigValue = (value, fallback) => String(value || fallback || '').replace(/\s+/g, '').replace(/^['"`]|['"`]$/g, '')

export const firebaseConfig = {
  apiKey: cleanConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, 'AIzaSyBRpfT9XBzwKuE3jS7qIAtnpESAoEKoo_4'),
  authDomain: cleanConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'revision-casitas-fcm.firebaseapp.com'),
  projectId: cleanConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'revision-casitas-fcm'),
  storageBucket: cleanConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'revision-casitas-fcm.firebasestorage.app'),
  messagingSenderId: cleanConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, '1054627324444'),
  appId: cleanConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, '1:1054627324444:web:25c4b3c21c2404c74075d9'),
  measurementId: cleanConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, 'G-XKDYGJJFYF')
}

export const firebaseApp = initializeApp(firebaseConfig)

export async function getFirebaseMessaging () {
  if (!(await isSupported())) return null
  return getMessaging(firebaseApp)
}
