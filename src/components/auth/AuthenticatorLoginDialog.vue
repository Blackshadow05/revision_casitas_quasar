<template>
  <q-dialog :model-value="modelValue" persistent class="auth-dialog" backdrop-filter="blur(18px)" @update:model-value="onDialogToggle">
    <q-card class="auth-sheet">
      <button
        type="button"
        class="auth-sheet__close"
        aria-label="Cerrar"
        :disabled="authStore.loading"
        @click="cancel"
      >
        <q-icon name="close" size="18px" />
      </button>

      <header class="auth-sheet__header">
        <div class="auth-sheet__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 6.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Z" stroke="currentColor" stroke-width="1.8" />
            <path d="M16 11.5v5.2l3.4 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="auth-sheet__eyebrow">Revisiones · Casitas</p>
        <h2 class="auth-sheet__title">{{ headerTitle }}</h2>
        <p class="auth-sheet__lede">{{ headerSubtitle }}</p>
      </header>

      <q-form v-if="step === 'credentials'" ref="credentialsForm" class="auth-sheet__form" @submit="submitCredentials">
        <div class="auth-sheet__field">
          <q-input
            v-model="email"
            label="Correo"
            type="email"
            borderless
            dense
            hide-bottom-space
            autocomplete="username"
            :rules="[val => !!val || 'El correo es requerido']"
          />
        </div>

        <div class="auth-sheet__field">
          <q-input
            v-model="password"
            label="Contraseña de Auth"
            :type="showPassword ? 'text' : 'password'"
            borderless
            dense
            hide-bottom-space
            autocomplete="current-password"
            :rules="[val => !!val || 'La contraseña es requerida']"
          >
            <template v-slot:append>
              <password-visibility-toggle v-model="showPassword" />
            </template>
          </q-input>
        </div>

        <div v-if="authStore.error" class="auth-sheet__alert" role="alert">
          {{ authStore.error }}
        </div>

        <div
          class="auth-sheet__submit-hit"
          @mousedown.prevent
          @touchstart.prevent="onCredentialsPointerDown"
        >
          <q-btn
            label="Continuar"
            type="submit"
            class="auth-sheet__submit"
            unelevated
            no-caps
            :loading="authStore.loading"
          />
        </div>
      </q-form>

      <q-form v-else-if="step === 'enroll'" ref="otpForm" class="auth-sheet__form" @submit="submitCode">
        <p class="auth-sheet__copy">
          Abre Google Authenticator, pulsa agregar y escanea este QR. Si no puedes escanear, copia la clave completa. Si el código quedó a medias, genera uno nuevo.
        </p>

        <img
          v-if="authStore.mfa.qrCode"
          :src="authStore.mfa.qrCode"
          alt="Código QR de Google Authenticator"
          class="auth-sheet__qr"
        />

        <div v-if="authStore.mfa.secret" class="auth-sheet__secret">
          <div class="auth-sheet__secret-label">Clave manual</div>
          <div class="auth-sheet__secret-box">
            <p class="auth-sheet__secret-value">{{ formattedSecret }}</p>
            <q-btn
              unelevated
              no-caps
              class="auth-sheet__secret-copy"
              :icon="secretCopied ? 'check' : 'content_copy'"
              :label="secretCopied ? 'Clave copiada' : 'Copiar clave'"
              @click="copySecret"
            />
          </div>
        </div>

        <totp-countdown />

        <div class="auth-sheet__field">
          <q-input
            v-model="otpCode"
            label="Código de 6 dígitos"
            type="text"
            class="auth-sheet__code"
            borderless
            dense
            hide-bottom-space
            mask="######"
            inputmode="numeric"
            autocomplete="one-time-code"
            :rules="[val => /^\d{6}$/.test(String(val || '')) || 'Ingresa el código de 6 dígitos']"
          />
        </div>

        <div v-if="authStore.error" class="auth-sheet__alert q-mt-md" role="alert">
          {{ authStore.error }}
        </div>

        <div
          class="auth-sheet__submit-hit"
          @mousedown.prevent
          @touchstart.prevent="onOtpPointerDown"
        >
          <q-btn
            label="Activar Authenticator"
            type="submit"
            class="auth-sheet__submit"
            unelevated
            no-caps
            :loading="authStore.loading"
          />
        </div>

        <button
          type="button"
          class="auth-sheet__alt"
          :disabled="authStore.loading"
          @click="regenerateQr"
        >
          Generar nuevo QR
        </button>
      </q-form>

      <q-form v-else-if="step === 'challenge'" ref="otpForm" class="auth-sheet__form" @submit="submitCode">
        <p class="auth-sheet__copy">
          Abre Google Authenticator e ingresa el código de 6 dígitos.
        </p>

        <totp-countdown />

        <div class="auth-sheet__field">
          <q-input
            v-model="otpCode"
            label="Código de Authenticator"
            type="text"
            class="auth-sheet__code"
            borderless
            dense
            hide-bottom-space
            mask="######"
            inputmode="numeric"
            autocomplete="one-time-code"
            autofocus
            :rules="[val => /^\d{6}$/.test(String(val || '')) || 'Ingresa el código de 6 dígitos']"
          />
        </div>

        <div v-if="authStore.error" class="auth-sheet__alert q-mt-md" role="alert">
          {{ authStore.error }}
        </div>

        <div
          class="auth-sheet__submit-hit"
          @mousedown.prevent
          @touchstart.prevent="onOtpPointerDown"
        >
          <q-btn
            label="Verificar"
            type="submit"
            class="auth-sheet__submit"
            unelevated
            no-caps
            :loading="authStore.loading"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue'
import { copyToClipboard } from 'quasar'
import { useAuthStore } from '../../stores/auth'
import { notify } from '../../utils/notify'
import { onceAtATime, createKeyboardSafeFormSubmit } from '../../utils/keyboardSafeSubmit'
import PasswordVisibilityToggle from './PasswordVisibilityToggle.vue'
import TotpCountdown from './TotpCountdown.vue'

const formatTotpSecret = (secret) => String(secret || '').replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()

async function copyText (value) {
  const text = String(value || '')
  if (!text) return false

  try {
    await copyToClipboard(text)
    return true
  } catch {
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.top = '0'
    input.style.left = '0'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.focus()
    input.select()
    input.setSelectionRange(0, text.length)

    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }

    document.body.removeChild(input)
    return copied
  }
}

export default defineComponent({
  name: 'AuthenticatorLoginDialog',
  components: { PasswordVisibilityToggle, TotpCountdown },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'success'],
  setup (props, { emit }) {
    const authStore = useAuthStore()
    const email = ref('')
    const password = ref('')
    const otpCode = ref('')
    const showPassword = ref(false)
    const secretCopied = ref(false)
    const credentialsForm = ref(null)
    const otpForm = ref(null)
    let copiedTimer = null

    const formattedSecret = computed(() => formatTotpSecret(authStore.mfa.secret))

    const step = computed(() => authStore.mfa.step || 'credentials')
    const headerTitle = computed(() => {
      if (step.value === 'enroll') return 'Configurar Authenticator'
      if (step.value === 'challenge') return 'Código de verificación'
      return 'Google Authenticator'
    })
    const headerSubtitle = computed(() => {
      if (step.value === 'enroll') return 'Escanea el QR con la app'
      if (step.value === 'challenge') return 'Sesión de 8 horas'
      return 'Correo, contraseña y código'
    })

    const resetForm = () => {
      email.value = ''
      password.value = ''
      otpCode.value = ''
      showPassword.value = false
      secretCopied.value = false
      if (copiedTimer) {
        clearTimeout(copiedTimer)
        copiedTimer = null
      }
    }

    const copySecret = async () => {
      const secret = String(authStore.mfa.secret || '').replace(/\s+/g, '')
      const copied = await copyText(secret)

      if (!copied) {
        notify({ type: 'negative', message: 'No se pudo copiar la clave. Selecciónala y cópiala a mano.' })
        return
      }

      secretCopied.value = true
      notify({ type: 'positive', message: 'Clave copiada completa', icon: 'content_copy', timeout: 1800 })
      if (copiedTimer) clearTimeout(copiedTimer)
      copiedTimer = setTimeout(() => {
        secretCopied.value = false
        copiedTimer = null
      }, 2000)
    }

    watch(() => props.modelValue, (open) => {
      if (open && !authStore.mfa.step) {
        resetForm()
        authStore.error = null
      }
    })

    const close = () => emit('update:modelValue', false)

    const onDialogToggle = async (open) => {
      if (!open) {
        if (!authStore.isLoggedIn) {
          await authStore.cancelAuthenticatorLogin()
        }
        resetForm()
      }
      emit('update:modelValue', open)
    }

    const submitCredentials = onceAtATime(async () => {
      if (authStore.loading) return
      const result = await authStore.loginWithAuthenticator(email.value, password.value)
      if (result.success) {
        resetForm()
        close()
        emit('success')
      }
    })

    const submitCode = onceAtATime(async () => {
      if (authStore.loading) return
      const result = await authStore.verifyAuthenticatorCode(otpCode.value)
      if (result.success) {
        resetForm()
        close()
        emit('success')
      }
    })

    const onCredentialsPointerDown = createKeyboardSafeFormSubmit(credentialsForm)
    const onOtpPointerDown = createKeyboardSafeFormSubmit(otpForm)

    const regenerateQr = async () => {
      otpCode.value = ''
      secretCopied.value = false
      const result = await authStore.regenerateTotpEnrollment()
      if (result.needsEnroll) {
        notify({ type: 'positive', message: 'QR nuevo listo. Escanéalo o copia la clave.', timeout: 2200 })
        return
      }
      if (result.message) {
        notify({ type: 'negative', message: result.message })
      }
    }

    const cancel = async () => {
      await authStore.cancelAuthenticatorLogin()
      resetForm()
      close()
    }

    onUnmounted(() => {
      if (copiedTimer) clearTimeout(copiedTimer)
    })

    return {
      authStore,
      email,
      password,
      otpCode,
      showPassword,
      secretCopied,
      credentialsForm,
      otpForm,
      formattedSecret,
      step,
      headerTitle,
      headerSubtitle,
      onDialogToggle,
      submitCredentials,
      submitCode,
      onCredentialsPointerDown,
      onOtpPointerDown,
      copySecret,
      regenerateQr,
      cancel
    }
  }
})
</script>
