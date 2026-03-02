<template>
  <q-dialog v-model="open" persistent>
    <q-card class="daily-card">
      <div class="card-header">
        <div class="icon-wrap">
          <q-icon name="update" size="28px" />
        </div>
        <div class="header-text">
          <div class="title">Actualización en segundo plano</div>
          <div class="subtitle">Recomendación rápida</div>
        </div>
      </div>

      <q-card-section class="q-pt-md q-pb-none">
        <div class="message">
          Si la app se siente lenta o no responde, es porque se está actualizando internamente. Espera 30 segundos, cierra la app completamente y vuelve a abrirla.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pr-md q-pb-md">
        <q-btn flat label="Entendido" color="primary" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'DailyNotice',
  setup () {
    const open = ref(false)

    const todayKey = () => {
      const d = new Date()
      return d.toISOString().slice(0, 10) // YYYY-MM-DD
    }

    onMounted(() => {
      try {
        const seen = localStorage.getItem('dailyNoticeSeen')
        const today = todayKey()
        if (seen !== today) {
          open.value = true
          // mark as seen for today immediately so it won't reappear on reloads
          localStorage.setItem('dailyNoticeSeen', today)
        }
      } catch (e) {
        // ignore storage errors
        open.value = true
      }
    })

    const close = () => {
      open.value = false
    }

    return {
      open,
      close
    }
  }
})
</script>

<style scoped>
.daily-card {
  width: min(560px, 92vw);
  border-radius: 16px;
  overflow: hidden;
}
.card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 18px 6px 18px;
  background: linear-gradient(90deg, #6dd5ed 0%, #2193b0 100%);
  color: white;
}
.icon-wrap {
  background: rgba(255,255,255,0.12);
  border-radius: 10px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-text .title {
  font-weight: 700;
  font-size: 16px;
}
.header-text .subtitle {
  font-size: 13px;
  opacity: 0.9;
}
.message {
  padding: 16px 2px 8px 2px;
  color: #263238;
  font-size: 15px;
  line-height: 1.4;
}
@media (max-width: 420px) {
  .daily-card { width: 96vw }
  .message { font-size: 14px }
}
</style>
