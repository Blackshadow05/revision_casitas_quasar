<template>
  <q-page class="incident-detail-page">
    <div class="detail-container">
      <!-- Header con gradiente -->
      <div class="detail-header q-pa-lg">
        <q-btn flat round dense icon="arrow_back" color="white" @click="goBack" class="q-mr-sm" />
        <div class="col">
          <div class="text-h5 text-weight-bold text-white">{{ isNew ? 'Nuevo Incidente' : 'Detalle del Incidente' }}</div>
          <div class="text-caption text-white">{{ isNew ? 'Complete el formulario para registrar un incidente' : form.title }}</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingData" class="text-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-md text-grey-6 text-body2">Cargando incidente...</div>
      </div>

      <!-- MODO EDICIÓN: Formulario nuevo -->
      <div v-else-if="isNew" class="form-section q-pa-md">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="edit" color="primary" class="q-mr-sm" />
              Información del Incidente
            </div>

            <q-input
              v-model="form.title"
              label="Título del incidente *"
              outlined
              rounded
              class="q-mb-md"
              :rules="[val => !!val && val.trim().length > 0 || 'Requerido']"
              lazy-rules
            >
              <template v-slot:prepend>
                <q-icon name="title" color="primary" />
              </template>
            </q-input>

            <q-select
              v-model="form.category"
              :options="categoryOptions"
              label="Categoría *"
              outlined
              rounded
              class="q-mb-md"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="category" color="primary" />
              </template>
            </q-select>

            <q-input
              v-model="form.description"
              label="Descripción detallada"
              type="textarea"
              outlined
              rounded
              autogrow
              class="q-mb-md"
              :input-style="{ minHeight: '120px' }"
              placeholder="Relate qué sucedió, cuándo y cómo ocurrió..."
            >
              <template v-slot:prepend>
                <q-icon name="description" color="primary" />
              </template>
            </q-input>

            <div class="q-mb-md">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">
                <q-icon name="warning" color="primary" class="q-mr-xs" />
                Nivel de Prioridad *
              </div>
              <div class="priority-selector">
                <q-btn
                  v-for="option in priorityOptions"
                  :key="option.value"
                  rounded
                  no-caps
                  unelevated
                  class="priority-option"
                  :color="form.priority === option.value ? 'negative' : 'primary'"
                  :icon="option.icon"
                  :label="option.label"
                  @click="form.priority = option.value"
                />
              </div>
            </div>

            <!-- Fecha y hora local -->
            <q-input
              v-model="localDateTime"
              label="Fecha y hora del registro"
              outlined
              rounded
              class="q-mb-md"
              readonly
              disable
            >
              <template v-slot:prepend>
                <q-icon name="schedule" color="grey-6" />
              </template>
            </q-input>
          </q-card-section>
        </q-card>

        <!-- Evidencia fotográfica -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">
              <q-icon name="photo_camera" color="primary" class="q-mr-sm" />
              Evidencia Fotográfica
            </div>
            <div class="text-caption text-grey-7 q-mb-sm">Adjunte hasta 4 fotos del incidente</div>

            <div class="photos-zone">
              <div v-for="(photo, idx) in newPhotos" :key="idx" class="photo-preview">
                <q-img :src="photo.preview" :ratio="1" class="preview-img" />
                <q-btn round flat dense icon="close" size="xs" color="white" class="remove-photo-btn" @click="removePhoto(idx)" />
              </div>
              <div v-if="newPhotos.length < 4" class="add-photo-btn" @click="triggerFileInput">
                <q-icon name="add_a_photo" size="32px" color="primary" />
                <span class="add-photo-text">Agregar Foto</span>
              </div>
            </div>
            <input ref="fileInputCamera" type="file" accept="image/*" capture="environment" style="display:none" @change="onFileSelected" />
            <input ref="fileInputGallery" type="file" accept="image/*" style="display:none" @change="onFileSelected" />
          </q-card-section>
        </q-card>

        <!-- Info chips -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              <q-icon name="person" color="primary" class="q-mr-xs" />
              Información del Registro
            </div>
            <div class="info-chips-row">
              <q-chip dense outline icon="person" color="primary" text-color="white" size="sm">
                {{ currentUser }}
              </q-chip>
              <q-chip dense outline icon="event" color="primary" text-color="white" size="sm">
                {{ currentDate }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>

        <!-- Actions -->
        <q-btn
          unelevated
          rounded
          color="primary"
          :label="isNew ? 'Registrar Incidente' : 'Guardar Cambios'"
          class="full-width q-mb-md"
          style="text-transform: none; font-weight: 600;"
          size="lg"
          :loading="saving"
          :disable="!formValid"
          @click="saveIncident"
        />
      </div>

      <!-- MODO VISUALIZACIÓN: Incidente existente -->
      <div v-else class="view-section q-pa-md">
        <!-- Info Card principal -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-h5 text-weight-bold">{{ form.title }}</div>
                <div class="text-caption text-grey-7">Registrado por {{ currentUser }}</div>
              </div>
              <q-badge :color="priorityColor" :label="form.priority" class="q-ml-sm priority-badge" />
            </div>

            <q-separator class="q-mb-md" />

            <div class="info-grid q-mb-md">
              <div class="info-item">
                <q-icon name="category" color="primary" size="sm" class="q-mr-sm" />
                <div>
                  <div class="text-caption text-grey-7">Categoría</div>
                  <div class="text-body2 text-weight-bold">{{ form.category }}</div>
                </div>
              </div>
              <div class="info-item">
                <q-icon name="schedule" color="primary" size="sm" class="q-mr-sm" />
                <div>
                  <div class="text-caption text-grey-7">Fecha y Hora</div>
                  <div class="text-body2 text-weight-bold">{{ localDateTime }}</div>
                </div>
              </div>
              <div class="info-item">
                <q-icon name="flag" color="primary" size="sm" class="q-mr-sm" />
                <div>
                  <div class="text-caption text-grey-7">Estado</div>
                  <q-select
                    v-model="form.status"
                    :options="statusOptions"
                    dense
                    outlined
                    rounded
                    class="status-select"
                    emit-value
                    map-options
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Descripción -->
        <q-card flat bordered class="q-mb-md" v-if="form.description">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              <q-icon name="description" color="primary" class="q-mr-xs" />
              Descripción del Incidente
            </div>
            <q-separator class="q-mb-sm" />
            <div class="text-body2 description-text">{{ form.description }}</div>
          </q-card-section>
        </q-card>

        <!-- Evidencia fotográfica -->
        <q-card flat bordered class="q-mb-md" v-if="existingEvidence.length > 0">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              <q-icon name="photo_library" color="primary" class="q-mr-xs" />
              Evidencia Fotográfica ({{ existingEvidence.length }})
            </div>
            <q-separator class="q-mb-sm" />

            <div class="evidence-grid">
              <div
                v-for="(url, idx) in existingEvidence"
                :key="'existing-' + idx"
                class="evidence-card"
                @click="openImageViewer(url)"
              >
                <q-img
                  :src="getCloudinaryUrl(url, 'w_300,h_300,c_fill,q_auto')"
                  :ratio="1"
                  spinner-color="primary"
                  class="evidence-img"
                >
                  <template v-slot:error>
                    <div class="absolute-full flex flex-center bg-negative">
                      <q-icon name="broken_image" color="white" />
                    </div>
                  </template>
                </q-img>
                <div class="evidence-label">Foto {{ idx + 1 }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Actions -->
        <q-btn
          v-if="form.status !== 'Resuelto'"
          unelevated
          rounded
          color="green"
          label="Marcar como Resuelto"
          class="full-width q-mb-md"
          style="text-transform: none; font-weight: 600;"
          size="lg"
          icon="check_circle"
          @click="resolveIncident"
          :loading="saving"
        />
      </div>

      <!-- Image Viewer -->
      <q-dialog v-model="viewerOpen" maximized transition-show="fade" transition-hide="fade">
        <q-card class="bg-black" style="min-height:100vh;position:relative;overflow:hidden">
          <q-btn flat round icon="close" color="white" class="absolute-top-right q-ma-md" style="z-index:2" @click="viewerOpen = false" />
          <div class="column items-center justify-center" style="min-height:100vh">
            <img :src="viewerUrl" style="max-width:100%;max-height:90vh;object-fit:contain" draggable="false" />
          </div>
        </q-card>
      </q-dialog>

      <q-dialog v-model="imageSourceDialog">
        <q-card style="min-width: 280px">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Seleccionar imagen</div>
            <div class="text-caption text-grey-6">Elige si deseas tomar una foto o cargarla desde la galería.</div>
          </q-card-section>
          <q-card-actions vertical align="stretch" class="q-pa-md q-pt-none">
            <q-btn unelevated color="primary" icon="photo_camera" label="Tomar foto" no-caps @click="pickImageSource('camera')" />
            <q-btn flat color="grey-8" icon="photo_library" label="Elegir de galería" no-caps @click="pickImageSource('gallery')" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { notify } from '../utils/notify'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'IncidentDetailPage',
  setup () {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const $q = useQuasar()

    const incidentId = computed(() => route.params.id)
    const isNew = computed(() => !incidentId.value || incidentId.value === 'nuevo')
    const currentUser = computed(() => authStore.user?.Usuario || 'Desconocido')
    const currentDate = computed(() => {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    })
    const localDateTime = computed(() => {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    })

    const loadingData = ref(false)
    const saving = ref(false)
    const fileInputCamera = ref(null)
    const fileInputGallery = ref(null)
    const newPhotos = ref([])
    const existingEvidence = ref([])
    const viewerOpen = ref(false)
    const viewerUrl = ref('')
    const imageSourceDialog = ref(false)

    const categoryOptions = ['Robo', 'Médico', 'Incendio', 'Falla Técnica', 'Otro']
    const statusOptions = ['Abierto', 'En Investigación', 'Resuelto']
    const priorityOptions = [
      { label: 'Baja', value: 'Baja', icon: 'info' },
      { label: 'Media', value: 'Media', icon: 'warning' },
      { label: 'Alta', value: 'Alta', icon: 'error' }
    ]

    const form = ref({
      title: '',
      category: 'Otro',
      description: '',
      priority: 'Media',
      status: 'Abierto'
    })

    const formValid = computed(() => {
      return form.value.title && form.value.title.trim().length > 0 && form.value.category && form.value.priority
    })

    const priorityColor = computed(() => {
      const colors = {
        'Baja': 'blue',
        'Media': 'orange',
        'Alta': 'red'
      }
      return colors[form.value.priority] || 'grey'
    })

    const goBack = () => {
      router.push('/seguridad/incidentes')
    }

    // Image handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    const getCompressionConfig = () => {
      return isIOS ? {
        targetSizeKB: 600, maxResolution: 1200, maxQuality: 0.85, minQuality: 0.50, maxAttempts: 10, format: 'jpeg'
      } : {
        targetSizeKB: 600, maxResolution: 1600, maxQuality: 0.75, minQuality: 0.50, maxAttempts: 10, format: 'webp'
      }
    }

    const compressImage = async (file) => {
      const config = getCompressionConfig()
      return new Promise(async (resolve, reject) => {
        try {
          const img = new Image()
          const url = URL.createObjectURL(file)
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url })
          if ('decode' in img) await img.decode()

          const normalizeCanvas = document.createElement('canvas')
          normalizeCanvas.width = img.width
          normalizeCanvas.height = img.height
          const nCtx = normalizeCanvas.getContext('2d', { willReadFrequently: true, alpha: false })
          nCtx.fillStyle = '#FFFFFF'
          nCtx.fillRect(0, 0, normalizeCanvas.width, normalizeCanvas.height)
          nCtx.drawImage(img, 0, 0)

          let width = img.width
          let height = img.height
          let currentCanvas = normalizeCanvas

          while (width > config.maxResolution * 1.5) {
            const nw = Math.floor(width / 2)
            const nh = Math.floor(height / 2)
            const nc = document.createElement('canvas')
            const ctx = nc.getContext('2d', { alpha: false })
            nc.width = nw; nc.height = nh
            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, nw, nh)
            ctx.drawImage(currentCanvas, 0, 0, width, height, 0, 0, nw, nh)
            if (currentCanvas !== normalizeCanvas) { currentCanvas.width = 0; currentCanvas.height = 0 }
            currentCanvas = nc; width = nw; height = nh
          }

          const ratio = Math.min(config.maxResolution / width, config.maxResolution / height)
          const tw = Math.round(width * ratio)
          const th = Math.round(height * ratio)
          const fc = document.createElement('canvas')
          const fCtx = fc.getContext('2d', { alpha: false })
          fc.width = tw; fc.height = th
          fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 0, tw, th)
          fCtx.drawImage(currentCanvas, 0, 0, width, height, 0, 0, tw, th)

          URL.revokeObjectURL(url)
          if (currentCanvas !== normalizeCanvas) { currentCanvas.width = 0; currentCanvas.height = 0 }
          normalizeCanvas.width = 0; normalizeCanvas.height = 0

          let quality = config.maxQuality
          let attempts = 0

          const generateBlob = () => {
            fc.toBlob((blob) => {
              if (!blob) { reject(new Error('Failed to generate blob')); return }
              const sizeKB = blob.size / 1024
              if (sizeKB <= config.targetSizeKB || attempts >= config.maxAttempts || quality <= config.minQuality) {
                const finalFile = new File([blob], `compressed.${config.format}`, { type: `image/${config.format}` })
                fc.width = 0; fc.height = 0
                resolve(finalFile)
              } else {
                quality -= 0.05; attempts++; generateBlob()
              }
            }, `image/${config.format}`, quality)
          }
          generateBlob()
        } catch (error) {
          reject(error)
        }
      })
    }

    const CLOUDINARY_BASE = 'https://res.cloudinary.com/dhd61lan4/image/upload'

    function getCloudinaryUrl (url, transforms) {
      if (!url) return ''
      if (url.startsWith('http')) {
        if (transforms && url.includes('/upload/')) {
          return url.replace('/upload/', `/upload/${transforms}/`)
        }
        return url
      }
      const cleanPath = url.replace(/^\/+/, '')
      return transforms ? `${CLOUDINARY_BASE}/${transforms}/${cleanPath}` : `${CLOUDINARY_BASE}/${cleanPath}`
    }

    function triggerFileInput () {
      imageSourceDialog.value = true
    }

    function pickImageSource (source) {
      imageSourceDialog.value = false
      if (source === 'camera' && fileInputCamera.value) {
        fileInputCamera.value.click()
      }
      if (source === 'gallery' && fileInputGallery.value) {
        fileInputGallery.value.click()
      }
    }

    async function onFileSelected (e) {
      const file = e.target.files?.[0]
      if (!file) return
      if (newPhotos.value.length >= 4) {
        notify({ type: 'warning', message: 'Máximo 4 fotos' })
        return
      }
      try {
        const compressed = await compressImage(file)
        const preview = URL.createObjectURL(compressed)
        newPhotos.value.push({ file: compressed, preview })
      } catch {
        const preview = URL.createObjectURL(file)
        newPhotos.value.push({ file, preview })
      }
      if (fileInputCamera.value) fileInputCamera.value.value = ''
      if (fileInputGallery.value) fileInputGallery.value.value = ''
    }

    function removePhoto (idx) {
      const removed = newPhotos.value.splice(idx, 1)
      if (removed[0]?.preview) URL.revokeObjectURL(removed[0].preview)
    }

    function openImageViewer (url) {
      viewerUrl.value = getCloudinaryUrl(url, 'w_1600,q_auto')
      viewerOpen.value = true
    }

    async function uploadToCloudinary (file) {
      const timestamp = Date.now()
      const publicId = `incidente_${timestamp}`
      const now = new Date()
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      const folderPath = `Evidencias/Seguridad/${monthNames[now.getMonth()]} ${now.getFullYear()}`

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

    // Fetch existing incident
    const fetchIncident = async () => {
      if (isNew.value) return
      loadingData.value = true
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', incidentId.value)
          .single()
        if (error) throw error
        if (data) {
          form.value.title = data.title
          form.value.category = data.category
          form.value.description = data.description || ''
          form.value.priority = data.priority
          form.value.status = data.status
          existingEvidence.value = data.evidence_urls || []
        }
      } catch (err) {
        console.error('Error fetching incident:', err)
        notify({ type: 'negative', message: 'Error al cargar incidente' })
      } finally {
        loadingData.value = false
      }
    }

    const saveIncident = async () => {
      if (!formValid.value) return
      saving.value = true
      try {
        // Upload new photos
        const uploadedUrls = []
        for (const photo of newPhotos.value) {
          const url = await uploadToCloudinary(photo.file)
          if (url) uploadedUrls.push(url)
        }

        const allEvidence = [...existingEvidence.value, ...uploadedUrls]

        if (isNew.value) {
          // Obtener fecha y hora local del dispositivo sin zona horaria
          const now = new Date()
          const pad = n => String(n).padStart(2, '0')
          const localCreatedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

          const record = {
            guard_id: currentUser.value,
            title: form.value.title.trim(),
            category: form.value.category,
            description: form.value.description?.trim() || null,
            priority: form.value.priority,
            status: 'Abierto',
            evidence_urls: allEvidence,
            created_at: localCreatedAt
          }
          const { error } = await supabase.from('incidents').insert(record)
          if (error) throw error
          notify({ type: 'positive', message: 'Incidente registrado', icon: 'check_circle' })
        } else {
          const updates = {
            title: form.value.title.trim(),
            category: form.value.category,
            description: form.value.description?.trim() || null,
            priority: form.value.priority,
            status: form.value.status,
            evidence_urls: allEvidence
          }
          if (form.value.status === 'Resuelto') {
            // Usar hora local también para resolved_at
            const now = new Date()
            const pad = n => String(n).padStart(2, '0')
            const localResolvedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
            updates.resolved_at = localResolvedAt
          }
          const { error } = await supabase
            .from('incidents')
            .update(updates)
            .eq('id', incidentId.value)
          if (error) throw error
          notify({ type: 'positive', message: 'Incidente actualizado', icon: 'check_circle' })
        }
        router.push('/seguridad/incidentes')
      } catch (err) {
        console.error('Error saving incident:', err)
        notify({ type: 'negative', message: 'Error al guardar', caption: err.message })
      } finally {
        saving.value = false
      }
    }

    const resolveIncident = async () => {
      saving.value = true
      try {
        // Usar hora local del dispositivo
        const now = new Date()
        const pad = n => String(n).padStart(2, '0')
        const localResolvedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

        const { error } = await supabase
          .from('incidents')
          .update({ status: 'Resuelto', resolved_at: localResolvedAt })
          .eq('id', incidentId.value)
        if (error) throw error
        notify({ type: 'positive', message: 'Incidente resuelto', icon: 'check_circle' })
        router.push('/seguridad/incidentes')
      } catch (err) {
        console.error('Error resolving incident:', err)
        notify({ type: 'negative', message: 'Error al resolver', caption: err.message })
      } finally {
        saving.value = false
      }
    }

    onMounted(fetchIncident)

    return {
      router,
      isNew,
      currentUser,
      currentDate,
      localDateTime,
      loadingData,
      saving,
      form,
      formValid,
      priorityColor,
      categoryOptions,
      statusOptions,
      priorityOptions,
      newPhotos,
      existingEvidence,
      fileInputCamera,
      fileInputGallery,
      viewerOpen,
      viewerUrl,
      imageSourceDialog,
      goBack,
      triggerFileInput,
      pickImageSource,
      onFileSelected,
      removePhoto,
      openImageViewer,
      getCloudinaryUrl,
      saveIncident,
      resolveIncident
    }
  }
})
</script>

<style scoped>
.incident-detail-page {
  background: #f5f7fa;
  min-height: 100vh;
}

.detail-container {
  max-width: 800px;
  margin: 0 auto;
}

/* Header con gradiente */
.detail-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Secciones */
.form-section,
.view-section {
  padding-bottom: 24px;
}

/* Grid de información en modo vista */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Badge de prioridad */
.priority-badge {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
}

/* Select de estado */
.status-select {
  max-width: 180px;
}

.priority-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.priority-option {
  min-height: 44px;
  font-weight: 600;
}

/* Texto de descripción */
.description-text {
  line-height: 1.7;
  color: #495057;
  white-space: pre-wrap;
}

/* Grid de evidencias */
.evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.evidence-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.evidence-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.evidence-img {
  border-radius: 12px 12px 0 0;
}

.evidence-label {
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  background: white;
}

/* Zona de fotos */
.photos-zone {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.photo-preview {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-img {
  border-radius: 12px;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.add-photo-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 8px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.add-photo-btn:hover {
  border-color: #667eea;
  background: #e7e9ff;
  transform: scale(1.05);
}

.add-photo-text {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

/* Info chips row */
.info-chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 600px) {
  .detail-header {
    margin: 8px;
    padding: 16px;
  }

  .form-section,
  .view-section {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .priority-selector {
    grid-template-columns: 1fr;
  }

  .evidence-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .photo-preview,
  .add-photo-btn {
    width: 100px;
    height: 100px;
  }
}
</style>
