<template>
  <router-view />
  <Toaster position="bottom-right" rich-colors close-button expand />
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import { supabase } from './supabase'
import { notify } from './utils/notify'
import { playSound } from './utils/sounds'

export default defineComponent({
  name: 'App',
  components: { Toaster },
  setup () {
    onMounted(() => {
      try { localStorage.removeItem('dailyNoticeSeen') } catch (e) { /* ignore */ }

      // Suscripción global a cambios en Puesto_01 para notificaciones
      supabase
        .channel('puesto-01-global-notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Puesto_01' },
          (payload) => {
            let message = ''
            let color = 'primary'
            
            const row = payload.new || payload.old
            const casita = row.Casita || row.casita || 'Sin casita'
            const nombre = row.Nombre || row.nombre || 'Sin nombre'

            if (payload.eventType === 'INSERT') {
              message = `Nuevo registro: ${nombre} (${casita})`
              color = 'positive'
              playSound('receive')
            } else if (payload.eventType === 'UPDATE') {
              message = `Actualización: ${nombre} (${casita})`
              color = 'info'
            }

            if (message) {
              notify({
                message,
                caption: payload.eventType === 'INSERT' ? 'Nuevo registro' : 'Actualización',
                type: color,
                position: 'top-right',
                timeout: 3000,
                actions: [{ label: 'Ver', handler: () => { /* Navegación opcional */ } }]
              })
            }
          }
        )
        .subscribe()
    })
  }
})
</script>