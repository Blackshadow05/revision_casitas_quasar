<template>
  <div
    class="totp-timer"
    :class="{
      'totp-timer--warn': seconds <= WARN_SECONDS && seconds > DANGER_SECONDS,
      'totp-timer--danger': seconds <= DANGER_SECONDS
    }"
    role="timer"
    aria-live="polite"
    :aria-label="seconds <= DANGER_SECONDS
      ? `El código vence en ${seconds} segundos. Mejor espera el nuevo.`
      : `El código vence en ${seconds} segundos`"
  >
    <div class="totp-timer__ring" :class="{ 'totp-timer__ring--renewed': justRenewed }">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle class="totp-timer__track" cx="36" cy="36" r="31" />
        <circle
          class="totp-timer__progress"
          cx="36"
          cy="36"
          r="31"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <span class="totp-timer__seconds">{{ seconds }}</span>
    </div>
    <p class="totp-timer__label">
      {{ seconds > DANGER_SECONDS
        ? 'segundos para usar este código'
        : 'por vencer, mejor espera el nuevo' }}
    </p>
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'

// Ventana de 60s alineada al reloj (epoch), como en Google Authenticator.
const TOTP_PERIOD_MS = 60000
const WARN_SECONDS = 30
const DANGER_SECONDS = 20
const CIRCUMFERENCE = 2 * Math.PI * 31

export default defineComponent({
  name: 'TotpCountdown',
  setup () {
    const remainingMs = ref(TOTP_PERIOD_MS)
    const justRenewed = ref(false)
    let timer = null
    let renewTimer = null

    const tick = () => {
      const elapsed = Date.now() % TOTP_PERIOD_MS
      const next = TOTP_PERIOD_MS - elapsed

      // Detecta el salto a una ventana nueva para disparar el pulso de renovación.
      if (next > remainingMs.value) {
        justRenewed.value = true
        if (renewTimer) clearTimeout(renewTimer)
        renewTimer = setTimeout(() => {
          justRenewed.value = false
          renewTimer = null
        }, 700)
      }
      remainingMs.value = next
    }

    const seconds = computed(() => Math.ceil(remainingMs.value / 1000))
    const dashOffset = computed(() => CIRCUMFERENCE * (1 - remainingMs.value / TOTP_PERIOD_MS))

    onMounted(() => {
      tick()
      timer = setInterval(tick, 200)
    })

    onUnmounted(() => {
      if (timer) clearInterval(timer)
      if (renewTimer) clearTimeout(renewTimer)
    })

    return {
      CIRCUMFERENCE,
      WARN_SECONDS,
      DANGER_SECONDS,
      seconds,
      dashOffset,
      justRenewed
    }
  }
})
</script>
