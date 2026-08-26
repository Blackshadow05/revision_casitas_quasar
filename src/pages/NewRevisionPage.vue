<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" color="grey-8" @click="goBack" />
      <div class="text-h5 q-ml-sm">Nueva Revisión</div>
    </div>

    <q-form @submit="onSubmit" class="q-gutter-y-lg">
      <!-- Casita and Quien Revisa -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6" data-field="casita">
          <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors.casita }">Casita <span class="required-asterisk">*</span></div>
          <q-select
            v-model="form.casita"
            :options="casitaOptions"
            outlined
            dense
            bg-color="white"
            class="input-styled"
            :class="{ 'error-field': validationErrors.casita }"
            behavior="menu"
          />
        </div>
        <div class="col-12 col-sm-6" data-field="quien_revisa">
          <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors.quien_revisa }">Quién Revisa <span class="required-asterisk">*</span></div>
          <q-input
            v-if="revisorFijo"
            v-model="form.quien_revisa"
            readonly
            outlined
            dense
            bg-color="grey-3"
            class="input-styled"
          />
          <q-select
            v-else
            v-model="form.quien_revisa"
            :options="users"
            emit-value
            map-options
            placeholder="Seleccionar revisor"
            outlined
            dense
            bg-color="white"
            class="input-styled"
            :class="{ 'error-field': validationErrors.quien_revisa }"
            behavior="menu"
          />
        </div>
      </div>

      <!-- Caja fuerte -->
      <div class="section-container" :class="{ 'error-section': validationErrors.caja_fuerte }" data-field="caja_fuerte">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.caja_fuerte }">
          <q-icon name="lock" color="grey-7" class="q-mr-sm" size="20px" />
          Caja fuerte <span class="required-asterisk">*</span>
        </div>
        <div class="button-grid">
          <q-btn
            v-for="option in cajaFuerteOptions"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            :class="{ selected: form.caja_fuerte === option }"
            @click="form.caja_fuerte = option"
          />
        </div>
      </div>

      <!-- Movimiento de casita -->
      <div v-if="form.caja_fuerte === 'Room Move'" class="section-container">
        <div class="section-label q-mb-xs">Movimiento de casita</div>
        <q-input
          v-model="form.room_move"
          placeholder="Ingrese detalle del movimiento"
          outlined
          dense
          bg-color="white"
          class="input-styled"
        />
      </div>

      <!-- Puertas y ventanas -->
      <div class="section-container" :class="{ 'error-section': validationErrors.puertas_ventanas }" data-field="puertas_ventanas">
        <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors.puertas_ventanas }">
          <q-icon name="meeting_room" color="grey-7" class="q-mr-sm" size="20px" />
          Puertas y Ventanas <span class="required-asterisk">*</span>
        </div>
        <q-input
          v-model="form.puertas_ventanas"
          placeholder="Ingrese puertas y ventanas"
          outlined
          dense
          bg-color="white"
          class="input-styled"
          :class="{ 'error-field': validationErrors.puertas_ventanas }"
        />
      </div>

      <!-- Fecha Ingreso de la casita (solo Check in / Back to Back) -->
      <div
        v-if="needsFechaIngreso"
        class="section-container"
        :class="{ 'error-section': validationErrors.fecha_ingreso_casita }"
        data-field="fecha_ingreso_casita"
      >
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.fecha_ingreso_casita }">
          <q-icon name="event" color="grey-7" class="q-mr-sm" size="20px" />
          Fecha Ingreso de la casita <span class="required-asterisk">*</span>
        </div>
        <div class="button-grid">
          <q-btn
            v-for="option in fechaIngresoCasitaOptions"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            :class="{ selected: form.fecha_ingreso_casita_selection === option }"
            @click="selectFechaIngresoCasita(option)"
          />
        </div>
        <div v-if="form.fecha_ingreso_casita" class="q-mt-sm text-caption text-grey-7">
          <q-icon name="calendar_today" size="14px" class="q-mr-xs" />
          Fecha guardada: {{ form.fecha_ingreso_casita }}
        </div>
      </div>

      <!-- Inventario -->
      <template v-for="(block, index) in formSections" :key="index">
        <div v-if="block.type === 'header'" class="category-header" :class="block.headerClass">
          <q-icon :name="block.icon" />
          <span class="category-title">{{ block.title }}</span>
        </div>

        <div
          v-else-if="block.type === 'section'"
          class="section-container"
          :class="{ 'error-section': validationErrors[block.field] }"
          :data-field="block.field"
        >
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors[block.field] }">
            <q-icon v-if="block.icon" :name="block.icon" color="grey-7" class="q-mr-sm" size="20px" />
            {{ block.label }} <span class="required-asterisk">*</span>
          </div>
          <div class="button-grid">
            <q-btn
              v-for="option in block.options"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :style="block.minWidth ? { minWidth: block.minWidth } : null"
              :class="{ selected: form[block.field] === option }"
              @click="form[block.field] = option"
            />
          </div>
        </div>

        <div v-else class="row q-col-gutter-md" :class="{ 'error-row': rowHasError(block) }">
          <div
            v-for="item in block.fields"
            :key="item.field"
            class="col-12 col-sm-6"
            :data-field="item.field"
          >
            <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors[item.field] }">
              {{ item.label }} <span class="required-asterisk">*</span>
            </div>
            <div class="button-grid">
              <q-btn
                v-for="option in item.options"
                :key="option"
                :label="option"
                unelevated
                class="custom-select-btn option-btn"
                :style="item.minWidth ? { minWidth: item.minWidth } : null"
                :class="{ selected: form[item.field] === option }"
                @click="form[item.field] = option"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Evidencias -->
      <div v-if="showEvidencias">
        <div class="category-header category-header--evidence">
          <q-icon name="photo_camera" />
          <span class="category-title">Evidencia Fotográfica</span>
          <q-badge v-if="evidencia1Required" color="primary" class="q-ml-sm" style="font-size: 0.8rem;">Evidencia 1 obligatoria</q-badge>
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="ev in visibleEvidencias"
            :key="ev.field"
            class="col-12 col-sm-4"
            :data-field="ev.field"
          >
            <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors[ev.field] }">
              {{ ev.label }} <span v-if="ev.required" class="required-asterisk">*</span>
            </div>

            <q-btn
              v-if="!form[ev.field]"
              label="Agregar Foto"
              icon="add_a_photo"
              unelevated
              class="full-width photo-btn"
              :class="{ 'error-photo': validationErrors[ev.field] }"
              :disable="ev.disabled"
              @click="openPhotoSheet(ev.field)"
            />
            <div v-else>
              <div class="photo-preview-container">
                <q-inner-loading :showing="compressing[ev.field]" class="photo-preview-loading">
                  <q-spinner size="32px" color="primary" />
                </q-inner-loading>
                <img
                  :src="previewUrls[ev.field]"
                  class="photo-preview"
                  @click="openImageModal(previewUrls[ev.field])"
                />
                <q-btn
                  icon="delete"
                  round
                  size="sm"
                  color="negative"
                  class="delete-photo-btn"
                  @click="removePhoto(ev.field)"
                />
              </div>
              <div v-if="compressionInfo[ev.field]" class="compression-info">
                <div class="compression-row">
                  <span class="text-grey-7">-</span>
                  <span class="text-negative">{{ compressionInfo[ev.field].originalSize }}</span>
                  <q-icon name="arrow_forward" size="12px" color="grey-5" />
                  <span class="text-positive">{{ compressionInfo[ev.field].compressedSize }}</span>
                  <span class="text-primary">({{ compressionInfo[ev.field].reduction }}%)</span>
                </div>
                <div class="compression-row">
                  <span class="text-grey-7">-</span>
                  <span class="text-body2">{{ compressionInfo[ev.field].format }}</span>
                  <span class="text-grey-5 q-ml-xs">{{ compressionInfo[ev.field].originalDimensions }} → {{ compressionInfo[ev.field].compressedDimensions }}</span>
                </div>
              </div>
            </div>

            <q-file
              :ref="(el) => setFileRef(ev.field, el)"
              v-model="form[ev.field]"
              label=""
              outlined
              dense
              bg-color="white"
              class="input-styled q-mt-xs"
              accept="image/*"
              style="display: none;"
            />
          </div>
        </div>
      </div>

      <!-- Notas -->
      <div class="section-container">
        <div class="section-label q-mb-xs">Notas y observaciones adicionales</div>
        <q-input
          v-model="form.notas"
          type="textarea"
          placeholder="Escriba aquí sus observaciones..."
          outlined
          dense
          bg-color="white"
          class="input-styled"
          rows="3"
        />
      </div>

      <!-- Submit Button -->
      <div class="q-mt-xl q-pb-xl">
        <q-btn
          label="Guardar Revisión"
          type="submit"
          class="full-width submit-btn"
          unelevated
          :loading="loading"
        />
        <div v-if="missingFieldsCount > 0" class="text-center q-mt-sm text-negative" style="font-size: 0.85rem;">
          <q-icon name="info_outline" size="16px" class="q-mr-xs" />
          {{ missingFieldsCount }} campo{{ missingFieldsCount > 1 ? 's' : '' }} obligatorio{{ missingFieldsCount > 1 ? 's' : '' }} pendiente{{ missingFieldsCount > 1 ? 's' : '' }}
        </div>
      </div>
    </q-form>

  <!-- Bottom Sheet for Photo Selection -->
  <q-dialog v-model="photoSheetOpen" position="bottom">
    <q-card class="photo-bottom-sheet">
      <div class="photo-sheet-header">
        <div class="photo-sheet-title">Agregar foto</div>
        <q-btn
          icon="close"
          flat
          round
          dense
          class="photo-sheet-close"
          aria-label="Cerrar"
          @click="photoSheetOpen = false"
        />
      </div>
      <q-card-section class="photo-options-container">
        <div class="photo-option" @click="selectPhotoSource('camera')">
          <q-icon name="photo_camera" size="28px" color="primary" />
          <div class="photo-option-label">Cámara</div>
          <div class="photo-option-subtitle">Tomar foto ahora</div>
        </div>
        <div class="photo-option" @click="selectPhotoSource('gallery')">
          <q-icon name="photo_library" size="28px" color="primary" />
          <div class="photo-option-label">Galería</div>
          <div class="photo-option-subtitle">Elegir de la galería</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Image Viewer Modal -->
  <q-dialog v-model="imageModalOpen" maximized>
    <q-card class="image-modal-card">
      <q-btn
        icon="close"
        flat
        round
        class="image-modal-close"
        @click="imageModalOpen = false"
      />
      <q-card-section class="image-modal-content">
        <img :src="modalImageUrl" class="full-size-image" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Share Modal -->
  <q-dialog v-model="showShareModal" persistent>
    <q-card class="share-modal-card">
      <q-card-section class="share-modal-header">
        <div class="text-h6">Compartir Evidencias</div>
        <q-btn icon="close" flat round dense @click="closeShareModal" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body1 q-mb-md">
          La revisión ha sido guardada. ¿Deseas compartir las imágenes de evidencia?
        </div>

        <div class="share-evidence-grid">
          <div
            v-for="(url, field) in shareEvidenciaUrls"
            :key="field"
            class="share-evidence-item"
          >
            <div class="share-evidence-label">{{ evidenciaLabels[field] }}</div>
            <img :src="url" class="share-evidence-image" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="share-modal-actions" vertical>
        <q-btn
          v-if="shareSupported"
          class="share-btn share-btn-native"
          unelevated
          label="Compartir imágenes"
          icon="share"
          @click="shareViaWebShare"
        />
        <q-btn
          class="share-btn share-btn-cancel"
          flat
          label="Cerrar"
          @click="closeShareModal"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import { playSound } from '../utils/sounds'
import { notify } from '../utils/notify'

const STORAGE_KEY = 'new_revision_form'
const STORAGE_INFO_KEY = 'new_revision_compression_info'
const DRAFT_SAVE_DELAY = 500

const UPLOAD_TIMEOUT_MS = 30000
const UPLOAD_RETRIES = 1
const UPLOAD_RETRY_DELAY_MS = 1200

let deleteTokenWarned = false

const EVIDENCIA_FIELDS = ['evidencia_01', 'evidencia_02', 'evidencia_03']

const EVIDENCIA_LABELS = {
  evidencia_01: 'Evidencia 1',
  evidencia_02: 'Evidencia 2',
  evidencia_03: 'Evidencia 3'
}

const CON_EVIDENCIAS = ['Check in', 'Upsell', 'Back to Back', 'Check out', 'Guardar Upsell', 'Room Move', 'Show Room']
const EVIDENCIA_OBLIGATORIA = ['Check in', 'Upsell', 'Check out', 'Guardar Upsell']
const SOLO_UNA_EVIDENCIA = ['Check out', 'Guardar Upsell']
const CON_FECHA_INGRESO = ['Check in', 'Back to Back']

const SI_NO = ['Si', 'No']
const CANTIDAD_4 = ['0', '01', '02', '03']

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
}

const FORM_SECTIONS = [
  { type: 'header', title: 'Electrónicos', icon: 'devices' },
  { type: 'section', field: 'chromecast', label: 'Chromecast', options: ['0', '01', '02', '03', '04'], minWidth: '50px' },
  { type: 'section', field: 'speaker', label: 'Speaker', options: CANTIDAD_4 },
  { type: 'section', field: 'usb_speaker', label: 'USB Speaker', options: CANTIDAD_4 },
  { type: 'section', field: 'controles_tv', label: 'Controles TV', options: CANTIDAD_4 },
  { type: 'header', title: 'Otros Artículos', icon: 'category', headerClass: 'category-header--otros' },
  { type: 'section', field: 'binoculares', label: 'Binoculares', icon: 'visibility', options: CANTIDAD_4 },
  {
    type: 'row',
    fields: [
      { field: 'trapo_binoculares', label: 'Trapo para binoculares', options: SI_NO }
    ]
  },
  {
    type: 'row',
    fields: [
      { field: 'secadora', label: 'Secadora', options: CANTIDAD_4 },
      { field: 'accesorios_secadora', label: 'Accesorios Secadora', options: ['0', '01', '02', '03', '04', '05', '06', '07', '08'], minWidth: '45px' }
    ]
  },
  {
    type: 'row',
    fields: [
      { field: 'steamer', label: 'Steamer', options: CANTIDAD_4 },
      { field: 'bolsa_vapor', label: 'Bolsa Vapor', options: SI_NO }
    ]
  },
  {
    type: 'row',
    fields: [
      { field: 'plancha_cabello', label: 'Plancha Cabello', options: ['0', '01', '02'] },
      { field: 'cola_caballo', label: 'Cola Caballo', options: SI_NO }
    ]
  },
  {
    type: 'row',
    fields: [
      { field: 'bulto', label: 'Bulto', options: SI_NO },
      { field: 'sombrero', label: 'Sombrero', options: SI_NO }
    ]
  },
  {
    type: 'row',
    fields: [
      { field: 'bolso_yute', label: 'Bolso Yute', options: CANTIDAD_4 },
      { field: 'camas_ordenadas', label: 'Camas Ordenadas', options: SI_NO }
    ]
  }
]

const OPTION_FIELDS = FORM_SECTIONS.flatMap((block) => {
  if (block.type === 'section') return [block.field]
  if (block.type === 'row') return block.fields.map((item) => item.field)
  return []
})

const BASE_REQUIRED_FIELDS = ['casita', 'quien_revisa', 'caja_fuerte', 'puertas_ventanas']

const createEmptyForm = () => ({
  casita: '',
  quien_revisa: '',
  caja_fuerte: '',
  room_move: '',
  puertas_ventanas: '',
  fecha_ingreso_casita: '',
  fecha_ingreso_casita_selection: '',
  chromecast: '',
  binoculares: '',
  trapo_binoculares: '',
  speaker: '',
  usb_speaker: '',
  controles_tv: '',
  secadora: '',
  accesorios_secadora: '',
  steamer: '',
  bolsa_vapor: '',
  plancha_cabello: '',
  cola_caballo: '',
  bulto: '',
  sombrero: '',
  bolso_yute: '',
  camas_ordenadas: '',
  evidencia_01: null,
  evidencia_02: null,
  evidencia_03: null,
  notas: ''
})

export default defineComponent({
  name: 'NewRevisionPage',
  setup () {
    const router = useRouter()
    const store = useCasasStore()
    const authStore = useAuthStore()

    const form = ref(createEmptyForm())
    const loading = ref(false)
    const users = ref([])
    const photoSheetOpen = ref(false)
    const formSubmitted = ref(false)
    const currentPhotoField = ref('')
    const lastCaptureSource = ref('')
    const imageModalOpen = ref(false)
    const modalImageUrl = ref('')
    const showShareModal = ref(false)
    const shareEvidenciaUrls = ref({})
    const shareFiles = ref([])
    const previewUrls = ref({ evidencia_01: '', evidencia_02: '', evidencia_03: '' })
    const compressing = ref({ evidencia_01: false, evidencia_02: false, evidencia_03: false })
    const compressionInfo = ref({ evidencia_01: null, evidencia_02: null, evidencia_03: null })

    const fileRefs = {}
    const base64Cache = new WeakMap()
    const uploadStates = {}
    const submitted = ref(false)
    let draftTimer = null
    let draftEnabled = true

    const casitaOptions = Array.from({ length: 50 }, (_, i) => (i + 1).toString())

    const cajaFuerteOptions = [
      'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell',
      'Back to Back', 'Show Room', 'Room Move'
    ]

    const fechaIngresoCasitaOptions = ['Check in de hoy', 'Check in de mañana', 'Ninguna']

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const shareSupported = typeof navigator.share === 'function'

    const revisorFijo = computed(() => {
      return Boolean(authStore.isLoggedIn && authStore.user && authStore.user.Usuario)
    })

    const needsFechaIngreso = computed(() => CON_FECHA_INGRESO.includes(form.value.caja_fuerte))

    const showEvidencias = computed(() => CON_EVIDENCIAS.includes(form.value.caja_fuerte))

    const evidencia1Required = computed(() => EVIDENCIA_OBLIGATORIA.includes(form.value.caja_fuerte))

    const showEvidencia2 = computed(() => {
      if (!showEvidencias.value) return false
      if (SOLO_UNA_EVIDENCIA.includes(form.value.caja_fuerte)) return false
      return !!form.value.evidencia_01
    })

    const showEvidencia3 = computed(() => showEvidencia2.value && !!form.value.evidencia_02)

    const evidenciaSlots = computed(() => [
      {
        field: 'evidencia_01',
        label: EVIDENCIA_LABELS.evidencia_01,
        visible: showEvidencias.value,
        required: evidencia1Required.value,
        disabled: false
      },
      {
        field: 'evidencia_02',
        label: EVIDENCIA_LABELS.evidencia_02,
        visible: showEvidencia2.value,
        required: false,
        disabled: !form.value.evidencia_01
      },
      {
        field: 'evidencia_03',
        label: EVIDENCIA_LABELS.evidencia_03,
        visible: showEvidencia3.value,
        required: false,
        disabled: !form.value.evidencia_02
      }
    ])

    const visibleEvidencias = computed(() => evidenciaSlots.value.filter((slot) => slot.visible))

    const isFieldFilled = (field) => {
      if (field === 'fecha_ingreso_casita') return !!form.value.fecha_ingreso_casita_selection
      const value = form.value[field]
      return typeof value === 'string' ? value.trim() !== '' : !!value
    }

    const requiredFields = computed(() => {
      const fields = [...BASE_REQUIRED_FIELDS]
      if (needsFechaIngreso.value) fields.push('fecha_ingreso_casita')
      fields.push(...OPTION_FIELDS)
      if (evidencia1Required.value) fields.push('evidencia_01')
      return fields
    })

    const missingFields = computed(() => requiredFields.value.filter((field) => !isFieldFilled(field)))

    const missingFieldsCount = computed(() => missingFields.value.length)

    const validationErrors = computed(() => {
      if (formSubmitted.value !== true) return {}
      return missingFields.value.reduce((acc, field) => {
        acc[field] = true
        return acc
      }, {})
    })

    const rowHasError = (block) => block.fields.some((item) => validationErrors.value[item.field] === true)

    const setFileRef = (field, el) => {
      if (el) fileRefs[field] = el
      else delete fileRefs[field]
    }

    const formatDateDDMMYYYY = (date) => {
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const yyyy = date.getFullYear()
      return `${dd}-${mm}-${yyyy}`
    }

    const selectFechaIngresoCasita = (option) => {
      form.value.fecha_ingreso_casita_selection = option
      if (option === 'Check in de hoy') {
        form.value.fecha_ingreso_casita = formatDateDDMMYYYY(new Date())
      } else if (option === 'Check in de mañana') {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        form.value.fecha_ingreso_casita = formatDateDDMMYYYY(tomorrow)
      } else {
        form.value.fecha_ingreso_casita = ''
      }
    }

    const releasePreview = (field) => {
      const url = previewUrls.value[field]
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
      previewUrls.value[field] = ''
    }

    const refreshPreview = (field, file) => {
      releasePreview(field)
      if (!file) return
      previewUrls.value[field] = typeof file === 'string' ? file : URL.createObjectURL(file)
    }

    const helperFileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
      })
    }

    const helperBase64ToFile = async (base64String, filename) => {
      if (!base64String || typeof base64String !== 'string') return null
      try {
        const res = await fetch(base64String)
        const blob = await res.blob()
        const file = new File([blob], filename, { type: blob.type })
        file._isCompressed = true
        base64Cache.set(file, base64String)
        return file
      } catch (e) {
        console.error('[NewRevisionPage] Error convirtiendo base64 a File:', e)
        return null
      }
    }

    // Solo se persisten las imágenes ya comprimidas: una foto de cámara sin
    // comprimir supera por sí sola la cuota de localStorage (5 MB).
    const serializeEvidencia = async (file) => {
      if (!(file instanceof File) || file._isCompressed !== true) return null
      const cached = base64Cache.get(file)
      if (cached) return cached
      const base64 = await helperFileToBase64(file)
      base64Cache.set(file, base64)
      return base64
    }

    const saveFormToStorage = async () => {
      try {
        const dataToSave = { ...form.value }
        for (const field of EVIDENCIA_FIELDS) {
          dataToSave[field] = await serializeEvidencia(form.value[field])
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
        localStorage.setItem(STORAGE_INFO_KEY, JSON.stringify(compressionInfo.value))
      } catch (e) {
        console.warn('[NewRevisionPage] No se pudo guardar el borrador:', e)
      }
    }

    const clearStoredForm = () => {
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_INFO_KEY)
      } catch (e) {
        console.warn('[NewRevisionPage] No se pudo limpiar el borrador:', e)
      }
    }

    const restoreDraft = async () => {
      let parsedForm = null
      try {
        const savedForm = localStorage.getItem(STORAGE_KEY)
        if (!savedForm) return
        parsedForm = JSON.parse(savedForm)
      } catch (e) {
        console.warn('[NewRevisionPage] Borrador corrupto, se descarta:', e)
        clearStoredForm()
        return
      }

      Object.keys(form.value).forEach((key) => {
        if (!EVIDENCIA_FIELDS.includes(key) && parsedForm[key] !== undefined) {
          form.value[key] = parsedForm[key]
        }
      })

      for (const field of EVIDENCIA_FIELDS) {
        const value = parsedForm[field]
        if (typeof value === 'string' && value.startsWith('data:')) {
          form.value[field] = await helperBase64ToFile(value, `${field}.jpg`)
        }
      }

      try {
        const savedInfo = localStorage.getItem(STORAGE_INFO_KEY)
        if (savedInfo) compressionInfo.value = JSON.parse(savedInfo)
      } catch (e) {
        console.warn('[NewRevisionPage] Info de compresión corrupta:', e)
      }
    }

    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('Usuarios')
          .select('Usuario')
          .order('Usuario')

        if (error) {
          console.error('[NewRevisionPage] Error cargando usuarios:', error)
        } else {
          users.value = (data || []).map((user) => ({ label: user.Usuario, value: user.Usuario }))
        }
      } catch (error) {
        console.error('[NewRevisionPage] Error cargando usuarios:', error)
      }

      await restoreDraft()

      if (revisorFijo.value) {
        form.value.quien_revisa = authStore.user.Usuario
      } else if (!form.value.quien_revisa && users.value.length === 1) {
        form.value.quien_revisa = users.value[0].value
      }
    }

    const getCompressionConfig = () => {
      return isIOS ? {
        targetSizeKB: 600,
        maxResolution: 1200,
        maxQuality: 0.85,
        minQuality: 0.50,
        maxAttempts: 10,
        format: 'jpeg'
      } : {
        targetSizeKB: 600,
        maxResolution: 1600,
        maxQuality: 0.75,
        minQuality: 0.50,
        maxAttempts: 10,
        format: 'webp'
      }
    }

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const decodeSafely = async (file, imageElement) => {
      if ('createImageBitmap' in window) {
        try {
          return await createImageBitmap(file)
        } catch (e) {
          console.warn('[Compresión] createImageBitmap falló, se usa <img>', e)
        }
      }
      return imageElement
    }

    const loadImageElement = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })
    }

    const canvasToBlob = (canvas, mime, quality) => {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('No se pudo generar el blob'))
        }, mime, quality)
      })
    }

    const releaseCanvas = (canvas) => {
      canvas.width = 0
      canvas.height = 0
    }

    const compressImage = async (file, field) => {
      const config = getCompressionConfig()
      const originalSize = file.size
      const url = URL.createObjectURL(file)

      let normalizeCanvas = null
      let currentCanvas = null
      let finalCanvas = null

      try {
        const img = await loadImageElement(url)
        if ('decode' in img) {
          try {
            await img.decode()
          } catch (e) {
            console.warn('[Compresión] decode() falló, se continúa igual', e)
          }
        }

        normalizeCanvas = document.createElement('canvas')
        normalizeCanvas.width = img.width
        normalizeCanvas.height = img.height

        const nCtx = normalizeCanvas.getContext('2d', { willReadFrequently: true, alpha: false })
        if (!nCtx) throw new Error('No se pudo obtener el contexto de normalización')

        nCtx.fillStyle = '#FFFFFF'
        nCtx.fillRect(0, 0, normalizeCanvas.width, normalizeCanvas.height)

        const source = await decodeSafely(file, img)
        nCtx.drawImage(source, 0, 0)
        if (source instanceof ImageBitmap) source.close()

        let width = img.width
        let height = img.height
        currentCanvas = normalizeCanvas

        while (width > config.maxResolution * 1.5) {
          const nextWidth = Math.floor(width / 2)
          const nextHeight = Math.floor(height / 2)

          const nextCanvas = document.createElement('canvas')
          nextCanvas.width = nextWidth
          nextCanvas.height = nextHeight

          const nextCtx = nextCanvas.getContext('2d', { alpha: false })
          nextCtx.fillStyle = '#FFFFFF'
          nextCtx.fillRect(0, 0, nextWidth, nextHeight)
          nextCtx.drawImage(currentCanvas, 0, 0, width, height, 0, 0, nextWidth, nextHeight)

          if (currentCanvas !== normalizeCanvas) releaseCanvas(currentCanvas)

          currentCanvas = nextCanvas
          width = nextWidth
          height = nextHeight
        }

        const ratio = Math.min(config.maxResolution / width, config.maxResolution / height, 1)
        const targetW = Math.round(width * ratio)
        const targetH = Math.round(height * ratio)

        finalCanvas = document.createElement('canvas')
        finalCanvas.width = targetW
        finalCanvas.height = targetH

        const finalCtx = finalCanvas.getContext('2d', { alpha: false })
        finalCtx.fillStyle = '#FFFFFF'
        finalCtx.fillRect(0, 0, targetW, targetH)
        finalCtx.drawImage(currentCanvas, 0, 0, width, height, 0, 0, targetW, targetH)

        if (currentCanvas !== normalizeCanvas) releaseCanvas(currentCanvas)
        releaseCanvas(normalizeCanvas)

        const finalMime = `image/${config.format}`
        let quality = config.maxQuality
        let attempts = 0
        let blob = await canvasToBlob(finalCanvas, finalMime, quality)

        while (
          blob.size / 1024 > config.targetSizeKB &&
          attempts < config.maxAttempts &&
          quality > config.minQuality
        ) {
          quality -= 0.05
          attempts++
          blob = await canvasToBlob(finalCanvas, finalMime, quality)
        }

        const finalFile = new File([blob], `normalized.${config.format}`, { type: finalMime })

        compressionInfo.value[field] = {
          originalSize: formatBytes(originalSize),
          compressedSize: formatBytes(finalFile.size),
          reduction: Math.round(((originalSize - finalFile.size) / originalSize) * 100),
          format: config.format.toUpperCase(),
          originalDimensions: `${img.width}x${img.height}`,
          compressedDimensions: `${targetW}x${targetH}`
        }

        return finalFile
      } finally {
        URL.revokeObjectURL(url)
        if (finalCanvas) releaseCanvas(finalCanvas)
      }
    }

    const getMonthFolder = () => {
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      const now = new Date()
      return `${months[now.getMonth()]} ${now.getFullYear()}`
    }

    const uploadOnce = async (file, field, signal) => {
      const monthFolder = getMonthFolder()
      const timestamp = Date.now()
      const n = field.startsWith('evidencia_') ? field.split('_')[1] : field
      const publicId = `evidencia_${n}_${timestamp}`
      const folderPath = `Evidencias/${monthFolder}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
      formData.append('folder', folderPath)
      formData.append('public_id', publicId)

      const timeoutController = new AbortController()
      const timer = setTimeout(() => timeoutController.abort(), UPLOAD_TIMEOUT_MS)
      const forwardAbort = () => timeoutController.abort()
      if (signal) signal.addEventListener('abort', forwardAbort, { once: true })

      try {
        const response = await fetch(CLOUDINARY_CONFIG.uploadUrl(CLOUDINARY_CONFIG.cloudName), {
          method: 'POST',
          body: formData,
          signal: timeoutController.signal
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`[Cloudinary] Falló la subida de ${field}:`, response.status, errorData)
          throw new Error(errorData.error?.message || response.statusText)
        }

        const data = await response.json().catch(() => ({}))

        if (!data.delete_token && !deleteTokenWarned) {
          deleteTokenWarned = true
          console.warn('[Cloudinary] El preset no devuelve delete_token: las imágenes descartadas no se podrán borrar. Activa "Return delete token" en el upload preset.')
        }

        return {
          path: `${folderPath}/${publicId}`,
          deleteToken: data.delete_token || null
        }
      } finally {
        clearTimeout(timer)
        if (signal) signal.removeEventListener('abort', forwardAbort)
      }
    }

    const uploadImageToCloudinary = async (file, field, signal) => {
      if (!file) return null

      let lastError = null

      for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
        if (signal?.aborted) throw new DOMException('Subida cancelada', 'AbortError')

        try {
          return await uploadOnce(file, field, signal)
        } catch (error) {
          if (signal?.aborted) throw error
          lastError = error
          if (attempt < UPLOAD_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, UPLOAD_RETRY_DELAY_MS))
          }
        }
      }

      throw lastError
    }

    const deleteUploadedImage = async (result) => {
      if (!result?.deleteToken) return

      try {
        await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/delete_by_token`, {
          method: 'POST',
          body: new URLSearchParams({ token: result.deleteToken })
        })
      } catch (e) {
        console.warn('[Cloudinary] No se pudo borrar la imagen descartada:', e)
      }
    }

    const discardUpload = async (field) => {
      const state = uploadStates[field]
      if (!state) return

      delete uploadStates[field]
      state.controller.abort()

      const result = await state.promise
      if (result) await deleteUploadedImage(result)
    }

    const startBackgroundUpload = (field, file) => {
      discardUpload(field)

      const controller = new AbortController()
      const state = { file, controller }

      state.promise = uploadImageToCloudinary(file, field, controller.signal)
        .catch((error) => {
          if (error?.name !== 'AbortError') {
            console.warn(`[Cloudinary] Subida en segundo plano falló para ${field}, se reintenta al guardar:`, error)
          }
          return null
        })

      uploadStates[field] = state
    }

    const resolveEvidenciaUrls = async () => {
      const urls = { evidencia_01: null, evidencia_02: null, evidencia_03: null }

      await Promise.all(EVIDENCIA_FIELDS.map(async (field) => {
        const file = form.value[field]

        if (!file) {
          await discardUpload(field)
          return
        }

        const state = uploadStates[field]
        if (state && state.file === file) {
          const result = await state.promise
          if (result) {
            urls[field] = result.path
            return
          }
        }

        const result = await uploadImageToCloudinary(file, field)
        uploadStates[field] = { file, controller: new AbortController(), promise: Promise.resolve(result) }
        urls[field] = result.path
      }))

      return urls
    }

    // Esta pantalla siempre se abre desde Inicio. Usar el historial del
    // navegador aquí puede intentar restaurar una entrada ya descartada por
    // el WebView/PWA y dejar el router sin una vista activa.
    const goBack = () => {
      router.replace('/')
    }

    const openPhotoSheet = (field) => {
      currentPhotoField.value = field
      photoSheetOpen.value = true
    }

    const capturePhoto = (field, source) => {
      const fileInputRef = fileRefs[field]
      if (!fileInputRef || !fileInputRef.$el) return

      const fileInput = fileInputRef.$el.querySelector('input[type="file"]')
      if (!fileInput) return

      if (source === 'camera') fileInput.setAttribute('capture', 'environment')
      else fileInput.removeAttribute('capture')

      fileInput.click()
    }

    const selectPhotoSource = (source) => {
      lastCaptureSource.value = source
      photoSheetOpen.value = false
      setTimeout(() => {
        capturePhoto(currentPhotoField.value, source)
      }, 300)
    }

    const promptNextPhoto = (justCompletedField) => {
      const slots = evidenciaSlots.value
      const index = slots.findIndex((slot) => slot.field === justCompletedField)
      if (index === -1) return

      const next = slots.slice(index + 1).find((slot) => slot.visible && !form.value[slot.field])
      if (!next) return

      const desdeCamara = lastCaptureSource.value === 'camera'

      notify({
        type: 'success',
        message: `${slots[index].label} guardada`,
        caption: `Puedes ${desdeCamara ? 'tomar' : 'agregar'} ${next.label} o cerrar para terminar`,
        timeout: 2500,
        position: 'top'
      })

      setTimeout(() => {
        openPhotoSheet(next.field)
      }, 900)
    }

    const openImageModal = (url) => {
      modalImageUrl.value = url
      imageModalOpen.value = true
    }

    const removePhoto = (field) => {
      discardUpload(field)
      form.value[field] = null
      compressionInfo.value[field] = null
    }

    // Se difiere un frame: al pulsar Guardar, QBtn enfoca su blur-target y el
    // navegador salta al final de la página. Si no esperamos, ese salto pisa
    // el scroll hacia el primer campo con error.
    const scrollToField = (field) => {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-field="${field}"]`)
        if (!el) return
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
      })
    }

    const sincronizarMontaje = async () => {
      const partes = String(form.value.fecha_ingreso_casita).split('-')
      const diaRev = parseInt(partes[0], 10)
      const mesRev = parseInt(partes[1], 10)
      if (!diaRev || !mesRev) return

      const casitaRev = String(form.value.casita).trim()
      const matchCasitaRev = casitaRev.match(/\d+/)
      const casitaKey = matchCasitaRev ? matchCasitaRev[0] : casitaRev.toLowerCase()

      const { data: arrivals, error } = await supabase
        .from('operaciones_memo')
        .select('id, casita, fecha, tipo, montaje_hecho')
        .ilike('tipo', '%arrival%')

      if (error || !arrivals) {
        if (error) console.error('[Montaje Sync] Error consultando operaciones_memo:', error)
        return
      }

      const ids = arrivals.filter((row) => {
        if (String(row.montaje_hecho || '').toLowerCase().includes('hecho')) return false

        const fechaStr = String(row.fecha || '').toLowerCase()
        const monthName = Object.keys(MONTHS).find((name) => fechaStr.includes(name))
        const mesOp = monthName ? MONTHS[monthName] : null
        const matchDia = fechaStr.match(/\d+/)
        const diaOp = matchDia ? parseInt(matchDia[0], 10) : null

        const casitaStr = String(row.casita || '').trim()
        const matchCasitaOp = casitaStr.match(/\d+/)
        const casitaOpKey = matchCasitaOp ? matchCasitaOp[0] : casitaStr.toLowerCase()

        return mesOp === mesRev && diaOp === diaRev && casitaOpKey === casitaKey
      }).map((row) => row.id)

      if (ids.length === 0) return

      const { error: updateErr } = await supabase
        .from('operaciones_memo')
        .update({ montaje_hecho: 'hecho' })
        .in('id', ids)

      if (updateErr) console.error('[Montaje Sync] Error actualizando montaje_hecho:', updateErr)
    }

    const buildPayload = (evidenciaUrls) => {
      const now = new Date()
      const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')

      const payload = {
        casita: form.value.casita,
        quien_revisa: form.value.quien_revisa,
        caja_fuerte: form.value.caja_fuerte,
        room_move: form.value.caja_fuerte === 'Room Move' ? form.value.room_move.trim() : '',
        puertas_ventanas: form.value.puertas_ventanas.trim(),
        evidencia_01: evidenciaUrls.evidencia_01,
        evidencia_02: evidenciaUrls.evidencia_02,
        evidencia_03: evidenciaUrls.evidencia_03,
        fecha_ingreso_casita: needsFechaIngreso.value ? form.value.fecha_ingreso_casita : '',
        notas: form.value.notas.trim(),
        created_at: localTime,
        update_at: localTime
      }

      OPTION_FIELDS.forEach((field) => {
        payload[field] = form.value[field]
      })

      return payload
    }

    const onSubmit = async () => {
      formSubmitted.value = true

      if (missingFields.value.length > 0) {
        const count = missingFields.value.length
        notify({
          type: 'negative',
          message: 'Faltan campos obligatorios',
          caption: `${count} campo${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''}`,
          position: 'top'
        })
        scrollToField(missingFields.value[0])
        return
      }

      if (navigator.onLine === false) {
        notify({
          type: 'negative',
          message: 'Sin conexión',
          caption: 'Conéctate a internet para guardar la revisión',
          position: 'top'
        })
        return
      }

      loading.value = true
      try {
        let evidenciaUrls
        try {
          evidenciaUrls = await resolveEvidenciaUrls()
        } catch (uploadError) {
          notify({
            type: 'negative',
            message: 'No se pudieron subir las evidencias',
            caption: 'La revisión no se guardó. Revisa tu conexión e intenta de nuevo',
            position: 'top'
          })
          return
        }

        const result = await store.addCasa(buildPayload(evidenciaUrls))

        if (!result.success) {
          console.error('[NewRevisionPage] Error al guardar:', result.error)
          notify({
            type: 'negative',
            message: 'No se pudo guardar la revisión',
            caption: result.error?.message || 'Intenta de nuevo',
            position: 'top'
          })
          return
        }

        submitted.value = true
        playSound('send')

        if (needsFechaIngreso.value && form.value.fecha_ingreso_casita) {
          sincronizarMontaje().catch((syncErr) => {
            console.error('[Montaje Sync] Error en sincronización:', syncErr)
          })
        }

        const hasEvidencia = EVIDENCIA_FIELDS.some((field) => evidenciaUrls[field])

        if (!hasEvidencia) {
          notify({ type: 'success', message: 'Revisión guardada', position: 'top' })
          resetFormAndGoBack()
          return
        }

        shareFiles.value = EVIDENCIA_FIELDS
          .filter((field) => form.value[field])
          .map((field) => ({ field, file: form.value[field] }))

        const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`
        const urls = {}
        EVIDENCIA_FIELDS.forEach((field) => {
          if (evidenciaUrls[field]) urls[field] = `${baseUrl}/${evidenciaUrls[field]}`
        })
        shareEvidenciaUrls.value = urls

        showShareModal.value = true
      } catch (error) {
        console.error('[NewRevisionPage] Error guardando revisión:', error)
        notify({
          type: 'negative',
          message: 'Ocurrió un error al guardar',
          caption: error?.message || 'Intenta de nuevo',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }

    const shareViaWebShare = async () => {
      const filesToShare = shareFiles.value.map((item) => item.file)
      const canShareFiles = filesToShare.length > 0 &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: filesToShare })

      try {
        if (canShareFiles) {
          await navigator.share({ files: filesToShare })
        } else if (shareSupported) {
          await navigator.share({
            title: 'Evidencias de Revisión',
            text: 'Aquí están las imágenes de evidencia'
          })
        } else {
          notify({ type: 'warning', message: 'Compartir no está disponible en este dispositivo', position: 'top' })
          return
        }
        closeShareModal()
      } catch (e) {
        if (e?.name !== 'AbortError') {
          console.warn('[NewRevisionPage] No se pudo compartir:', e)
          notify({ type: 'negative', message: 'No se pudo compartir', position: 'top' })
        }
      }
    }

    const resetFormAndGoBack = () => {
      draftEnabled = false
      if (draftTimer) {
        clearTimeout(draftTimer)
        draftTimer = null
      }

      clearStoredForm()

      const revisor = revisorFijo.value
        ? authStore.user.Usuario
        : (users.value.length === 1 ? users.value[0].value : '')

      form.value = { ...createEmptyForm(), quien_revisa: revisor }
      compressionInfo.value = { evidencia_01: null, evidencia_02: null, evidencia_03: null }
      formSubmitted.value = false

      router.replace('/')
    }

    const closeShareModal = () => {
      showShareModal.value = false
      resetFormAndGoBack()
    }

    watch(form, () => {
      if (!draftEnabled) return
      if (draftTimer) clearTimeout(draftTimer)
      draftTimer = setTimeout(() => {
        draftTimer = null
        saveFormToStorage()
      }, DRAFT_SAVE_DELAY)
    }, { deep: true })

    watch(() => form.value.caja_fuerte, (newVal) => {
      if (!CON_FECHA_INGRESO.includes(newVal)) {
        form.value.fecha_ingreso_casita = ''
        form.value.fecha_ingreso_casita_selection = ''
      }
      if (newVal !== 'Room Move') {
        form.value.room_move = ''
      }
    })

    EVIDENCIA_FIELDS.forEach((field) => {
      watch(() => form.value[field], async (newFile) => {
        refreshPreview(field, newFile)

        if (!newFile || typeof newFile === 'string') return

        if (newFile._isCompressed === true) {
          startBackgroundUpload(field, newFile)
          return
        }

        compressing.value[field] = true
        try {
          const compressed = await compressImage(newFile, field)
          if (compressed) {
            compressed._isCompressed = true
            form.value[field] = compressed
          }
        } catch (e) {
          console.error(`[Compresión] Falló para ${field}:`, e)
          notify({
            type: 'warning',
            message: 'No se pudo optimizar la imagen',
            caption: 'Se subirá en su tamaño original',
            position: 'top'
          })
        } finally {
          compressing.value[field] = false
        }

        promptNextPhoto(field)
      })
    })

    onMounted(() => {
      loadUsers()
    })

    onUnmounted(() => {
      if (draftTimer) clearTimeout(draftTimer)
      EVIDENCIA_FIELDS.forEach((field) => releasePreview(field))

      if (submitted.value !== true) {
        EVIDENCIA_FIELDS.forEach((field) => discardUpload(field))
      }
    })

    return {
      form,
      loading,
      users,
      authStore,
      revisorFijo,
      casitaOptions,
      cajaFuerteOptions,
      fechaIngresoCasitaOptions,
      formSections: FORM_SECTIONS,
      evidenciaLabels: EVIDENCIA_LABELS,
      needsFechaIngreso,
      showEvidencias,
      evidencia1Required,
      visibleEvidencias,
      previewUrls,
      compressing,
      compressionInfo,
      validationErrors,
      missingFieldsCount,
      rowHasError,
      photoSheetOpen,
      imageModalOpen,
      modalImageUrl,
      showShareModal,
      shareEvidenciaUrls,
      shareSupported,
      setFileRef,
      selectFechaIngresoCasita,
      goBack,
      openPhotoSheet,
      selectPhotoSource,
      openImageModal,
      removePhoto,
      onSubmit,
      shareViaWebShare,
      closeShareModal
    }
  }
})
</script>

<style scoped>
.text-h5 {
  font-size: 1.5rem;
  font-weight: 700;
}

.section-label {
  font-weight: 600;
  display: flex;
  align-items: center;
  color: #1f2937;
  font-size: 0.96rem;
  letter-spacing: -0.01em;
}

.required-asterisk {
  color: #ef5350;
  margin-left: 4px;
  font-weight: bold;
}

.section-container {
  margin-bottom: 24px;
  border-radius: 20px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(249, 251, 255, 0.88));
}

.category-header {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 16px;
  padding: 9px 14px;
  border-radius: 14px;
  border: 1px solid rgba(133, 173, 219, 0.28);
  background: linear-gradient(120deg, rgba(223, 235, 249, 0.95), rgba(238, 246, 255, 0.95));
  color: #0f4d92;
}

.category-header--otros {
  background: #fff3e0;
  color: #ef6c00;
}

.category-header--evidence {
  background: #f1f8e9;
  color: #33691e;
}

.category-title {
  font-weight: 700;
  margin-left: 8px;
  font-size: 1.1rem;
}

.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.option-btn {
  flex: 0 1 auto;
  min-width: fit-content;
  max-width: 100%;
}

.custom-select-btn {
  border-radius: 14px !important;
  border: 1px solid rgba(203, 213, 225, 0.95) !important;
  background: linear-gradient(180deg, #ffffff, #f8fafc) !important;
  color: #334155 !important;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  padding: 8px 16px !important;
  min-height: 44px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-select-btn:hover {
  border-color: #93b3d8 !important;
  transform: translateY(-1px);
}

.custom-select-btn:active {
  transform: scale(0.95);
}

.custom-select-btn.selected {
  border-color: #1266d6 !important;
  color: #0c4fb0 !important;
  background: linear-gradient(180deg, #f2f7ff, #eaf2ff) !important;
  box-shadow: 0 10px 24px rgba(18, 102, 214, 0.2) !important;
}

.input-styled :deep(.q-field__control) {
  border-radius: 14px !important;
  border: 1px solid rgba(203, 213, 225, 0.75);
  background: linear-gradient(180deg, #ffffff, #fafcff) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 6px 14px rgba(15, 23, 42, 0.05) !important;
}

.input-styled :deep(.q-field__marginal) {
  color: #757575;
}

.submit-btn {
  color: white !important;
  border-radius: 14px !important;
  padding: 12px !important;
  font-weight: 700 !important;
  font-size: 1.1rem !important;
  letter-spacing: 0.01em;
  background: linear-gradient(135deg, #0a64d8 0%, #1380f5 100%) !important;
  box-shadow: 0 14px 28px rgba(19, 128, 245, 0.35) !important;
}

.photo-btn {
  color: #616161 !important;
  border-radius: 14px !important;
  border: 1px dashed rgba(146, 165, 191, 0.75) !important;
  background: linear-gradient(180deg, #f9fbff, #f2f6fb) !important;
  text-transform: none !important;
  font-weight: 500 !important;
  padding: 12px 16px !important;
  min-height: 48px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.photo-btn:active {
  transform: scale(0.95);
}

.photo-bottom-sheet {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.photo-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 2px;
  background: white;
}

.photo-sheet-title {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
  letter-spacing: -0.01em;
}

.photo-sheet-close {
  color: #6b7280;
  min-width: 42px;
  min-height: 42px;
}

.photo-options-container {
  padding: 12px 16px 16px;
  background: white;
}

.photo-option {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8f9fa;
}

.photo-option:hover {
  background: #e3f2fd;
  transform: translateY(-1px);
}

.photo-option:active {
  transform: scale(0.98);
}

.photo-option:last-child {
  margin-bottom: 0;
}

.photo-option-label {
  font-weight: 600;
  color: #424242;
  margin-left: 16px;
  font-size: 1rem;
}

.photo-option-subtitle {
  font-size: 0.875rem;
  color: #757575;
  margin-left: 16px;
  margin-top: 2px;
}

.photo-preview-container {
  position: relative;
  width: 50%;
  aspect-ratio: 5 / 3;
  margin: 0 auto;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  border: 2px dashed #bdbdbd;
}

.photo-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.photo-preview:hover {
  transform: scale(1.02);
}

.photo-preview-loading {
  z-index: 2;
  background: rgba(255, 255, 255, 0.7);
}

.delete-photo-btn {
  position: absolute !important;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.compression-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 8px;
  font-size: 0.75rem;
}

.compression-row {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.4;
}

.image-modal-card {
  background: rgba(0, 0, 0, 0.95);
}

.image-modal-close {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  background: white !important;
  color: black !important;
}

.image-modal-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 0;
}

.full-size-image {
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
}

/* Share Modal */
.share-modal-card {
  width: 100%;
  max-width: 450px;
  border-radius: 22px;
  border: 1px solid rgba(216, 224, 234, 0.9);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.share-modal-header .text-h6 {
  font-weight: 600;
  color: #424242;
}

.share-evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.share-evidence-item {
  position: relative;
}

.share-evidence-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #616161;
  text-align: center;
  margin-bottom: 4px;
}

.share-evidence-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: transform 0.2s;
}

.share-evidence-image:hover {
  transform: scale(1.02);
}

.share-modal-actions {
  padding: 8px 20px 20px;
}

.share-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  margin-bottom: 8px;
}

.share-btn:last-child {
  margin-bottom: 0;
}

.share-btn-native {
  background: linear-gradient(135deg, #0f67db, #1f86f7) !important;
  color: #fff !important;
}

.share-btn-native:hover {
  background: linear-gradient(135deg, #0f5ec9, #1a78dd) !important;
}

.share-btn-cancel {
  color: #757575 !important;
  margin-top: 8px;
}

.share-btn-cancel:hover {
  background: #f5f5f5 !important;
}

/* Apple-inspired visual refresh */
.bg-grey-2 {
  background:
    radial-gradient(1200px 600px at 12% -10%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 65%),
    radial-gradient(1100px 500px at 88% 0%, rgba(222, 234, 248, 0.7), rgba(222, 234, 248, 0) 62%),
    linear-gradient(180deg, #f4f7fb 0%, #edf2f7 100%);
}

.q-page > .row.items-center.q-mb-lg {
  max-width: 1120px;
  margin: 10px auto 22px !important;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.64);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.q-page > .row.items-center.q-mb-lg .text-h5 {
  font-size: clamp(1.2rem, 2.3vw, 1.55rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1c1d1f !important;
}

.q-page > .q-form {
  max-width: 1120px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 60px rgba(16, 24, 40, 0.09);
  border-radius: 30px;
  padding: 20px clamp(12px, 3vw, 32px) 26px;
  backdrop-filter: blur(22px);
}

.section-container,
.row.q-col-gutter-md {
  animation: rise-in 420ms ease both;
}

.section-container:nth-of-type(2n) {
  animation-delay: 40ms;
}

.section-container:nth-of-type(3n) {
  animation-delay: 80ms;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/*
  Los estados de error van al final a propósito: comparten especificidad con
  las reglas base (.section-container, .input-styled) y solo ganan si se
  declaran después.
*/
.error-label {
  color: #d32f2f !important;
}

.error-section,
.error-row {
  background: rgba(211, 47, 47, 0.06) !important;
  border-radius: 20px;
  outline: 2px solid #d32f2f;
  outline-offset: 4px;
}

.error-field :deep(.q-field__control) {
  border: 2px solid #d32f2f !important;
  box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.2) !important;
}

.photo-btn.error-photo {
  border: 2px solid #d32f2f !important;
  background: rgba(211, 47, 47, 0.05) !important;
}

@media (max-width: 768px) {
  .q-page > .q-form {
    border-radius: 22px;
    padding: 14px 10px 22px;
  }

  .q-page > .row.items-center.q-mb-lg {
    margin-top: 2px !important;
    border-radius: 14px;
    padding: 8px;
  }
}

@media (max-width: 600px) {
  .option-btn {
    min-width: fit-content;
  }

  .photo-options-container {
    padding: 12px;
  }

  .photo-option {
    padding: 12px;
  }

  .image-modal-close {
    top: 12px;
    right: 12px;
  }

  .compression-info {
    padding: 5px 8px;
    font-size: 0.7rem;
  }

  .compression-row {
    gap: 2px;
  }

  .share-evidence-grid {
    gap: 8px;
  }

  .share-modal-card {
    margin: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-container,
  .row.q-col-gutter-md {
    animation: none;
  }
}
</style>
