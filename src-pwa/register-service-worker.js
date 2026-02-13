import { registerSW } from 'virtual:pwa-register'
import { Notify } from 'quasar'

registerSW({
  immediate: true,
  onNeedRefresh() {
    Notify.create({
      message: 'Nueva versión disponible.',
      icon: 'update',
      closeBtn: 'Actualizar',
      timeout: 0,
      onDismiss() {
        location.reload()
      }
    })
  },
  onOfflineReady() {
    Notify.create({
      message: 'La aplicación está lista para funcionar sin conexión.',
      icon: 'cloud_done',
      color: 'positive'
    })
  },
  onRegistered(registration) {
    console.log('Service Worker registrado correctamente.')
  },
  onRegisterError(error) {
    console.error('Error al registrar el Service Worker:', error)
  }
})
