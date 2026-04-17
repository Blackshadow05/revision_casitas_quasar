<template>
  <router-view />
  <DailyNotice />
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import DailyNotice from './components/DailyNotice.vue'
import { supabase } from './supabase'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'App',
  components: { DailyNotice },
  setup () {
    const $q = useQuasar()

    onMounted(() => {
      // Suscripción global a cambios en Puesto_01 para notificaciones
      supabase
        .channel('puesto-01-global-notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Puesto_01' },
          (payload) => {
            let message = ''
            let icon = 'info'
            let color = 'primary'
            
            const row = payload.new || payload.old
            const casita = row.Casita || row.casita || 'Sin casita'
            const nombre = row.Nombre || row.nombre || 'Sin nombre'

            if (payload.eventType === 'INSERT') {
              message = `Nuevo registro: ${nombre} (${casita})`
              icon = 'add_circle'
              color = 'positive'
            } else if (payload.eventType === 'UPDATE') {
              message = `Actualización: ${nombre} (${casita})`
              icon = 'update'
              color = 'info'
            }

            if (message) {
              $q.notify({
                message,
                icon,
                color,
                position: 'top-right',
                timeout: 3000,
                actions: [{ label: 'Ver', color: 'white', handler: () => { /* Navegación opcional */ } }]
              })
            }
          }
        )
        .subscribe()
    })
  }
})
</script>