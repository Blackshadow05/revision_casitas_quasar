<template>
  <q-page class="lf-detail-page">
    <div class="lf-uber-container">
      <!-- Header -->
      <header class="lf-detail-header">
        <q-btn flat round dense icon="arrow_back" class="lf-back-btn" @click="goBack" />
        <div class="col">
          <div class="lf-kicker">{{ isNew ? 'Nuevo Ingreso' : 'Expediente de Objeto' }}</div>
          <h1 class="lf-detail-title">{{ isNew ? 'Registrar hallazgo' : form.item_name }}</h1>
        </div>
        <div v-if="!isNew && form" :class="['lf-status-badge', `lf-status-badge--${getStatusTone(form.status)}`]">
          {{ form.status }}
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loadingData" class="lf-loading-state text-center q-pa-xl">
        <q-spinner color="dark" size="42px" />
        <div class="q-mt-md text-weight-medium">Recuperando información...</div>
      </div>

      <!-- Content -->
      <div v-else-if="form" class="lf-detail-content">
        <section class="lf-detail-main">
          <template v-if="isNew || isDelivering">
            <div class="lf-form-card relative-position">
              <q-inner-loading :showing="scanningImage" class="lf-scanning-overlay">
                <q-spinner-dots size="50px" color="primary" />
                <div class="lf-scanning-text">Analizando objeto...</div>
              </q-inner-loading>
              <div class="lf-section-title">Información General</div>
              
              <div class="lf-field-group">
                <label class="lf-label">Nombre del objeto *</label>
                <q-input
                  v-model="form.item_name"
                  outlined
                  dense
                  placeholder="Ej: Billetera café, iPhone 13..."
                  class="lf-input"
                  :rules="[val => !!val && val.trim().length > 0 || 'Campo obligatorio']"
                  lazy-rules
                  :readonly="isDelivering || scanningImage"
                />
              </div>

              <div class="lf-field-group">
                <label class="lf-label">Descripción física</label>
                <q-input
                  v-model="form.description"
                  type="textarea"
                  outlined
                  dense
                  autogrow
                  class="lf-input"
                  placeholder="Color, marca, detalles distintivos..."
                  :readonly="isDelivering || scanningImage"
                />
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <div class="lf-field-group">
                    <label class="lf-label">Ubicación</label>
                    <q-input
                      v-model="form.found_location"
                      outlined
                      dense
                      class="lf-input"
                      placeholder="Lugar del hallazgo"
                      :readonly="isDelivering"
                    >
                      <template v-slot:prepend><q-icon name="place" size="xs" /></template>
                    </q-input>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="lf-field-group">
                    <label class="lf-label">Número de boleta</label>
                    <q-input
                      v-model="form.boleta_numero"
                      outlined
                      dense
                      class="lf-input"
                      placeholder="Identificador físico"
                      :readonly="isDelivering"
                    >
                      <template v-slot:prepend><q-icon name="confirmation_number" size="xs" /></template>
                    </q-input>
                  </div>
                </div>
              </div>

              <div class="lf-field-group">
                <label class="lf-label">Encontrado por</label>
                <q-input
                  v-model="form.encontrado_por"
                  outlined
                  dense
                  class="lf-input"
                  placeholder="Nombre de la persona"
                  :readonly="isDelivering"
                >
                  <template v-slot:prepend><q-icon name="person" size="xs" /></template>
                </q-input>
              </div>

              <!-- delivery fields -->
              <template v-if="isDelivering">
                <div class="lf-delivery-section q-mt-lg">
                  <div class="lf-section-title">Detalles de Entrega</div>
                  
                  <div class="lf-field-group">
                    <label class="lf-label">Estado final</label>
                    <q-select
                      v-model="form.status"
                      :options="statusOptions"
                      outlined
                      dense
                      class="lf-input"
                      emit-value
                      map-options
                    />
                  </div>

                  <div v-if="form.status === 'Entregado'" class="lf-claimant-info">
                    <div class="lf-field-group">
                      <label class="lf-label">Reclamado por (Nombre completo)</label>
                      <q-input
                        v-model="form.claimant_name"
                        outlined
                        dense
                        class="lf-input"
                        placeholder="Quien recibe el objeto"
                      />
                    </div>
                    <div class="lf-field-group">
                      <label class="lf-label">Notas de entrega</label>
                      <q-input
                        v-model="form.notas"
                        type="textarea"
                        outlined
                        dense
                        autogrow
                        class="lf-input"
                        placeholder="Observaciones de la devolución..."
                      />
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>

          <!-- View Mode -->
          <template v-else>
            <div class="lf-info-grid">
              <div class="lf-details-card">
                <div class="lf-section-title">Especificaciones</div>
                
                <div class="lf-fact-item">
                  <span class="lf-fact-label">Descripción</span>
                  <p class="lf-fact-value">{{ form.description || 'Sin descripción detallada.' }}</p>
                </div>

                <div class="lf-fact-row">
                  <div class="lf-fact-item">
                    <span class="lf-fact-label">Ubicación</span>
                    <div class="lf-fact-value">
                      <q-icon name="place" size="14px" class="q-mr-xs" />
                      {{ form.found_location || 'No especificada' }}
                    </div>
                  </div>
                  <div class="lf-fact-item">
                    <span class="lf-fact-label">Boleta #</span>
                    <div class="lf-fact-value">
                      <q-icon name="confirmation_number" size="14px" class="q-mr-xs" />
                      {{ form.boleta_numero || 'Sin número' }}
                    </div>
                  </div>
                </div>

                <div class="lf-fact-item">
                  <span class="lf-fact-label">Encontrado por</span>
                  <div class="lf-fact-value">
                    <q-icon name="person_pin" size="14px" class="q-mr-xs" />
                    {{ form.encontrado_por || 'No reportado' }}
                  </div>
                </div>
              </div>

              <div class="lf-trazability-card">
                <div class="lf-section-title">Trazabilidad</div>
                
                <div class="lf-timeline">
                  <div class="lf-timeline-item">
                    <div class="lf-timeline-point"></div>
                    <div class="lf-timeline-content">
                      <div class="lf-timeline-label">Ingreso al sistema</div>
                      <div class="lf-timeline-value">{{ formatDateTime(foundAt) }}</div>
                      <div class="lf-timeline-meta">Recibido por: <strong>{{ usuario_recibe || 'N/A' }}</strong></div>
                    </div>
                  </div>

                  <div v-if="form.status !== 'Almacenado'" class="lf-timeline-item">
                    <div class="lf-timeline-point lf-timeline-point--active"></div>
                    <div class="lf-timeline-content">
                      <div class="lf-timeline-label">{{ form.status === 'Entregado' ? 'Devolución confirmada' : 'Objeto descartado' }}</div>
                      <div class="lf-timeline-value">{{ formatDateTime(deliveredAt) }}</div>
                      <div v-if="form.claimant_name" class="lf-timeline-meta">Entregado a: <strong>{{ form.claimant_name }}</strong></div>
                      <div v-if="usuario_entrega" class="lf-timeline-meta">Oficial: <strong>{{ usuario_entrega }}</strong></div>
                    </div>
                  </div>
                </div>

                <div v-if="form.notas" class="lf-notes-block">
                  <div class="lf-fact-label">Notas de cierre</div>
                  <p class="lf-notes-text">{{ form.notas }}</p>
                </div>
              </div>
            </div>
          </template>
        </section>

        <!-- Sidebar Actions & Media -->
        <aside class="lf-detail-sidebar">
          <div class="lf-media-card">
            <div class="lf-section-title q-mb-md">Foto del objeto</div>
            
            <div v-if="existingImageUrl && !newPhoto" class="lf-photo-viewer" @click="openImageViewer(existingImageUrl)">
              <q-img
                :src="getCloudinaryUrl(existingImageUrl, 'w_1000,h_1000,c_fit,q_auto')"
                class="lf-photo-display"
                spinner-color="dark"
              />
              <div class="lf-photo-overlay">
                <q-icon name="zoom_in" size="24px" />
              </div>
            </div>

            <div v-if="isNew" class="lf-photo-uploader">
              <div v-if="newPhoto" class="lf-photo-preview">
                <q-img :src="newPhoto.preview" ratio="1" class="lf-preview-img" />
                <q-btn round flat dense icon="close" size="sm" class="lf-remove-img" @click="removeNewPhoto" />
              </div>
              <div v-else class="lf-upload-zone" @click="triggerFileInput">
                <q-icon name="add_a_photo" size="32px" color="dark" />
                <div class="text-caption text-weight-bold">Añadir evidencia</div>
              </div>
            </div>
          </div>

          <div class="lf-actions-card">
            <q-btn
              v-if="isNew || isDelivering"
              no-caps
              unelevated
              class="lf-uber-btn lf-uber-btn--primary full-width"
              :label="isNew ? 'Registrar hallazgo' : 'Confirmar entrega'"
              :loading="saving"
              :disable="!formValid || (isDelivering && form.status !== 'Entregado' && form.status !== 'Desechado')"
              @click="saveItem"
            />
            <q-btn
              v-if="!isNew && !isDelivering && form.status === 'Almacenado'"
              no-caps
              unelevated
              class="lf-uber-btn lf-uber-btn--warning full-width"
              label="Procesar entrega"
              @click="startDelivery"
            />
            <q-btn
              v-if="isDelivering"
              no-caps
              flat
              class="lf-uber-btn lf-uber-btn--flat full-width q-mt-sm"
              label="Cancelar proceso"
              @click="isDelivering = false"
            />
          </div>
        </aside>
      </div>

      <!-- Image Viewer -->
      <q-dialog v-model="viewerOpen" maximized transition-show="fade" transition-hide="fade">
        <q-card class="bg-black" style="min-height:100vh;position:relative">
          <q-btn flat round icon="close" color="white" class="absolute-top-right q-ma-md" style="z-index:10" @click="viewerOpen = false" />
          <div class="fullscreen flex flex-center">
            <img :src="viewerUrl" class="lf-full-image" />
          </div>
        </q-card>
      </q-dialog>

      <q-dialog v-model="imageSourceDialog" position="bottom">
        <q-card class="lf-bottom-sheet">
          <q-card-section class="q-pb-none">
            <div class="text-subtitle1 text-weight-bold">Subir evidencia</div>
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div class="column q-gutter-y-sm">
              <q-btn unelevated class="lf-sheet-btn" icon="photo_camera" label="Cámara" no-caps @click="pickImageSource('camera')" />
              <q-btn unelevated class="lf-sheet-btn" icon="photo_library" label="Galería" no-caps @click="pickImageSource('gallery')" />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <input v-if="isNew" ref="fileInputCamera" type="file" accept="image/*" capture="environment" style="display:none" @change="onFileSelected" />
      <input v-if="isNew" ref="fileInputGallery" type="file" accept="image/*" style="display:none" @change="onFileSelected" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import { useQuasar } from 'quasar'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default defineComponent({
  name: 'LostFoundDetailPage',
  setup () {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const $q = useQuasar()

    const itemId = computed(() => route.params.id)
    const isNew = computed(() => !itemId.value || itemId.value === 'nuevo')
    const isDelivering = ref(false)

    const loadingData = ref(false)
    const saving = ref(false)
    const fileInputCamera = ref(null)
    const fileInputGallery = ref(null)
    const newPhoto = ref(null)
    const existingImageUrl = ref('')
    const viewerOpen = ref(false)
    const viewerUrl = ref('')
    const imageSourceDialog = ref(false)
    const usuario_recibe = ref('')
    const usuario_entrega = ref('')
    const foundAt = ref('')
    const deliveredAt = ref('')
    const scanningImage = ref(false)

    const statusOptions = ['Almacenado', 'Entregado', 'Desechado']

    const getStatusTone = (status) => {
      const map = { 'Almacenado': 'stored', 'Entregado': 'delivered', 'Desechado': 'discarded' }
      return map[status] || 'neutral'
    }

    const form = ref({
      item_name: '',
      description: '',
      found_location: '',
      encontrado_por: '',
      boleta_numero: '',
      status: 'Almacenado',
      claimant_name: '',
      claimant_id: '',
      notas: ''
    })

    const getLocalISO = () => {
      const now = new Date()
      // Create offset-corrected date string manually for "local time without timezone"
      // format: YYYY-MM-DDTHH:mm:ss
      const pad = (n) => n.toString().padStart(2, '0')
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }

    const getStatusColor = (status) => {
      if (status === 'Almacenado') return 'blue'
      if (status === 'Entregado') return 'positive'
      return 'grey-7'
    }

    const formatDateTime = (value) => {
      if (!value) return ''
      const normalizedValue = value.includes('T') ? value : value.replace(' ', 'T')
      const date = new Date(normalizedValue)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString('es-CR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const startDelivery = () => {
      isDelivering.value = true
      form.value.status = 'Entregado'
    }

    const formValid = computed(() => {
      if (isDelivering.value && form.value.status === 'Entregado') {
        return form.value.claimant_name && form.value.claimant_name.trim().length > 0
      }
      return form.value.item_name && form.value.item_name.trim().length > 0
    })

    const goBack = () => {
      router.push('/seguridad/objetos-perdidos')
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
      try {
        const compressed = await compressImage(file)
        const preview = URL.createObjectURL(compressed)
        newPhoto.value = { file: compressed, preview }
        scanImageForDescription(compressed)
      } catch {
        const preview = URL.createObjectURL(file)
        newPhoto.value = { file, preview }
        scanImageForDescription(file)
      }
      if (fileInputCamera.value) fileInputCamera.value.value = ''
      if (fileInputGallery.value) fileInputGallery.value.value = ''
    }

    const fileToGenerativePart = async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({
            inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
          })
        }
        reader.readAsDataURL(file)
      })
    }

    const scanImageForDescription = async (fileToScan) => {
      scanningImage.value = true
      $q.notify({ type: 'info', message: 'Identificando objeto...', timeout: 2000 })
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('API Key no encontrada')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' })

        const imagePart = await fileToGenerativePart(fileToScan)
        const prompt = `
          Analiza esta imagen y describe el objeto de forma ultra-resumida.
          Solo indica qué es, el color principal y un detalle esencial (marca o estado).
          
          Ejemplo: "Samsung Galaxy negro, pantalla quebrada", "Billetera de cuero café, marca Fossil".

          Devuelve estrictamente un JSON:
          {
            "item_name": "Nombre corto",
            "description": "Máximo 15 palabras con lo esencial"
          }
          
          Solo devuelve el JSON, sin texto adicional ni backticks.
        `
        const result = await model.generateContent([prompt, imagePart])
        const text = result.response.text()
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        
        const extracted = JSON.parse(cleanJson)
        if (extracted.item_name) {
          form.value.item_name = extracted.item_name
        }
        if (extracted.description) {
          form.value.description = extracted.description
        }
        $q.notify({ type: 'positive', message: 'Objeto identificado' })
      } catch (error) {
        console.error('Scan Error:', error)
        $q.notify({ type: 'warning', message: 'No se pudo identificar el objeto', timeout: 3000 })
      } finally {
        scanningImage.value = false
      }
    }

    function removeNewPhoto () {
      if (newPhoto.value?.preview) URL.revokeObjectURL(newPhoto.value.preview)
      newPhoto.value = null
    }

    function openImageViewer (url) {
      viewerUrl.value = getCloudinaryUrl(url, 'w_1600,q_auto')
      viewerOpen.value = true
    }

    async function uploadToCloudinary (file) {
      const timestamp = Date.now()
      const publicId = `lost_found_${timestamp}`
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

    // Fetch existing item
    const fetchItem = async () => {
      if (isNew.value) return
      loadingData.value = true
      try {
        const { data, error } = await supabase
          .from('lost_found')
          .select('*')
          .eq('id', itemId.value)
          .single()
        if (error) throw error
        if (data) {
          form.value.item_name = data.item_name
          form.value.description = data.description || ''
          form.value.found_location = data.found_location || ''
          form.value.encontrado_por = data.encontrado_por || ''
          form.value.boleta_numero = data['#_boleta'] || ''
          form.value.status = data.status
          form.value.notas = data.notas || ''
          existingImageUrl.value = data.image_url || ''
          usuario_recibe.value = data.usuario_recibe || ''
          usuario_entrega.value = data.usuario_entrega || ''
          foundAt.value = data.found_at || ''
          deliveredAt.value = data.fecha_entregado || ''
          if (data.reclamante_info) {
            form.value.claimant_name = data.reclamante_info || ''
          }
        }
      } catch (err) {
        console.error('Error fetching item:', err)
        $q.notify({ type: 'negative', message: 'Error al cargar el objeto' })
      } finally {
        loadingData.value = false
      }
    }

    const saveItem = async () => {
      if (!formValid.value) return
      saving.value = true
      try {
        const currentUser = authStore.user?.Usuario || 'Anónimo'
        const localTime = getLocalISO()

        // Upload photo if new
        let imageUrl = existingImageUrl.value
        if (newPhoto.value) {
          imageUrl = await uploadToCloudinary(newPhoto.value.file)
        }

        if (isNew.value) {
          const record = {
            item_name: form.value.item_name.trim(),
            description: form.value.description?.trim() || null,
            found_at: localTime,
            found_location: form.value.found_location?.trim() || null,
            encontrado_por: form.value.encontrado_por?.trim() || null,
            '#_boleta': form.value.boleta_numero?.trim() || null,
            status: 'Almacenado',
            image_url: imageUrl || null,
            usuario_recibe: currentUser
          }
          const { error } = await supabase.from('lost_found').insert(record)
          if (error) throw error
          $q.notify({ type: 'positive', message: 'Objeto registrado', icon: 'check_circle' })
        } else {
          // Delivery mode updates
          const updates = {
            status: form.value.status,
            reclamante_info: form.value.status === 'Entregado' ? form.value.claimant_name : null,
            usuario_entrega: form.value.status === 'Entregado' ? currentUser : null,
            fecha_entregado: form.value.status === 'Entregado' ? localTime : null,
            notas: form.value.notas?.trim() || null
          }
          const { error } = await supabase
            .from('lost_found')
            .update(updates)
            .eq('id', itemId.value)
          if (error) throw error
          $q.notify({ type: 'positive', message: 'Objeto actualizado', icon: 'check_circle' })
        }
        router.push('/seguridad/objetos-perdidos')
      } catch (err) {
        console.error('Error saving item:', err)
        $q.notify({ type: 'negative', message: 'Error al guardar', caption: err.message })
      } finally {
        saving.value = false
      }
    }

    onMounted(fetchItem)

    return {
      router,
      isNew,
      loadingData,
      saving,
      scanningImage,
      form,
      formValid,
      statusOptions,
      newPhoto,
      existingImageUrl,
      fileInputCamera,
      fileInputGallery,
      viewerOpen,
      viewerUrl,
      imageSourceDialog,
      usuario_recibe,
      usuario_entrega,
      foundAt,
      deliveredAt,
      isDelivering,
      goBack,
      triggerFileInput,
      pickImageSource,
      onFileSelected,
      removeNewPhoto,
      openImageViewer,
      getCloudinaryUrl,
        getStatusTone,
      getStatusColor,
      formatDateTime,
      startDelivery,
      saveItem
    }
  }
})
</script>

<style scoped>
.lf-detail-page {
  background: #FFFFFF;
  min-height: 100vh;
  padding: 0;
  font-family: 'Manrope', sans-serif;
  color: #000000;
}

.lf-uber-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

/* Header */
.lf-detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 48px;
}

.lf-back-btn {
  background: #F3F3F3;
  color: #000000;
  transition: background 0.2s;
}
.lf-back-btn:hover { background: #EEEEEE; }

.lf-kicker {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  color: #666;
  margin-bottom: 4px;
}

.lf-detail-title {
  font-family: 'Archivo', sans-serif;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -0.5px;
}

.lf-status-badge {
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}
.lf-status-badge--stored { background: #E6F0FF; color: #0066FF; }
.lf-status-badge--delivered { background: #E6FFF2; color: #00CC66; }
.lf-status-badge--discarded { background: #F3F3F3; color: #666666; }

/* Grid Layout */
.lf-detail-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
}

/* Cards & Sections */
.lf-form-card, .lf-details-card, .lf-trazability-card, .lf-media-card, .lf-actions-card {
  background: #FFFFFF;
  border: 1px solid #EEEEEE;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
}

.lf-section-title {
  font-family: 'Archivo', sans-serif;
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 24px;
  color: #000000;
}

/* Forms */
.lf-field-group { margin-bottom: 24px; }
.lf-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #666;
}

.lf-input :deep(.q-field__inner) { background: #F6F6F6; border-radius: 8px; }
.lf-input :deep(.q-field__control) { border: none !important; }
.lf-input :deep(.q-field__control:before) { border: none !important; }

/* View Mode Details */
.lf-fact-item { margin-bottom: 24px; }
.lf-fact-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #999; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
.lf-fact-value { font-size: 16px; font-weight: 500; margin: 0; color: #000; }
.lf-fact-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* Timeline */
.lf-timeline { position: relative; padding-left: 24px; }
.lf-timeline::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #EEEEEE;
}

.lf-timeline-item { position: relative; margin-bottom: 32px; }
.lf-timeline-point {
  position: absolute;
  left: -24px;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #DDD;
  border: 2px solid #FFF;
  box-shadow: 0 0 0 2px #EEE;
  z-index: 1;
}
.lf-timeline-point--active { background: #000; box-shadow: 0 0 0 2px #000; }

.lf-timeline-label { font-size: 13px; font-weight: 800; margin-bottom: 2px; }
.lf-timeline-value { font-size: 14px; color: #666; margin-bottom: 4px; }
.lf-timeline-meta { font-size: 12px; color: #999; }

/* Media */
.lf-photo-viewer { 
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.lf-scanning-overlay {
  background: rgba(255, 255, 255, 0.7);
  z-index: 10;
  border-radius: 20px;
}

.lf-scanning-text {
  margin-top: 10px;
  font-weight: 800;
  color: #000;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 1px;
}

.lf-photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #FFF;
}
.lf-photo-viewer:hover .lf-photo-overlay { opacity: 1; }

.lf-upload-zone {
  border: 2px dashed #EEE;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.lf-upload-zone:hover { border-color: #000; background: #F9F9F9; }

.lf-preview-img { border-radius: 12px; }
.lf-remove-img { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: white; }

/* Buttons */
.lf-uber-btn {
  height: 54px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
}
.lf-uber-btn--primary { background: #000000; color: #FFFFFF; }
.lf-uber-btn--warning { background: #000000; color: #FFFFFF; }
.lf-uber-btn--flat { color: #666; }

.lf-bottom-sheet { border-radius: 24px 24px 0 0; }
.lf-sheet-btn {
  height: 60px;
  justify-content: flex-start;
  font-weight: 700;
  background: #F3F3F3;
  border-radius: 12px;
  margin-bottom: 8px;
}

.lf-full-image { max-width: 90vw; max-height: 90vh; border-radius: 8px; }

/* Mobile */
@media (max-width: 900px) {
  .lf-uber-container { padding: 24px 16px; }
  .lf-detail-content { grid-template-columns: 1fr; gap: 0; }
  .lf-detail-header { margin-bottom: 32px; }
  .lf-detail-title { font-size: 28px; }
  .lf-detail-sidebar { order: -1; }
  .lf-media-card { padding: 20px; border-bottom: none; border-radius: 20px 20px 0 0; }
  .lf-form-card, .lf-details-card, .lf-trazability-card { padding: 24px; border-top: none; border-radius: 0 0 20px 20px; }
}
</style>
