importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBRpfT9XBzwKuE3jS7qIAtnpESAoEKoo_4',
  authDomain: 'revision-casitas-fcm.firebaseapp.com',
  projectId: 'revision-casitas-fcm',
  storageBucket: 'revision-casitas-fcm.firebasestorage.app',
  messagingSenderId: '1054627324444',
  appId: '1:1054627324444:web:25c4b3c21c2404c74075d9',
  measurementId: 'G-XKDYGJJFYF'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {}
  if (payload.notification && !data.forceShow) return

  const title = data.title || 'Quiniela Mundial 2026'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-128x128.png',
    vibrate: [80, 40, 80],
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/quiniela' }
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/quiniela'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/quiniela') && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
