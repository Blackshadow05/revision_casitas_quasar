import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'

/*
 * When adding new properties to your store, you should also
 * update the types in the store/index.d.ts file.
 */

export default store((/* { ssrContext } */) => {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(SomePiniaPlugin)

  return pinia
})
