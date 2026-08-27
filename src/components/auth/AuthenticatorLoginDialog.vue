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

      <q-form v-if="step === 'credentials'" class="auth-sheet__form" @submit="submitCredentials">
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
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer auth-sheet__eye"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>

        <div v-if="authStore.error" class="auth-sheet__alert" role="alert">
          {{ authStore.error }}
        </div>

        <q-btn
          label="Continuar"
          type="submit"
          class="auth-sheet__submit"
          unelevated
          no-caps
          :loading="authStore.loading"
        />
      </q-form>

      <div v-else-if="step === 'enroll'">
        <p class="auth-sheet__copy">
          Abre Google Authenticator, pulsa agregar y escanea este QR. Si no puedes escanear, copia la clave completa.
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

        <div class="auth-sheet__field">
          <q-input
            v-model="otpCode"
            label="Código de 6 dígitos"
            borderless
            dense
            hide-bottom-space
            mask="######"
            inputmode="numeric"
            autocomplete="one-time-code"
            :rules="[val => /^\d{6}$/.test(String(val || '')) || 'Ingresa el código de 6 dígitos']"
            @keyup.enter="submitCode"
          />
        </div>

        <div v-if="authStore.error" class="auth-sheet__alert q-mt-md" role="alert">
          {{ authStore.error }}
        </div>

        <q-btn
          label="Activar Authenticator"
          class="auth-sheet__submit"
          unelevated
          no-caps
          :loading="authStore.loading"
          @click="submitCode"
        />
      </div>

      <div v-else-if="step === 'challenge'">
        <p class="auth-sheet__copy">
          Abre Google Authenticator e ingresa el código de 6 dígitos. Vence en 30 segundos.
        </p>

        <div class="auth-sheet__field">
          <q-input
            v-model="otpCode"
            label="Código de Authenticator"
            borderless
            dense
            hide-bottom-space
            mask="######"
            inputmode="numeric"
            autocomplete="one-time-code"
            autofocus
            :rules="[val => /^\d{6}$/.test(String(val || '')) || 'Ingresa el código de 6 dígitos']"
            @keyup.enter="submitCode"
          />
        </div>

        <div v-if="authStore.error" class="auth-sheet__alert q-mt-md" role="alert">
          {{ authStore.error }}
        </div>

        <q-btn
          label="Verificar"
          class="auth-sheet__submit"
          unelevated
          no-caps
          :loading="authStore.loading"
          @click="submitCode"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue'
import { copyToClipboard } from 'quasar'
import { useAuthStore } from '../../stores/auth'
import { notify } from '../../utils/notify'

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

    const submitCredentials = async () => {
      const result = await authStore.loginWithAuthenticator(email.value, password.value)
      if (result.success) {
        resetForm()
        close()
        emit('success')
      }
    }

    const submitCode = async () => {
      const result = await authStore.verifyAuthenticatorCode(otpCode.value)
      if (result.success) {
        resetForm()
        close()
        emit('success')
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
      formattedSecret,
      step,
      headerTitle,
      headerSubtitle,
      onDialogToggle,
      submitCredentials,
      submitCode,
      copySecret,
      cancel
    }
  }
})
</script>
