import { boot } from 'quasar/wrappers'
import { ensureHomeDatabase } from '../services/homeSync'

export default boot(async () => {
  try {
    await ensureHomeDatabase()
  } catch (error) {
    console.error('[RxDBBoot] No se pudo inicializar la base local:', error)
  }
})