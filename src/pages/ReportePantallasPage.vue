<template>
  <q-page class="reporte-pantallas-page q-pa-md">
    <div class="page-header q-mb-md">
      <q-btn flat round dense icon="arrow_back" color="grey-8" class="q-mr-sm" @click="goBack" />
      <div>
        <div class="text-h5 text-weight-bold">Revisión de pantallas</div>
        <div class="text-caption text-grey-6">Elige un tipo de registro para continuar</div>
      </div>
    </div>

    <q-banner v-if="!authStore.isLoggedIn" rounded class="bg-orange-1 text-orange-10 q-mb-md">
      Debes iniciar sesión para enviar un reporte.
    </q-banner>

    <q-form class="form-card" @submit.prevent="saveReport">
      <div class="meta-row">
        <div class="meta-item">
          <q-icon name="person" size="16px" color="grey-6" />
          <div>
            <div class="meta-label">Usuario</div>
            <div class="meta-value">{{ nombreUsuario || '—' }}</div>
          </div>
        </div>
        <div class="meta-item">
          <q-icon name="schedule" size="16px" color="grey-6" />
          <div>
            <div class="meta-label">Fecha y hora</div>
            <div class="meta-value">{{ fechaHoraDisplay }}</div>
          </div>
        </div>
      </div>

      <section class="form-section">
        <h2 class="section-title">Tipo de registro</h2>
        <div class="tipo-grid">
          <button
            v-for="opcion in tipoOptions"
            :key="opcion.value"
            type="button"
            class="tipo-card"
            :class="{ 'tipo-card--active': tipo === opcion.value }"
            @click="selectTipo(opcion.value)"
          >
            <q-icon :name="opcion.icon" size="22px" />
            <span>{{ opcion.label }}</span>
          </button>
        </div>
      </section>

      <section v-if="esReporte" class="form-section">
        <h2 class="section-title">Casita</h2>
        <q-select
          v-model="numeroCasita"
          :options="casitaOptions"
          outlined
          dense
          emit-value
          map-options
          placeholder="Selecciona 1 a 50"
          :rules="[val => !!val || 'Selecciona una casita']"
          lazy-rules
        >
          <template #prepend>
            <q-icon name="home" color="grey-6" />
          </template>
        </q-select>
      </section>

      <section v-if="esReporte" class="form-section">
        <div class="section-title-row">
          <h2 class="section-title">Fotos de pantallas</h2>
          <span class="section-hint">Máx. 3</span>
        </div>
        <p class="section-copy">Indica ubicación y estado en cada foto.</p>
        <div class="photos-grid">
          <div
            v-for="(photo, idx) in fotos"
            :key="photo.id"
            class="photo-card"
          >
            <div class="photo-preview">
              <q-img :src="photo.preview" fit="cover" class="preview-img" />
              <q-btn
                round
                flat
                dense
                icon="close"
                size="xs"
                color="white"
                class="remove-photo-btn"
                @click="removePhoto(idx)"
              />
              <div
                class="photo-estado-bar"
                :class="estadoClass(photo.estado)"
              />
            </div>
            <div class="photo-ubicacion-chip">{{ photo.ubicacion }}</div>
            <div
              class="photo-estado-chip"
              :class="estadoClass(photo.estado)"
            >
              {{ photo.estado }}
            </div>
          </div>

          <button
            v-if="fotos.length < 3"
            type="button"
            class="add-photo-btn"
            @click="openPhotoSheet"
          >
            <q-icon name="add_a_photo" size="26px" color="grey-5" />
            <span class="add-photo-text">Tomar foto</span>
          </button>
        </div>
      </section>

      <section v-if="esMovimiento" class="form-section">
        <h2 class="section-title">Trayecto</h2>
        <div class="move-block">
          <div class="move-kicker">Sale de</div>
          <q-select
            v-model="origenUbicacion"
            :options="ubicacionMovimientoOptions"
            outlined
            dense
            emit-value
            map-options
            class="q-mb-sm"
            placeholder="Casita, bodega o casa verde"
            :rules="[val => !!val || 'Selecciona el origen']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="logout" color="grey-6" />
            </template>
          </q-select>
          <q-select
            v-if="origenRequiereHabitacion"
            v-model="origenHabitacion"
            :options="habitacionOptions"
            outlined
            dense
            emit-value
            map-options
            placeholder="Habitación"
            :rules="[val => !!val || 'Selecciona la habitación de origen']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="bed" color="grey-6" />
            </template>
          </q-select>
        </div>

        <div class="move-divider">
          <q-icon name="arrow_downward" color="primary" size="20px" />
        </div>

        <div class="move-block">
          <div class="move-kicker">Llega a</div>
          <q-select
            v-model="destinoUbicacion"
            :options="ubicacionMovimientoOptions"
            outlined
            dense
            emit-value
            map-options
            class="q-mb-sm"
            placeholder="Casita, bodega o casa verde"
            :rules="[val => !!val || 'Selecciona el destino']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="login" color="grey-6" />
            </template>
          </q-select>
          <q-select
            v-if="destinoRequiereHabitacion"
            v-model="destinoHabitacion"
            :options="habitacionOptions"
            outlined
            dense
            emit-value
            map-options
            placeholder="Habitación"
            :rules="[val => !!val || 'Selecciona la habitación de destino']"
            lazy-rules
          >
            <template #prepend>
              <q-icon name="weekend" color="grey-6" />
            </template>
          </q-select>
        </div>
      </section>

      <section v-if="tipo" class="form-section form-section--last">
        <h2 class="section-title">Notas</h2>
        <q-input
          v-model="notas"
          type="textarea"
          outlined
          dense
          autogrow
          :input-style="{ minHeight: '64px' }"
          :placeholder="esMovimiento ? 'Detalle del movimiento (opcional)' : 'Nota general (opcional)'"
          class="q-mb-md"
        />
        <q-btn
          type="submit"
          unelevated
          rounded
          color="primary"
          class="full-width save-btn"
          :label="esMovimiento ? 'Guardar movimiento' : 'Guardar reporte'"
          icon="save"
          :loading="saving"
          :disable="!canSubmit"
        />
      </section>
    </q-form>

    <template v-if="esReporte">
      <input
        ref="fileInputCamera"
        type="file"
        accept="image/*"
        capture="environment"
        style="display:none"
        @change="onFileSelected"
      />
      <input
        ref="fileInputGallery"
        type="file"
        accept="image/*"
        style="display:none"
        @change="onFileSelected"
      />
    </template>

    <q-dialog v-if="esReporte" v-model="photoSheetOpen" position="bottom">
      <q-card class="photo-sheet">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle1 text-weight-bold">Agregar foto</div>
          <div class="text-caption text-grey-6">Elige cámara o galería</div>
        </q-card-section>
        <q-card-actions vertical class="q-pa-md q-gutter-sm">
          <q-btn
            unelevated
            color="primary"
            icon="photo_camera"
            label="Tomar foto"
            no-caps
            @click="pickImageSource('camera')"
          />
          <q-btn
            outline
            color="primary"
            icon="photo_library"
            label="Galería"
            no-caps
            @click="pickImageSource('gallery')"
          />
          <q-btn flat color="grey-7" label="Cancelar" no-caps v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-if="esReporte" v-model="photoMetaDialogOpen" persistent position="bottom">
      <q-card class="ubicacion-dialog">
        <q-toolbar class="ubicacion-toolbar">
          <q-btn flat round dense icon="close" color="grey-7" @click="cancelPendingPhoto" />
          <q-toolbar-title class="text-weight-bold text-body1">
            {{ photoMetaStep === 'ubicacion' ? '¿Dónde está esta pantalla?' : 'Estado de la pantalla' }}
          </q-toolbar-title>
        </q-toolbar>

        <q-separator />

        <q-card-section class="ubicacion-body">
          <div v-if="pendingPhoto?.preview" class="pending-preview q-mb-md">
            <q-img :src="pendingPhoto.preview" class="pending-img" fit="contain" />
          </div>

          <template v-if="photoMetaStep === 'ubicacion'">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">Toca la ubicación para continuar</div>
            <div class="ubicacion-options">
              <q-btn
                v-for="opcion in ubicacionOptions"
                :key="opcion.value"
                unelevated
                no-caps
                class="ubicacion-option-btn"
                color="grey-2"
                text-color="grey-9"
                :icon="opcion.value === 'Living' ? 'weekend' : 'bed'"
                :label="opcion.label"
                @click="selectUbicacion(opcion.value)"
              />
            </div>
          </template>

          <template v-else>
            <div class="text-caption text-grey-6 q-mb-xs">Ubicación: {{ pendingUbicacion }}</div>
            <div class="text-subtitle2 text-weight-medium q-mb-sm">¿Cómo está la pantalla?</div>
            <div class="ubicacion-options">
              <q-btn
                unelevated
                no-caps
                class="ubicacion-option-btn"
                color="red-1"
                text-color="red-9"
                icon="report"
                label="Defectuosa"
                @click="selectEstado('defectuosa')"
              />
              <q-btn
                unelevated
                no-caps
                class="ubicacion-option-btn"
                color="green-1"
                text-color="green-9"
                icon="check_circle"
                label="En buen estado"
                @click="selectEstado('en buen estado')"
              />
              <q-btn
                unelevated
                no-caps
                class="ubicacion-option-btn"
                color="amber-2"
                text-color="amber-10"
                icon="tv_off"
                label="No hay pantalla"
                @click="selectEstado('no hay pantalla')"
              />
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-inner-loading :showing="processingPhoto" label="Procesando foto…" />
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '../utils/notify'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import {
  HABITACIONES_PANTALLA,
  TIPO_MOVIMIENTO,
  TIPO_REPORTE,
  buildCasitaOptions,
  buildUbicacionOptions,
  isCasitaUbicacion,
  registrarMovimientoPantalla
} from '../utils/pantallasInventario'

const UBICACIONES = HABITACIONES_PANTALLA
const ESTADOS = ['defectuosa', 'en buen estado', 'no hay pantalla']

export default defineComponent({
  name: 'ReportePantallasPage',
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()

    const tipo = ref(null)
    const numeroCasita = ref(null)
    const origenUbicacion = ref(null)
    const origenHabitacion = ref(null)
    const destinoUbicacion = ref(null)
    const destinoHabitacion = ref(null)
    const notas = ref('')
    const fotos = ref([])
    const saving = ref(false)
    const photoSheetOpen = ref(false)
    const photoMetaDialogOpen = ref(false)
    const photoMetaStep = ref('ubicacion') // ubicacion | estado
    const pendingPhoto = ref(null)
    const pendingUbicacion = ref(null)
    const processingPhoto = ref(false)
    const fileInputCamera = ref(null)
    const fileInputGallery = ref(null)
    const ahoraCR = ref(new Date())
    let clockTimer = null

    const casitaOptions = buildCasitaOptions()
    const ubicacionMovimientoOptions = buildUbicacionOptions()
    const habitacionOptions = UBICACIONES.map(u => ({ label: u, value: u }))
    const ubicacionOptions = habitacionOptions
    const estadoOptions = ESTADOS.map(e => ({ label: e, value: e }))
    const tipoOptions = [
      { label: 'Reporte pantalla', value: TIPO_REPORTE, icon: 'photo_camera' },
      { label: 'Movimiento pantalla', value: TIPO_MOVIMIENTO, icon: 'swap_horiz' }
    ]

    const origenRequiereHabitacion = computed(() => isCasitaUbicacion(origenUbicacion.value))
    const destinoRequiereHabitacion = computed(() => isCasitaUbicacion(destinoUbicacion.value))
    const esReporte = computed(() => tipo.value === TIPO_REPORTE)
    const esMovimiento = computed(() => tipo.value === TIPO_MOVIMIENTO)

    function selectTipo (value) {
      if (tipo.value === value) return
      tipo.value = value
      photoSheetOpen.value = false
      photoMetaDialogOpen.value = false
      if (value !== TIPO_REPORTE) {
        cancelPendingPhoto()
      }
    }

    function estadoClass (estado) {
      const value = String(estado || '').trim().toLowerCase()
      if (value === 'en buen estado') return 'is-ok'
      if (value === 'no hay pantalla') return 'is-missing'
      return 'is-bad'
    }

    const nombreUsuario = computed(() => authStore.user?.Usuario || '')

    function formatCostaRica (date = new Date()) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Costa_Rica',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(date)

      const get = (type) => parts.find(p => p.type === type)?.value || '00'
      const hour = get('hour') === '24' ? '00' : get('hour')
      return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
    }

    function formatCostaRicaDisplay (date = new Date()) {
      return new Intl.DateTimeFormat('es-CR', {
        timeZone: 'America/Costa_Rica',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date)
    }

    const fechaHoraDisplay = computed(() => formatCostaRicaDisplay(ahoraCR.value))

    const canSubmit = computed(() => {
      if (!authStore.isLoggedIn || !authStore.canAdd) return false
      if (!nombreUsuario.value) return false

      if (esMovimiento.value) {
        if (!origenUbicacion.value || !destinoUbicacion.value) return false
        if (origenRequiereHabitacion.value && !origenHabitacion.value) return false
        if (destinoRequiereHabitacion.value && !destinoHabitacion.value) return false
        const origenKey = `${origenUbicacion.value}|${origenRequiereHabitacion.value ? origenHabitacion.value : ''}`
        const destinoKey = `${destinoUbicacion.value}|${destinoRequiereHabitacion.value ? destinoHabitacion.value : ''}`
        return origenKey !== destinoKey
      }

      if (!esReporte.value) return false
      if (!numeroCasita.value) return false
      if (fotos.value.length === 0 || fotos.value.length > 3) return false
      return fotos.value.every(f => f.file && f.ubicacion && f.estado)
    })

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
    }

    const getCompressionConfig = () => {
      return isIOS
        ? {
            targetSizeKB: 600,
            maxResolution: 1200,
            maxQuality: 0.85,
            minQuality: 0.5,
            maxAttempts: 10,
            format: 'jpeg'
          }
        : {
            targetSizeKB: 600,
            maxResolution: 1600,
            maxQuality: 0.75,
            minQuality: 0.5,
            maxAttempts: 10,
            format: 'webp'
          }
    }

    const compressImage = async (file) => {
      const config = getCompressionConfig()
      const originalSize = file.size
      let objectUrl = null
      let source = null

      const loadSource = async () => {
        if ('createImageBitmap' in window) {
          try {
            return await createImageBitmap(file, { imageOrientation: 'from-image' })
          } catch (error) {
            console.warn('[Compression] createImageBitmap falló, se usa <img>', error)
          }
        }

        const img = new Image()
        objectUrl = URL.createObjectURL(file)
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('No se pudo leer la imagen'))
          img.src = objectUrl
        })
        if ('decode' in img) {
          try {
            await img.decode()
          } catch (error) {
            console.warn('[Compression] decode() falló, se continúa igual', error)
          }
        }
        return img
      }

      const toBlobAsync = (canvas, mime, quality) => {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('No se pudo generar el blob'))
          }, mime, quality)
        })
      }

      const releaseCanvas = (canvas) => {
        if (!canvas) return
        canvas.width = 0
        canvas.height = 0
      }

      try {
        source = await loadSource()

        const sourceWidth = source.width
        const sourceHeight = source.height
        if (!sourceWidth || !sourceHeight) {
          throw new Error('Dimensiones de imagen inválidas')
        }

        let width = sourceWidth
        let height = sourceHeight
        let currentCanvas = null

        while (width > config.maxResolution * 1.5) {
          const nextWidth = Math.floor(width / 2)
          const nextHeight = Math.floor(height / 2)

          const nextCanvas = document.createElement('canvas')
          nextCanvas.width = nextWidth
          nextCanvas.height = nextHeight

          const nextCtx = nextCanvas.getContext('2d', { alpha: false })
          if (!nextCtx) throw new Error('No se pudo crear el contexto 2d')

          nextCtx.fillStyle = '#FFFFFF'
          nextCtx.fillRect(0, 0, nextWidth, nextHeight)
          nextCtx.drawImage(currentCanvas || source, 0, 0, width, height, 0, 0, nextWidth, nextHeight)

          releaseCanvas(currentCanvas)
          currentCanvas = nextCanvas
          width = nextWidth
          height = nextHeight
        }

        const ratio = Math.min(config.maxResolution / width, config.maxResolution / height, 1)
        const targetW = Math.max(1, Math.round(width * ratio))
        const targetH = Math.max(1, Math.round(height * ratio))

        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = targetW
        finalCanvas.height = targetH

        const finalCtx = finalCanvas.getContext('2d', { alpha: false })
        if (!finalCtx) throw new Error('No se pudo crear el contexto 2d')

        finalCtx.fillStyle = '#FFFFFF'
        finalCtx.fillRect(0, 0, targetW, targetH)
        finalCtx.drawImage(currentCanvas || source, 0, 0, width, height, 0, 0, targetW, targetH)

        releaseCanvas(currentCanvas)

        const finalMime = `image/${config.format}`
        let quality = config.maxQuality
        let attempts = 0
        let blob = null

        while (true) {
          blob = await toBlobAsync(finalCanvas, finalMime, quality)
          if (!blob) throw new Error('No se pudo generar el blob final')

          const sizeKB = blob.size / 1024
          if (sizeKB <= config.targetSizeKB || attempts >= config.maxAttempts || quality <= config.minQuality) {
            break
          }

          quality -= 0.05
          attempts++
        }

        releaseCanvas(finalCanvas)

        const finalFile = new File([blob], `pantalla.${config.format}`, { type: finalMime })
        console.log('[Compression] Reduced', formatBytes(originalSize), '→', formatBytes(finalFile.size))
        return finalFile
      } finally {
        if (source instanceof ImageBitmap) source.close()
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    function openPhotoSheet () {
      if (!esReporte.value) return
      if (fotos.value.length >= 3) {
        notify({ type: 'warning', message: 'Máximo 3 fotos permitidas' })
        return
      }
      photoSheetOpen.value = true
    }

    function pickImageSource (source) {
      photoSheetOpen.value = false
      const input = source === 'camera' ? fileInputCamera.value : fileInputGallery.value
      if (input) input.click()
    }

    async function onFileSelected (e) {
      const file = e.target.files?.[0]
      if (!file) return

      if (fotos.value.length >= 3) {
        notify({ type: 'warning', message: 'Máximo 3 fotos permitidas' })
        e.target.value = ''
        return
      }

      processingPhoto.value = true
      try {
        const compressed = await compressImage(file)
        openUbicacionDialog({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          file: compressed,
          preview: URL.createObjectURL(compressed)
        })
      } catch (err) {
        console.error('Compression failed, using original file', err)
        openUbicacionDialog({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file)
        })
      } finally {
        processingPhoto.value = false
        e.target.value = ''
      }
    }

    function openUbicacionDialog (photo) {
      if (pendingPhoto.value?.preview) {
        URL.revokeObjectURL(pendingPhoto.value.preview)
      }
      pendingPhoto.value = photo
      pendingUbicacion.value = null
      photoMetaStep.value = 'ubicacion'
      photoMetaDialogOpen.value = true
    }

    function cancelPendingPhoto () {
      if (pendingPhoto.value?.preview) {
        URL.revokeObjectURL(pendingPhoto.value.preview)
      }
      pendingPhoto.value = null
      pendingUbicacion.value = null
      photoMetaStep.value = 'ubicacion'
      photoMetaDialogOpen.value = false
    }

    function selectUbicacion (ubicacion) {
      if (!pendingPhoto.value || !ubicacion) {
        notify({ type: 'warning', message: 'Selecciona la ubicación de la pantalla' })
        return
      }
      pendingUbicacion.value = ubicacion
      photoMetaStep.value = 'estado'
    }

    function selectEstado (estado) {
      if (!pendingPhoto.value || !pendingUbicacion.value || !estado) {
        notify({ type: 'warning', message: 'Selecciona el estado de la pantalla' })
        return
      }

      fotos.value.push({
        ...pendingPhoto.value,
        ubicacion: pendingUbicacion.value,
        estado
      })

      pendingPhoto.value = null
      pendingUbicacion.value = null
      photoMetaStep.value = 'ubicacion'
      photoMetaDialogOpen.value = false
    }

    function removePhoto (idx) {
      const removed = fotos.value.splice(idx, 1)
      if (removed[0]?.preview) URL.revokeObjectURL(removed[0].preview)
    }

    async function uploadToCloudinary (file, index) {
      const timestamp = Date.now()
      const publicId = `pantalla_${numeroCasita.value}_${index + 1}_${timestamp}`
      const folderPath = 'reporte_pantallas'

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
      formData.append('folder', folderPath)
      formData.append('public_id', publicId)
      formData.append('quality', 'auto:good')
      formData.append('fetch_format', 'auto')

      const response = await fetch(CLOUDINARY_CONFIG.uploadUrl(CLOUDINARY_CONFIG.cloudName), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || response.statusText)
      }

      const resData = await response.json()
      return resData.secure_url
    }

    watch(origenUbicacion, (value) => {
      if (!isCasitaUbicacion(value)) origenHabitacion.value = null
    })

    watch(destinoUbicacion, (value) => {
      if (!isCasitaUbicacion(value)) destinoHabitacion.value = null
    })

    async function saveMovimiento () {
      const origenHab = origenRequiereHabitacion.value ? origenHabitacion.value : null
      const destinoHab = destinoRequiereHabitacion.value ? destinoHabitacion.value : null
      const numeroOrigen = isCasitaUbicacion(origenUbicacion.value) ? Number(origenUbicacion.value) : null
      const numeroDestino = isCasitaUbicacion(destinoUbicacion.value) ? Number(destinoUbicacion.value) : null

      await registrarMovimientoPantalla(supabase, {
        nombre_usuario: nombreUsuario.value,
        fecha_hora: formatCostaRica(new Date()),
        notas: notas.value.trim() || null,
        numero_casita: numeroOrigen || numeroDestino,
        origen_ubicacion: String(origenUbicacion.value),
        origen_habitacion: origenHab,
        destino_ubicacion: String(destinoUbicacion.value),
        destino_habitacion: destinoHab
      })

      notify({ type: 'positive', message: 'Movimiento guardado y inventario actualizado', icon: 'swap_horiz' })
      origenUbicacion.value = null
      origenHabitacion.value = null
      destinoUbicacion.value = null
      destinoHabitacion.value = null
      notas.value = ''
      ahoraCR.value = new Date()
      router.push({ path: '/reporte-pantallas', query: { vista: 'movimiento' } })
    }

    async function saveReport () {
      if (!canSubmit.value) {
        notify({
          type: 'warning',
          message: esMovimiento.value
            ? 'Completa origen, habitación y destino del movimiento'
            : 'Completa casita, fotos, ubicaciones y estados'
        })
        return
      }

      saving.value = true
      try {
        if (esMovimiento.value) {
          await saveMovimiento()
          return
        }

        const fotosPayload = []
        for (let i = 0; i < fotos.value.length; i++) {
          const photo = fotos.value[i]
          const url = await uploadToCloudinary(photo.file, i)
          fotosPayload.push({
            url,
            ubicacion: photo.ubicacion,
            estado: photo.estado
          })
        }

        const record = {
          nombre_usuario: nombreUsuario.value,
          fecha_hora: formatCostaRica(new Date()),
          numero_casita: numeroCasita.value,
          notas: notas.value.trim() || null,
          fotos: fotosPayload,
          tipo: TIPO_REPORTE
        }

        let { error } = await supabase
          .from('reporte_pantallas')
          .insert(record)

        if (error && String(error.message || '').toLowerCase().includes('tipo')) {
          const { tipo: _tipo, ...legacyRecord } = record
          const retry = await supabase.from('reporte_pantallas').insert(legacyRecord)
          error = retry.error
        }

        if (error) throw error

        notify({ type: 'positive', message: 'Reporte guardado correctamente', icon: 'check_circle' })

        fotos.value.forEach(f => {
          if (f.preview) URL.revokeObjectURL(f.preview)
        })
        fotos.value = []
        numeroCasita.value = null
        notas.value = ''
        ahoraCR.value = new Date()
        router.push({ path: '/reporte-pantallas', query: { vista: 'reporte' } })
      } catch (err) {
        console.error('Error saving reporte pantallas:', err)
        notify({
          type: 'negative',
          message: esMovimiento.value ? 'Error al guardar el movimiento' : 'Error al guardar el reporte',
          caption: err.message
        })
      } finally {
        saving.value = false
      }
    }

    function goBack () {
      router.push('/reporte-pantallas')
    }

    onMounted(() => {
      clockTimer = setInterval(() => {
        ahoraCR.value = new Date()
      }, 1000)
    })

    onUnmounted(() => {
      if (clockTimer) clearInterval(clockTimer)
      fotos.value.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      if (pendingPhoto.value?.preview) {
        URL.revokeObjectURL(pendingPhoto.value.preview)
      }
    })

    return {
      authStore,
      nombreUsuario,
      fechaHoraDisplay,
      tipo,
      tipoOptions,
      esReporte,
      esMovimiento,
      selectTipo,
      numeroCasita,
      origenUbicacion,
      origenHabitacion,
      destinoUbicacion,
      destinoHabitacion,
      origenRequiereHabitacion,
      destinoRequiereHabitacion,
      notas,
      casitaOptions,
      ubicacionMovimientoOptions,
      habitacionOptions,
      ubicacionOptions,
      estadoOptions,
      estadoClass,
      fotos,
      saving,
      canSubmit,
      photoSheetOpen,
      photoMetaDialogOpen,
      photoMetaStep,
      pendingPhoto,
      pendingUbicacion,
      processingPhoto,
      fileInputCamera,
      fileInputGallery,
      openPhotoSheet,
      pickImageSource,
      onFileSelected,
      cancelPendingPhoto,
      selectUbicacion,
      selectEstado,
      removePhoto,
      saveReport,
      goBack
    }
  }
})
</script>

<style scoped>
.reporte-pantallas-page {
  max-width: 560px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  padding-top: 4px;
}

.form-card {
  background: white;
  border-radius: 20px;
  padding: 18px 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f7f7f8;
  border-radius: 12px;
  padding: 10px 12px;
}

.meta-label {
  font-size: 11px;
  font-weight: 600;
  color: #9e9e9e;
  line-height: 1.2;
}

.meta-value {
  font-size: 13px;
  font-weight: 600;
  color: #424242;
  line-height: 1.3;
  margin-top: 2px;
}

.form-section {
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.form-section--last {
  padding-bottom: 0;
}

.section-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #212121;
  letter-spacing: 0.02em;
}

.section-hint {
  font-size: 11px;
  font-weight: 600;
  color: #9e9e9e;
}

.section-copy {
  margin: -4px 0 12px;
  font-size: 12px;
  color: #757575;
  line-height: 1.4;
}

.tipo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tipo-card {
  appearance: none;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 76px;
  border: 1px solid #ececec;
  border-radius: 14px;
  background: #fafafa;
  color: #616161;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.tipo-card--active {
  background: #fff5f5;
  border-color: #e57373;
  color: #c62828;
}

.move-block {
  background: #f7f7f8;
  border-radius: 14px;
  padding: 12px;
}

.move-kicker {
  font-size: 11px;
  font-weight: 700;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.move-divider {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.photo-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.photo-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.55);
}

.photo-ubicacion-chip {
  font-size: 11px;
  font-weight: 600;
  color: #424242;
  text-align: center;
  line-height: 1.2;
}

.photo-estado-chip {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  text-transform: capitalize;
}

.photo-estado-chip.is-bad {
  color: #c62828;
}

.photo-estado-chip.is-ok {
  color: #2e7d32;
}

.photo-estado-chip.is-missing {
  color: #f9a825;
}

.photo-estado-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 5px;
}

.photo-estado-bar.is-bad {
  background: #c62828;
}

.photo-estado-bar.is-ok {
  background: #2e7d32;
}

.photo-estado-bar.is-missing {
  background: #fbc02d;
}

.add-photo-btn {
  appearance: none;
  font-family: inherit;
  min-height: 96px;
  aspect-ratio: 1;
  border: 1.5px dashed #d6d6d6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  background: #fafafa;
}

.add-photo-text {
  font-size: 12px;
  color: #9e9e9e;
  font-weight: 500;
}

.save-btn {
  height: 48px;
  font-weight: 600;
}

.photo-sheet {
  border-radius: 16px 16px 0 0;
}

.ubicacion-dialog {
  width: 100%;
  max-width: 600px;
  border-radius: 16px 16px 0 0;
  background: #fff;
}

.ubicacion-toolbar {
  background: #fff;
}

.ubicacion-body {
  max-height: 75vh;
  overflow: auto;
}

.pending-preview {
  width: 100%;
  max-height: 38vh;
  border-radius: 16px;
  overflow: hidden;
  background: #111;
}

.pending-img {
  width: 100%;
  max-height: 38vh;
}

.ubicacion-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ubicacion-option-btn {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
}

.body--dark .form-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .meta-item,
.body--dark .move-block {
  background: #2a2a2a;
}

.body--dark .section-title,
.body--dark .meta-value,
.body--dark .photo-ubicacion-chip {
  color: #e0e0e0;
}

.body--dark .tipo-card {
  background: #2a2a2a;
  border-color: #3a3a3a;
  color: #e0e0e0;
}

.body--dark .tipo-card--active {
  background: rgba(198, 40, 40, 0.16);
  border-color: #e57373;
  color: #ef9a9a;
}

.body--dark .add-photo-btn {
  background: #2a2a2a;
  border-color: #555;
}

.body--dark .ubicacion-dialog,
.body--dark .ubicacion-toolbar {
  background: #1e1e1e;
}
</style>
