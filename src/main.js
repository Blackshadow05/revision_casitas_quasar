import { createApp } from 'vue'
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import createRouter from './router'
import App from './App.vue'

import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './css/app.css'

const myApp = createApp(App)
const pinia = createPinia()
const router = createRouter()

myApp.use(pinia)
myApp.use(Quasar, {
  plugins: {},
})

myApp.use(router)

myApp.mount('#q-app')