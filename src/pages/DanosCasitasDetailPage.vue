<template>
  <q-page class="danos-detail-page q-pa-md">
    <!-- Header -->
    <div class="detail-header q-mb-md">
      <q-btn flat round dense icon="arrow_back" color="grey-8" @click="goBack" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold">Casita {{ casitaNum }}</div>
        <div class="text-caption text-grey-6">Registro de daños</div>
      </div>
    </div>

    <!-- Add report button -->
    <q-btn
      unelevated
      rounded
      color="primary"
      icon="add"
      label="Agregar Reporte"
      class="full-width add-report-btn q-mb-md"
      @click="openModal"
      :disable="!authStore.canAdd"
    />

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-sm text-grey-6 text-body2">Cargando reportes…</div>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="empty-state q-pa-xl">
      <q-icon name="error_outline" size="48px" color="red-4" />
      <div class="q-mt-sm text-body2 text-grey-7">{{ errorMsg }}</div>
      <q-btn flat dense color="primary" label="Reintentar" @click="fetchReports" class="q-mt-sm" />
    </div>

    <!-- Empty state -->
    <div v-else-if="reports.length === 0" class="empty-state q-pa-xl">
      <q-icon name="check_circle_outline" size="56px" color="green-4" />
      <div class="q-mt-sm text-body1 text-weight-medium text-grey-7">Sin reportes de daños</div>
      <div class="text-caption text-grey-5">Esta casita no tiene daños registrados</div>
    </div>

    <!-- Reports list -->
    <div v-else class="reports-list">
      <div
        v-for="report in reports"
        :key="report.id"
        class="report-card q-mb-sm"
      >
        <div class="report-card-header">
          <div class="report-meta">
            <q-icon name="person_outline" size="14px" color="grey-6" />
            <span class="text-weight-medium">{{ report.usuario }}</span>
          </div>
          <div class="report-date">
            <q-icon name="schedule" size="13px" color="grey-5" />
            <span>{{ formatDate(report.fecha) }}</span>
          </div>
        </div>

        <div class="report-detail">
          {{ report.detalle }}
        </div>

        <!-- Evidence thumbnails -->
        <div v-if="report.evidencia_dano && report.evidencia_dano.length > 0" class="evidence-row">
          <div
            v-for="(url, idx) in report.evidencia_dano"
            :key="idx"
            class="evidence-thumb"
            @click="openImageViewer(url)"
          >
            <q-img
              :src="getCloudinaryUrl(url, 'w_200,h_200,c_fill,q_auto')"
              :ratio="1"
              spinner-color="primary"
              class="thumb-img"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== ADD REPORT MODAL ==================== -->
    <q-dialog
      v-model="modalOpen"
      persistent
      transition-show="slide-up"
      transition-hide="slide-down"
      maximized
    >
      <q-card class="modal-card">
        <!-- Modal header -->
        <q-toolbar class="modal-toolbar">
          <q-btn flat round dense icon="close" color="grey-7" @click="closeModal" />
          <q-toolbar-title class="text-weight-bold text-body1">Nuevo Reporte · Casita {{ casitaNum }}</q-toolbar-title>
          <q-btn
            flat
            dense
            label="Guardar"
            color="primary"
            :loading="saving"
            :disable="!formValid"
            @click="saveReport"
          />
        </q-toolbar>

        <q-separator />

        <q-card-section class="modal-body q-pa-md">
          <!-- Detalle field -->
          <label class="field-label">Detalle del daño *</label>
          <q-input
            v-model="form.detalle"
            type="textarea"
            outlined
            autogrow
            :input-style="{ minHeight: '100px' }"
            placeholder="Describe el daño encontrado…"
            class="q-mb-md"
            :rules="[val => !!val && val.trim().length > 0 || 'Requerido']"
            lazy-rules
          />

          <!-- Evidence photos -->
          <label class="field-label">Evidencia fotográfica (máx. 2)</label>
          <div class="photos-zone q-mb-md">
            <!-- Existing previews -->
            <div
              v-for="(photo, idx) in form.photos"
              :key="idx"
              class="photo-preview"
            >
              <q-img :src="photo.preview" :ratio="1" class="preview-img" />
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
            </div>

            <!-- Add photo button -->
            <div
              v-if="form.photos.length < 2"
              class="add-photo-btn"
              @click="triggerFileInput"
            >
              <q-icon name="add_a_photo" size="28px" color="grey-5" />
              <span class="add-photo-text">Foto</span>
            </div>
          </div>

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            capture="environment"
            style="display:none"
            @change="onFileSelected"
          />

          <!-- Info chips -->
          <div class="info-chips">
            <q-chip dense outline icon="person" color="grey-7" size="sm">
              {{ currentUser }}
            </q-chip>
            <q-chip dense outline icon="event" color="grey-7" size="sm">
              {{ currentDate }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ==================== IMAGE VIEWER ==================== -->
    <q-dialog v-model="viewerOpen" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black" style="min-height:100vh;position:relative;overflow:hidden">
        <q-btn
          flat
          round
          icon="close"
          color="white"
          class="absolute-top-right q-ma-md"
          style="z-index:2"
          @click="closeViewer"
        />
        <div
          class="viewer-container column items-center justify-center"
          @pointerdown="onViewerPointerDown"
          @pointermove="onViewerPointerMove"
          @pointerup="onViewerPointerUp"
          @pointercancel="onViewerPointerUp"
          @pointerleave="onViewerPointerUp"
        >
          <img
            :src="viewerUrl"
            class="viewer-img"
            :style="{
              transform: `translate3d(${viewerTranslate.x}px, ${viewerTranslate.y}px, 0) scale(${viewerScale})`
            }"
            draggable="false"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'DanosCasitasDetailPage',
  setup () {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const $q = useQuasar()

    const casitaNum = computed(() => Number(route.params.numero) || 0)
    const currentUser = computed(() => authStore.user?.Usuario || 'Desconocido')
    const currentDate = computed(() => formatNow())

    // ---- State ----
    const loading = ref(true)
    const errorMsg = ref('')
    const reports = ref([])
    const modalOpen = ref(false)
    const saving = ref(false)
    const fileInput = ref(null)

    // Image viewer
    const viewerOpen = ref(false)
    const viewerUrl = ref('')
    const viewerScale = ref(1)
    const viewerTranslate = ref({ x: 0, y: 0 })
    const activePointers = new Map()
    const lastPanPos = ref(null)
    const baseDistance = ref(null)
    const startScale = ref(1)

    // Form
    const form = ref({
      detalle: '',
      photos: [] // { file, preview }
    })

    const formValid = computed(() => {
      return form.value.detalle && form.value.detalle.trim().length > 0
    })

    // ---- Helpers ----
    function formatNow () {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    function formatDate (dateStr) {
      if (!dateStr) return ''
      try {
        const d = new Date(dateStr)
        const pad = n => String(n).padStart(2, '0')
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      } catch {
        return dateStr
      }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getCompressionConfig = () => {
      return isIOS ? {
        targetSizeKB: 600,
        maxResolution: 1200,
        maxQuality: 0.85,
        minQuality: 0.50,
        maxAttempts: 10,
        timeout: 30000,
        format: 'jpeg'
      } : {
        targetSizeKB: 600,
        maxResolution: 1600,
        maxQuality: 0.75,
        minQuality: 0.50,
        maxAttempts: 10,
        timeout: 30000,
        format: 'webp'
      }
    }

    const compressImage = async (file) => {
      const config = getCompressionConfig()
      const originalSize = file.size

      return new Promise(async (resolve, reject) => {
        try {
          const img = new Image()
          const url = URL.createObjectURL(file)
          await new Promise((res, rej) => {
            img.onload = res
            img.onerror = rej
            img.src = url
          })
          if ('decode' in img) await img.decode()

          const decodeSafely = async (rawFile, image) => {
            if ('createImageBitmap' in window) {
              try {
                const tempUrl = URL.createObjectURL(rawFile)
                const tempBlob = await fetch(tempUrl).then(r => r.blob())
                URL.revokeObjectURL(tempUrl)
                return await createImageBitmap(tempBlob)
              } catch (e) {
                console.warn('[Compression] createImageBitmap failed, fallback to img', e)
              }
            }
            return image
          }

          const normalizeCanvas = document.createElement('canvas')
          normalizeCanvas.width = img.width
          normalizeCanvas.height = img.height
          const nCtx = normalizeCanvas.getContext('2d', { willReadFrequently: true, alpha: false })
          if (!nCtx) throw new Error('Could not get normalization context')
          nCtx.fillStyle = '#FFFFFF'
          nCtx.fillRect(0, 0, normalizeCanvas.width, normalizeCanvas.height)
          const source = await decodeSafely(file, img)
          nCtx.drawImage(source, 0, 0)
          if (source instanceof ImageBitmap) source.close()

          let width = img.width
          let height = img.height
          let currentCanvas = normalizeCanvas

          while (width > config.maxResolution * 1.5) {
            const nextWidth = Math.floor(width / 2)
            const nextHeight = Math.floor(height / 2)
            const nextCanvas = document.createElement('canvas')
            const nextCtx = nextCanvas.getContext('2d', { alpha: false })
            nextCanvas.width = nextWidth
            nextCanvas.height = nextHeight
            nextCtx.fillStyle = '#FFFFFF'
            nextCtx.fillRect(0, 0, nextWidth, nextHeight)
            nextCtx.drawImage(currentCanvas, 0, 0, width, height, 0, 0, nextWidth, nextHeight)

            if (currentCanvas !== normalizeCanvas) {
              currentCanvas.width = 0
              currentCanvas.height = 0
            }
            currentCanvas = nextCanvas
            width = nextWidth
            height = nextHeight
          }

          const ratio = Math.min(config.maxResolution / width, config.maxResolution / height)
          const targetW = Math.round(width * ratio)
          const targetH = Math.round(height * ratio)
          const finalCanvas = document.createElement('canvas')
          const finalCtx = finalCanvas.getContext('2d', { alpha: false })
          finalCanvas.width = targetW
          finalCanvas.height = targetH
          finalCtx.fillStyle = '#FFFFFF'
          finalCtx.fillRect(0, 0, targetW, targetH)
          finalCtx.drawImage(currentCanvas, 0, 0, width, height, 0, 0, targetW, targetH)

          URL.revokeObjectURL(url)
          if (currentCanvas !== normalizeCanvas) {
            currentCanvas.width = 0
            currentCanvas.height = 0
          }
          normalizeCanvas.width = 0
          normalizeCanvas.height = 0

          let quality = config.maxQuality
          let attempts = 0

          const generateBlob = () => {
            finalCanvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to generate final blob'))
                return
              }

              const sizeKB = blob.size / 1024
              if (sizeKB <= config.targetSizeKB || attempts >= config.maxAttempts || quality <= config.minQuality) {
                const finalFormat = config.format
                const finalFile = new File([blob], `normalized.${finalFormat}`, { type: `image/${finalFormat}` })
                console.log('[Compression] Reduced', formatBytes(originalSize), '→', formatBytes(finalFile.size))
                finalCanvas.width = 0
                finalCanvas.height = 0
                resolve(finalFile)
              } else {
                quality -= 0.05
                attempts++
                generateBlob()
              }
            }, `image/${config.format}`, quality)
          }

          generateBlob()
        } catch (error) {
          console.error('[Compression] Failed:', error)
          reject(error)
        }
      })
    }

    const CLOUDINARY_BASE = 'https://res.cloudinary.com/dhd61lan4/image/upload'

    function getCloudinaryUrl (url, transforms) {
      if (!url) return ''
      // Already a full URL
      if (url.startsWith('http')) {
        if (transforms && url.includes('/upload/')) {
          return url.replace('/upload/', `/upload/${transforms}/`)
        }
        return url
      }
      // Relative path stored
      const cleanPath = url.replace(/^\/+/, '')
      if (transforms) {
        return `${CLOUDINARY_BASE}/${transforms}/${cleanPath}`
      }
      return `${CLOUDINARY_BASE}/${cleanPath}`
    }

    // ---- Fetch reports ----
    async function fetchReports () {
      loading.value = true
      errorMsg.value = ''
      try {
        const { data, error } = await supabase
          .from('danos_casitas')
          .select('*')
          .eq('casita', casitaNum.value)
          .order('fecha', { ascending: false })

        if (error) throw error
        reports.value = data || []
      } catch (err) {
        console.error('Error fetching reports:', err)
        errorMsg.value = 'No se pudieron cargar los reportes'
      } finally {
        loading.value = false
      }
    }

    // ---- Modal ----
    function openModal () {
      form.value = { detalle: '', photos: [] }
      modalOpen.value = true
    }

    function closeModal () {
      modalOpen.value = false
    }

    // ---- Photos ----
    function triggerFileInput () {
      if (fileInput.value) fileInput.value.click()
    }

    async function onFileSelected (e) {
      const file = e.target.files?.[0]
      if (!file) return
      if (form.value.photos.length >= 2) {
        $q.notify({ type: 'warning', message: 'Máximo 2 fotos permitidas' })
        return
      }

      try {
        const compressed = await compressImage(file)
        const preview = URL.createObjectURL(compressed)
        form.value.photos.push({ file: compressed, preview })
        const reduction = Math.max(0, Math.round(((file.size - compressed.size) / file.size) * 100))
        $q.notify({ type: 'info', message: 'Foto optimizada', caption: `Reducción ${reduction}%` })
      } catch (err) {
        console.error('Compression failed, using original file', err)
        const fallbackPreview = URL.createObjectURL(file)
        form.value.photos.push({ file, preview: fallbackPreview })
      }

      // Reset input so the same file can be re-selected
      if (fileInput.value) fileInput.value.value = ''
    }

    function removePhoto (idx) {
      const removed = form.value.photos.splice(idx, 1)
      if (removed[0]?.preview) URL.revokeObjectURL(removed[0].preview)
    }

    // ---- Upload to Cloudinary ----
    async function uploadToCloudinary (file) {
      const timestamp = Date.now()
      const publicId = `dano_${casitaNum.value}_${timestamp}`
      const folderPath = 'evidencias_danos'

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

    // ---- Save report ----
    async function saveReport () {
      if (!formValid.value) return
      saving.value = true
      try {
        // Upload photos
        const urls = []
        for (const photo of form.value.photos) {
          const url = await uploadToCloudinary(photo.file)
          if (url) urls.push(url)
        }

        const record = {
          casita: casitaNum.value,
          usuario: currentUser.value,
          detalle: form.value.detalle.trim(),
          fecha: formatNow(),
          evidencia_dano: urls
        }

        const { error } = await supabase
          .from('danos_casitas')
          .insert(record)

        if (error) throw error

        $q.notify({ type: 'positive', message: 'Reporte guardado correctamente', icon: 'check_circle' })
        modalOpen.value = false
        await fetchReports()
      } catch (err) {
        console.error('Error saving report:', err)
        $q.notify({ type: 'negative', message: 'Error al guardar el reporte', caption: err.message })
      } finally {
        saving.value = false
      }
    }

    // ---- Image viewer ----
    function openImageViewer (url) {
      viewerUrl.value = getCloudinaryUrl(url, 'w_1600,q_auto')
      resetViewerTransform()
      viewerOpen.value = true
    }

    function closeViewer () {
      viewerOpen.value = false
      resetViewerTransform()
    }

    function resetViewerTransform () {
      viewerScale.value = 1
      viewerTranslate.value = { x: 0, y: 0 }
      activePointers.clear()
      baseDistance.value = null
      startScale.value = 1
      lastPanPos.value = null
    }

    const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

    function onViewerPointerDown (e) {
      e.preventDefault()
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (activePointers.size === 1) {
        lastPanPos.value = { x: e.clientX, y: e.clientY }
      }
      if (activePointers.size === 2) {
        const pts = [...activePointers.values()]
        baseDistance.value = getDistance(pts[0], pts[1])
        startScale.value = viewerScale.value
      }
      e.target.setPointerCapture(e.pointerId)
    }

    function onViewerPointerMove (e) {
      if (!activePointers.has(e.pointerId)) return
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointers.size === 2) {
        const pts = [...activePointers.values()]
        const dist = getDistance(pts[0], pts[1])
        if (baseDistance.value) {
          const scale = clamp(startScale.value * (dist / baseDistance.value), 1, 3.5)
          viewerScale.value = scale
        }
      } else if (activePointers.size === 1 && viewerScale.value > 1) {
        const curr = activePointers.values().next().value
        if (lastPanPos.value) {
          const dx = curr.x - lastPanPos.value.x
          const dy = curr.y - lastPanPos.value.y
          const maxPan = 300
          viewerTranslate.value = {
            x: clamp(viewerTranslate.value.x + dx, -maxPan, maxPan),
            y: clamp(viewerTranslate.value.y + dy, -maxPan, maxPan)
          }
        }
        lastPanPos.value = { x: curr.x, y: curr.y }
      }
    }

    function onViewerPointerUp (e) {
      activePointers.delete(e.pointerId)
      if (activePointers.size < 2) {
        baseDistance.value = null
        startScale.value = viewerScale.value
      }
      if (activePointers.size === 0) {
        lastPanPos.value = null
      }
    }

    function getDistance (p1, p2) {
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      return Math.hypot(dx, dy)
    }

    // ---- Navigation ----
    function goBack () {
      router.push('/danos-casitas')
    }

    onMounted(fetchReports)

    return {
      casitaNum,
      currentUser,
      currentDate,
      loading,
      errorMsg,
      reports,
      modalOpen,
      saving,
      form,
      formValid,
      fileInput,
      viewerOpen,
      viewerUrl,
      authStore,
      formatDate,
      getCloudinaryUrl,
      fetchReports,
      openModal,
      closeModal,
      triggerFileInput,
      onFileSelected,
      removePhoto,
      saveReport,
      openImageViewer,
      closeViewer,
      onViewerPointerDown,
      onViewerPointerMove,
      onViewerPointerUp,
      viewerScale,
      viewerTranslate,
      goBack
    }
  }
})
</script>

<style scoped>
.danos-detail-page {
  max-width: 600px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  padding-top: 4px;
}

.add-report-btn {
  height: 48px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
}

/* ---- Reports ---- */
.report-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.report-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #333;
}

.report-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
}

.report-detail {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* Evidence */
.evidence-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.evidence-thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.thumb-img {
  width: 100%;
  height: 100%;
}

/* Empty state */
.empty-state {
  text-align: center;
  margin-top: 20px;
}

/* Viewer */
.viewer-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
}

.viewer-img {
  max-width: 100%;
  max-height: 90vh;
  transition: transform 0.05s linear;
  user-select: none;
  pointer-events: none;
}

/* ---- Modal ---- */
.modal-card {
  border-radius: 0;
}

.modal-toolbar {
  background: #fff;
  min-height: 52px;
}

.modal-body {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}

/* Photos zone */
.photos-zone {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.photo-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
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
  backdrop-filter: blur(4px);
}

.add-photo-btn {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  border: 2px dashed #d0d0d0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.add-photo-btn:active {
  background: #f5f5f5;
  border-color: #aaa;
}

.add-photo-text {
  font-size: 11px;
  color: #999;
  font-weight: 500;
}

.info-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Dark mode */
.body--dark .report-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .report-detail {
  color: #ccc;
}

.body--dark .report-meta {
  color: #ccc;
}

.body--dark .modal-toolbar {
  background: #1e1e1e;
}

.body--dark .add-photo-btn {
  border-color: #444;
}

.body--dark .add-photo-btn:active {
  background: #2a2a2a;
}
</style>
