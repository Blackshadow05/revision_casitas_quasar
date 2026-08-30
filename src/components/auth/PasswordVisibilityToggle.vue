<template>
  <button
    type="button"
    class="password-eye-toggle"
    :aria-label="modelValue ? 'Ocultar contraseña' : 'Mostrar contraseña'"
    :aria-pressed="modelValue"
    @mousedown.prevent
    @touchstart.prevent="toggle"
    @click="toggle"
  >
    <q-icon :name="modelValue ? 'visibility' : 'visibility_off'" size="20px" aria-hidden="true" />
  </button>
</template>

<script>
import { defineComponent } from 'vue'

// Botón táctil para alternar la visibilidad de contraseñas.
// mousedown/touchstart usan preventDefault para que el campo asociado
// no pierda el foco ni se cierre el teclado virtual en móviles.
export default defineComponent({
  name: 'PasswordVisibilityToggle',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const toggle = () => emit('update:modelValue', !props.modelValue)
    return { toggle }
  }
})
</script>
