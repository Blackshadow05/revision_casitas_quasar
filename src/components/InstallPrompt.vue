<template>
  <q-dialog v-model="showPrompt" position="bottom" persistent>
    <q-card class="install-card q-pa-md">
      <q-card-section class="row items-center no-wrap">
        <div class="col-auto">
          <q-avatar size="60px" class="q-mr-md shadow-2">
            <img src="icons/icon-128x128.png">
          </q-avatar>
        </div>
        <div class="col">
          <div class="text-h6 text-weight-bold">Instalar Casitas Pro</div>
          <div class="text-caption text-grey-8">
            Instala la aplicación para acceder más rápido y usarla sin conexión.
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="isIOS" class="ios-instructions q-pt-none">
        <div class="row items-center q-gutter-x-sm bg-blue-1 q-pa-sm border-radius-inherit">
          <q-icon name="ios_share" color="primary" size="24px" />
          <div class="text-body2">
            Toca el ícono <strong>'Compartir'</strong> y luego <strong>'Añadir a pantalla de inicio'</strong>.
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat label="Más tarde" color="grey-7" v-close-popup @click="dismiss" />
        <q-btn 
          v-if="!isIOS"
          unelevated 
          label="Instalar Gratis" 
          color="primary" 
          class="install-btn"
          @click="installApp" 
        />
        <q-btn 
          v-else
          unelevated 
          label="Entendido" 
          color="primary" 
          class="install-btn"
          v-close-popup
          @click="dismiss"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'InstallPrompt',
  setup() {
    const showPrompt = ref(false)
    const deferredPrompt = ref(null)
    const isIOS = ref(false)

    const checkPlatform = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      isIOS.value = /iphone|ipad|ipod/.test(userAgent)
      
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

      // Solo mostramos en móviles y si NO está instalada
      if (isMobile && !isStandalone) {
        // En iOS mostramos después de 3 segundos
        if (isIOS.value) {
          setTimeout(() => {
            const dismissed = localStorage.getItem('pwa-prompt-dismissed')
            if (!dismissed) showPrompt.value = true
          }, 3000)
        }
      }
    }

    const installApp = async () => {
      if (!deferredPrompt.value) return
      
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó la instalación')
        showPrompt.value = false
      }
      deferredPrompt.value = null
    }

    const dismiss = () => {
      // Guardar que el usuario lo cerró para no molestar por 7 días
      const nextShow = new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
      localStorage.setItem('pwa-prompt-dismissed', nextShow.toString())
    }

    onMounted(() => {
      checkPlatform()

      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir que Chrome muestre su banner automático
        e.preventDefault()
        deferredPrompt.value = e
        
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        const now = new Date().getTime()
        
        if (!dismissed || now > parseInt(dismissed)) {
          showPrompt.value = true
        }
      })

      window.addEventListener('appinstalled', () => {
        showPrompt.value = false
        deferredPrompt.value = null
      })
    })

    return {
      showPrompt,
      isIOS,
      installApp,
      dismiss
    }
  }
}
</script>

<style scoped>
.install-card {
  border-radius: 20px 20px 0 0;
  max-width: 500px;
  width: 100%;
}

.install-btn {
  border-radius: 12px;
  padding: 8px 24px;
}

.border-radius-inherit {
  border-radius: 12px;
}

.ios-instructions {
  margin-top: 8px;
}
</style>
