/*
 * This file is runs in the browser context.
 * It is used to register the service worker.
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // The path here is relative to the root of your app
    // Quasar will automatically pick the correct filename during build
    navigator.serviceWorker.register('sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err)
    })
  })
}
