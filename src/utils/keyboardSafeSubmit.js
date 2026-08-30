/**
 * En móviles, el primer toque con el teclado abierto cierra el teclado
 * (blur del input) y el diálogo se mueve, así que el click no llega al botón.
 * Igual que PasswordVisibilityToggle: preventDefault en touchstart y enviar el QForm.
 */
export function createKeyboardSafeFormSubmit (formRef) {
  let lastAt = 0

  return function onSubmitTouch (event) {
    const hit = event.target.closest?.('.auth-sheet__submit, .auth-sheet__submit-hit')
    if (!hit) return
    if (hit.querySelector?.('.q-btn--loading, button:disabled') || hit.closest?.('.q-btn--loading')) return

    const now = Date.now()
    if (now - lastAt < 500) return
    lastAt = now
    formRef?.value?.submit?.()
  }
}

export function onceAtATime (fn) {
  let running = false
  return async function guarded (...args) {
    if (running) return
    running = true
    try {
      return await fn.apply(this, args)
    } finally {
      running = false
    }
  }
}
