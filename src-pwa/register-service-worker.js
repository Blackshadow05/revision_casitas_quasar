if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller

    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err)
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return
      window.__swUpdated = true
      window.dispatchEvent(new CustomEvent('sw-updated'))
    })
  })
}
