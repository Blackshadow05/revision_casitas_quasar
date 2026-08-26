<template>
  <q-dialog :model-value="modelValue" persistent backdrop-filter="blur(4px)" @update:model-value="onDialogToggle">
    <q-card class="auth-card q-pa-lg">
      <div class="text-center q-mb-lg">
        <q-avatar size="84px" font-size="42px" color="primary" text-color="white" :icon="headerIcon" class="shadow-10 q-mb-md" />
        <div class="text-h5 text-weight-bold" style="color: #2e7d32;">{{ headerTitle }}</div>
        <div class="text-grey-7">{{ headerSubtitle }}</div>
      </div>

      <q-form v-if="step === 'credentials'" class="q-gutter-md" @submit="submitCredentials">
        <q-input
          v-model="email"
          label="Correo"
          type="email"
          outlined
          rounded
          dense
          autocomplete="username"
          :rules="[val => !!val || 'El correo es requerido']"
        >
          <template v-slot:prepend>
            <q-icon name="mail" color="primary" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Contraseña de Auth"
          :type="showPassword ? 'text' : 'password'"
          outlined
          rounded
          dense
          autocomplete="current-password"
          :rules="[val => !!val || 'La contraseña es requerida']"
        >
          <template v-slot:prepend>
            <q-icon name="lock" color="primary" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility' : 'visibility_off'"
              class="cursor-pointer"
              color="grey-7"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <div v-if="authStore.error" class="text-negative text-center text-caption">
          {{ authStore.error }}
        </div>

        <div class="q-pt-sm q-gutter-sm">
          <q-btn
            label="Continuar"
            type="submit"
            color="primary"
            class="full-width text-weight-bold"
            size="lg"
            unelevated
            :loading="authStore.loading"
          />
          <q-btn
            label="Cancelar"
            color="grey-7"
            class="full-width text-weight-bold"
            size="lg"
            flat
            :disable="authStore.loading"
            @click="cancel"
          />
        </div>
      </q-form>

      <div v-else-if="step === 'enroll'" class="enroll-step">
        <p class="text-body2 text-grey-8 text-center q-mb-md">
          Abre Google Authenticator, pulsa agregar y escanea este QR. Si no puedes escanear, escribe la clave.
        </p>

        <div class="row justify-center q-mb-md">
          <img
            v-if="authStore.mfa.qrCode"
            :src="authStore.mfa.qrCode"
            alt="Código QR de Google Authenticator"
            class="auth-qr"
          />
        </div>

        <div v-if="authStore.mfa.secret" class="text-center q-mb-md">
          <div class="text-caption text-grey-6">Clave manual</div>
          <div class="text-mono">{{ authStore.mfa.secret }}</div>
        </div>

        <q-input
          v-model="otpCode"
          label="Código de 6 dígitos"
          outlined
          rounded
          dense
          mask="######"
          inputmode="numeric"
          autocomplete="one-time-code"
          :rules="[val => /^\d{6}$/.test(String(val || '')) || 'Ingresa el código de 6 dígitos']"
          @keyup.enter="submitCode"
        >
          <template v-slot:prepend>
            <q-icon name="pin" color="primary" />
          </template>
        </q-input>

        <div v-if="authStore.error" class="text-negative text-center text-caption q-mt-sm">
          {{ authStore.error }}
        </div>

        <div class="q-pt-md q-gutter-sm">
          <q-btn
            label="Activar Authenticator"
            color="primary"
            class="full-width text-weight-bold"
            size="lg"
            unelevated
            :loading="authStore.loading"
            @click="submitCode"
          />
          <q-btn
            label="Cancelar"
            color="grey-7"
            class="full-width text-weight-bold"
            size="lg"
            flat
            :disable="authStore.loading"
            @click="cancel"
          />
        </div>
      </div>

      <div v-else-if="step === 'challenge'">
        <p class="text-body2 text-grey-8 text-center q-mb-md">
          Abre Google Authenticator e ingresa el código de 6 dígitos. Vence en 30 segundos.
        </p>

        <q-input
          v-model="otpCode"
          label="Código de Authenticator"
          outlined
          rounded
          dense
          mask="######"
          inputmode="numeric"
          autocomplete="one-time-code"
          autofocus
          :rules="[val => /^\d{6}$/.test(String(val || '')) || 'Ingresa el código de 6 dígitos']"
          @keyup.enter="submitCode"
        >
          <template v-slot:prepend>
            <q-icon name="pin" color="primary" />
          </template>
        </q-input>

        <div v-if="authStore.error" class="text-negative text-center text-caption q-mt-sm">
          {{ authStore.error }}
        </div>

        <div class="q-pt-md q-gutter-sm">
          <q-btn
            label="Verificar"
            color="primary"
            class="full-width text-weight-bold"
            size="lg"
            unelevated
            :loading="authStore.loading"
            @click="submitCode"
          />
          <q-btn
            label="Cancelar"
            color="grey-7"
            class="full-width text-weight-bold"
            size="lg"
            flat
            :disable="authStore.loading"
            @click="cancel"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import { computed, defineComponent, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'

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

    const step = computed(() => authStore.mfa.step || 'credentials')
    const headerIcon = computed(() => (step.value === 'credentials' ? 'security' : 'qr_code_2'))
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

    return {
      authStore,
      email,
      password,
      otpCode,
      showPassword,
      step,
      headerIcon,
      headerTitle,
      headerSubtitle,
      onDialogToggle,
      submitCredentials,
      submitCode,
      cancel
    }
  }
})
</script>

<style scoped>
.auth-card {
  width: 360px;
  max-width: calc(100vw - 32px);
  border-radius: 20px;
}

.auth-qr {
  width: 180px;
  height: 180px;
  background: #fff;
  border-radius: 12px;
}

.text-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  word-break: break-all;
}
</style>
