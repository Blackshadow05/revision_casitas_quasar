import { Notify } from 'quasar'

function mostrarActualizacion () {
  Notify.create({
    message: 'Nueva version disponible',
    caption: 'Toca Recargar para aplicar los cambios',
    color: 'green-9',
    icon: 'system_update',
    position: 'top',
    timeout: 0,
    actions: [
      { label: 'Recargar', color: 'white', handler: () => window.location.reload() },
      { label: 'Despues', color: 'grey-3' }
    ]
  })
}

export default () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (window.__swUpdated) { mostrarActualizacion(); return }
  window.addEventListener('sw-updated', mostrarActualizacion)
}
