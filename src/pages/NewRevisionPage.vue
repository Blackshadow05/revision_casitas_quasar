<template>
  <q-page class="nr-page" @focusin="onPageFocusIn" @focusout="onPageFocusOut">
    <header class="nr-header">
      <div class="nr-header__row">
        <button type="button" class="nr-back" aria-label="Volver al inicio" @click="goBack">
          <q-icon name="arrow_back_ios_new" size="18px" />
        </button>
        <div class="nr-header__text">
          <h1 class="nr-title">Nueva revisión</h1>
          <p class="nr-subtitle">{{ headerSubtitle }}</p>
        </div>
        <div
          class="nr-progress-pill"
          :class="{ 'nr-progress-pill--done': missingFieldsCount === 0 }"
          aria-live="polite"
        >
          <q-icon :name="missingFieldsCount === 0 ? 'check_circle' : 'checklist'" size="15px" />
          <span>{{ completedCount }}/{{ requiredCount }}</span>
        </div>
      </div>
      <div
        class="nr-progress"
        role="progressbar"
        aria-label="Progreso del formulario"
        :aria-valuenow="progressPct"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="nr-progress__bar" :style="{ width: progressPct + '%' }" />
      </div>
    </header>

    <q-form class="nr-form" @submit="onSubmit">
      <div class="nr-form__body">
        <!-- Datos generales -->
        <section class="nr-group">
          <h2 class="nr-group__title">
            <span class="nr-group__icon nr-group__icon--general"><q-icon name="home_work" size="16px" /></span>
            Datos generales
          </h2>

          <div class="nr-panel">
            <div class="nr-field" :class="fieldState('casita')" data-field="casita">
              <div class="nr-field__label">
                Casita <span class="nr-req" aria-hidden="true">*</span>
                <q-icon v-if="isFieldFilled('casita')" name="check_circle" size="16px" class="nr-field__check" />
              </div>
              <q-select
                v-model="form.casita"
                :options="casitaOptions"
                borderless
                dense
                class="nr-input"
                :behavior="selectBehavior"
                dropdown-icon="expand_more"
                aria-label="Casita"
              >
                <template #prepend>
                  <q-icon name="home" size="20px" />
                </template>
                <template #selected>
                  <span v-if="form.casita">Casita {{ form.casita }}</span>
                  <span v-else class="nr-placeholder">Selecciona 1 a 50</span>
                </template>
              </q-select>
              <p v-if="validationErrors.casita" class="nr-hint nr-hint--error">Selecciona la casita</p>
            </div>

            <div class="nr-field" :class="fieldState('quien_revisa')" data-field="quien_revisa">
              <div class="nr-field__label">
                Quién revisa <span class="nr-req" aria-hidden="true">*</span>
                <q-icon v-if="isFieldFilled('quien_revisa')" name="check_circle" size="16px" class="nr-field__check" />
              </div>
              <div v-if="revisorFijo" class="nr-static">
                <q-icon name="person" size="20px" class="nr-static__icon" />
                <span class="nr-static__text">{{ form.quien_revisa }}</span>
                <q-icon name="lock" size="15px" class="nr-static__lock" />
              </div>
              <q-select
                v-else
                v-model="form.quien_revisa"
                :options="users"
                emit-value
                map-options
                borderless
                dense
                class="nr-input"
                :behavior="selectBehavior"
                dropdown-icon="expand_more"
                aria-label="Quién revisa"
              >
                <template #prepend>
                  <q-icon name="person" size="20px" />
                </template>
                <template #selected>
                  <span v-if="form.quien_revisa">{{ form.quien_revisa }}</span>
                  <span v-else class="nr-placeholder">Seleccionar revisor</span>
                </template>
              </q-select>
              <p v-if="validationErrors.quien_revisa" class="nr-hint nr-hint--error">Selecciona el revisor</p>
            </div>

            <div class="nr-field" :class="fieldState('caja_fuerte')" data-field="caja_fuerte">
              <div class="nr-field__label" id="nr-caja-label">
                Caja fuerte <span class="nr-req" aria-hidden="true">*</span>
                <q-icon v-if="isFieldFilled('caja_fuerte')" name="check_circle" size="16px" class="nr-field__check" />
              </div>
              <div class="nr-pills" role="radiogroup" aria-labelledby="nr-caja-label">
                <button
                  v-for="option in cajaFuerteOptions"
                  :key="option"
                  type="button"
                  class="nr-pill"
                  role="radio"
                  :aria-checked="form.caja_fuerte === option"
                  @click="form.caja_fuerte = option"
                >
                  {{ option }}
                </button>
              </div>
              <p v-if="validationErrors.caja_fuerte" class="nr-hint nr-hint--error">Selecciona una opción</p>
            </div>

            <div v-if="form.caja_fuerte === 'Room Move'" class="nr-field nr-field--reveal">
              <div class="nr-field__label">Movimiento de casita</div>
              <q-input
                v-model="form.room_move"
                placeholder="Detalle del movimiento"
                borderless
                dense
                class="nr-input"
                inputmode="text"
                autocomplete="off"
                @focus="onPageFocusIn"
                @blur="onPageFocusOut"
              >
                <template #prepend>
                  <q-icon name="swap_horiz" size="20px" />
                </template>
              </q-input>
            </div>

            <div class="nr-field" :class="fieldState('puertas_ventanas')" data-field="puertas_ventanas">
              <div class="nr-field__label">
                Puertas y ventanas <span class="nr-req" aria-hidden="true">*</span>
                <q-icon v-if="isFieldFilled('puertas_ventanas')" name="check_circle" size="16px" class="nr-field__check" />
              </div>
              <q-input
                v-model="form.puertas_ventanas"
                placeholder="Ej. todo cerrado, ventana norte abierta"
                borderless
                dense
                class="nr-input"
                inputmode="text"
                autocomplete="off"
                aria-label="Puertas y ventanas"
                @focus="onPageFocusIn"
                @blur="onPageFocusOut"
              >
                <template #prepend>
                  <q-icon name="meeting_room" size="20px" />
                </template>
              </q-input>
              <p v-if="validationErrors.puertas_ventanas" class="nr-hint nr-hint--error">Campo obligatorio</p>
            </div>

            <div
              v-if="needsFechaIngreso"
              class="nr-field nr-field--reveal"
              :class="fieldState('fecha_ingreso_casita')"
              data-field="fecha_ingreso_casita"
            >
              <div class="nr-field__label" id="nr-fecha-label">
                Fecha de ingreso <span class="nr-req" aria-hidden="true">*</span>
                <q-icon v-if="isFieldFilled('fecha_ingreso_casita')" name="check_circle" size="16px" class="nr-field__check" />
              </div>
              <div class="nr-pills" role="radiogroup" aria-labelledby="nr-fecha-label">
                <button
                  v-for="option in fechaIngresoCasitaOptions"
                  :key="option"
                  type="button"
                  class="nr-pill"
                  role="radio"
                  :aria-checked="form.fecha_ingreso_casita_selection === option"
                  @click="selectFechaIngresoCasita(option)"
                >
                  {{ option }}
                </button>
              </div>
              <p v-if="form.fecha_ingreso_casita" class="nr-hint">
                <q-icon name="event" size="14px" /> {{ form.fecha_ingreso_casita }}
              </p>
              <p v-else-if="validationErrors.fecha_ingreso_casita" class="nr-hint nr-hint--error">Selecciona una opción</p>
            </div>
          </div>
        </section>

        <!-- Inventario -->
        <section v-for="group in inventoryGroups" :key="group.title" class="nr-group">
          <h2 class="nr-group__title">
            <span class="nr-group__icon" :class="'nr-group__icon--' + group.tone">
              <q-icon :name="group.icon" size="16px" />
            </span>
            {{ group.title }}
          </h2>

          <div class="nr-panel nr-panel--grid">
            <div
              v-for="item in group.items"
              :key="item.field"
              class="nr-field"
              :class="fieldState(item.field)"
              :data-field="item.field"
            >
              <div class="nr-field__label" :id="'nr-label-' + item.field">
                {{ item.label }} <span class="nr-req" aria-hidden="true">*</span>
                <q-icon v-if="isFieldFilled(item.field)" name="check_circle" size="16px" class="nr-field__check" />
              </div>
              <div
                class="nr-pills"
                role="radiogroup"
                :aria-labelledby="'nr-label-' + item.field"
              >
                <button
                  v-for="option in item.options"
                  :key="option"
                  type="button"
                  class="nr-pill"
                  role="radio"
                  :aria-checked="form[item.field] === option"
                  @click="form[item.field] = option"
                >
                  {{ option }}
                </button>
              </div>
              <p v-if="validationErrors[item.field]" class="nr-hint nr-hint--error">Selecciona una opción</p>
            </div>
          </div>
        </section>

        <!-- Evidencias -->
        <section v-if="showEvidencias" class="nr-group">
          <h2 class="nr-group__title">
            <span class="nr-group__icon nr-group__icon--evidence"><q-icon name="photo_camera" size="16px" /></span>
            Evidencia fotográfica
            <span v-if="evidencia1Required" class="nr-tag">Evidencia 1 obligatoria</span>
            <span v-else class="nr-tag nr-tag--muted">Opcional</span>
          </h2>

          <div class="nr-panel">
            <div class="nr-evidence-grid">
              <div
                v-for="ev in visibleEvidencias"
                :key="ev.field"
                class="nr-evidence"
                :data-field="ev.field"
              >
                <button
                  v-if="!form[ev.field]"
                  type="button"
                  class="nr-evidence__add"
                  :class="{ 'is-error': validationErrors[ev.field] }"
                  :disabled="ev.disabled"
                  @click="openPhotoSheet(ev.field)"
                >
                  <span class="nr-evidence__add-icon"><q-icon name="add_a_photo" size="22px" /></span>
                  <span class="nr-evidence__add-text">{{ ev.label }}</span>
                  <span class="nr-evidence__add-sub">{{ ev.required ? 'Obligatoria' : 'Opcional' }}</span>
                </button>

                <template v-else>
                  <div class="nr-evidence__tile">
                    <q-inner-loading :showing="compressing[ev.field]" class="nr-evidence__loading">
                      <q-spinner size="28px" color="primary" />
                    </q-inner-loading>
                    <img
                      :src="previewUrls[ev.field]"
                      :alt="ev.label"
                      class="nr-evidence__img"
                      @click="openImageModal(previewUrls[ev.field])"
                    />
                    <span class="nr-evidence__badge">{{ ev.label }}</span>
                    <button
                      type="button"
                      class="nr-evidence__delete"
                      :aria-label="'Quitar ' + ev.label"
                      @click="removePhoto(ev.field)"
                    >
                      <q-icon name="close" size="16px" />
                    </button>
                  </div>
                  <p v-if="compressionInfo[ev.field]" class="nr-evidence__meta">
                    {{ compressionInfo[ev.field].compressedSize }}
                    <span class="nr-evidence__pct">−{{ compressionInfo[ev.field].reduction }}%</span>
                  </p>
                </template>

                <q-file
                  :ref="(el) => setFileRef(ev.field, el)"
                  v-model="form[ev.field]"
                  label=""
                  accept="image/*"
                  style="display: none;"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Notas -->
        <section class="nr-group">
          <h2 class="nr-group__title">
            <span class="nr-group__icon nr-group__icon--notes"><q-icon name="notes" size="16px" /></span>
            Notas
            <span class="nr-tag nr-tag--muted">Opcional</span>
          </h2>
          <div class="nr-panel">
            <div class="nr-field" data-field="notas">
              <q-input
                v-model="form.notas"
                type="textarea"
                placeholder="Observaciones adicionales..."
                borderless
                autogrow
                class="nr-input nr-input--textarea"
                inputmode="text"
                autocomplete="off"
                aria-label="Notas y observaciones"
                @focus="onPageFocusIn"
                @blur="onPageFocusOut"
              />
            </div>
          </div>
        </section>
      </div>

      <div class="nr-submit-bar">
        <div class="nr-submit-status" :class="{ 'is-ready': missingFieldsCount === 0 }">
          <q-icon :name="missingFieldsCount === 0 ? 'check_circle' : 'radio_button_unchecked'" size="18px" />
          <div>
            <div class="nr-submit-status__title">
              {{ missingFieldsCount === 0 ? 'Todo listo' : `${missingFieldsCount} pendiente${missingFieldsCount > 1 ? 's' : ''}` }}
            </div>
            <div class="nr-submit-status__caption">
              {{ missingFieldsCount === 0 ? 'Puedes guardar' : 'Campos obligatorios' }}
            </div>
          </div>
        </div>
        <q-btn
          type="submit"
          class="nr-submit"
          unelevated
          no-caps
          label="Guardar"
          icon-right="arrow_forward"
          :loading="loading"
        />
      </div>
    </q-form>

    <!-- Bottom sheet: origen de la foto -->
    <q-dialog v-model="photoSheetOpen" position="bottom">
      <q-card class="photo-sheet">
        <div class="photo-sheet__grabber" aria-hidden="true" />
        <div class="photo-sheet__header">
          <div class="photo-sheet__title">Agregar foto</div>
          <button type="button" class="photo-sheet__close" aria-label="Cerrar" @click="photoSheetOpen = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <div class="photo-sheet__options">
          <button type="button" class="photo-option" @click="selectPhotoSource('camera')">
            <span class="photo-option__icon"><q-icon name="photo_camera" size="24px" /></span>
            <span class="photo-option__label">Cámara</span>
            <span class="photo-option__subtitle">Tomar foto ahora</span>
          </button>
          <button type="button" class="photo-option" @click="selectPhotoSource('gallery')">
            <span class="photo-option__icon"><q-icon name="photo_library" size="24px" /></span>
            <span class="photo-option__label">Galería</span>
            <span class="photo-option__subtitle">Elegir una existente</span>
          </button>
        </div>
      </q-card>
    </q-dialog>

    <!-- Visor de imagen -->
    <q-dialog v-model="imageModalOpen" maximized>
      <q-card class="image-modal-card">
        <q-btn
          icon="close"
          flat
          round
          class="image-modal-close"
          aria-label="Cerrar imagen"
          @click="imageModalOpen = false"
        />
        <q-card-section class="image-modal-content">
          <img :src="modalImageUrl" alt="Evidencia ampliada" class="full-size-image" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Compartir evidencias -->
    <q-dialog v-model="showShareModal" persistent :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="share-modal-card">
        <div class="share-modal-header">
          <div class="share-modal-title">
            <q-icon name="check_circle" size="22px" class="share-modal-title__icon" />
            <span>Revisión guardada</span>
          </div>
          <q-btn icon="close" flat round dense aria-label="Cerrar" @click="closeShareModal" />
        </div>

        <q-card-section class="share-modal-body q-pt-none">
          <p class="share-modal-copy">¿Deseas compartir las imágenes de evidencia?</p>

          <div class="share-evidence-grid">
            <div
              v-for="item in shareItems"
              :key="item.field"
              class="share-evidence-item"
            >
              <img :src="item.url" :alt="item.label" class="share-evidence-image" />
              <div class="share-evidence-label">{{ item.label }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="share-modal-actions" vertical>
          <q-btn
            class="share-btn share-btn-native"
            unelevated
            no-caps
            label="Compartir imágenes"
            icon="share"
            :loading="sharing"
            :disable="sharing || shareItems.length === 0"
            @click="shareViaWebShare"
          />
          <q-btn
            class="share-btn share-btn-cancel"
            flat
            no-caps
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
import { useQuasar } from 'quasar'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import { playSound } from '../utils/sounds'
import { notify } from '../utils/notify'
import { isTextControl, scrollElementIntoAppView } from '../utils/appScroll'

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
  { type: 'header', title: 'Electrónicos', icon: 'devices', tone: 'electronics' },
  { type: 'section', field: 'chromecast', label: 'Chromecast', options: ['0', '01', '02', '03', '04'] },
  { type: 'section', field: 'speaker', label: 'Speaker', options: CANTIDAD_4 },
  { type: 'section', field: 'usb_speaker', label: 'USB Speaker', options: CANTIDAD_4 },
  { type: 'section', field: 'controles_tv', label: 'Controles TV', options: CANTIDAD_4 },
  { type: 'header', title: 'Otros Artículos', icon: 'category', tone: 'otros' },
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
      { field: 'accesorios_secadora', label: 'Accesorios Secadora', options: ['0', '01', '02', '03', '04', '05', '06', '07', '08'] }
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

// Agrupa los campos de inventario bajo su encabezado para renderizarlos
// como un solo panel por categoría.
const INVENTORY_GROUPS = FORM_SECTIONS.reduce((groups, block) => {
  if (block.type === 'header') {
    groups.push({ title: block.title, icon: block.icon, tone: block.tone || 'general', items: [] })
    return groups
  }
  const items = block.type === 'section' ? [block] : block.fields
  groups[groups.length - 1].items.push(...items)
  return groups
}, [])

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
    const $q = useQuasar()
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
    const sharing = ref(false)
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

    const shareItems = computed(() => {
      return EVIDENCIA_FIELDS
        .filter((field) => shareEvidenciaUrls.value[field])
        .map((field) => ({
          field,
          url: shareEvidenciaUrls.value[field],
          label: EVIDENCIA_LABELS[field]
        }))
    })

    // En móvil el QSelect abre un diálogo a pantalla completa: más cómodo
    // para elegir entre 50 casitas que un menú flotante dentro del scroll.
    const selectBehavior = $q.platform.is.mobile ? 'dialog' : 'menu'

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

    const requiredCount = computed(() => requiredFields.value.length)

    const completedCount = computed(() => requiredCount.value - missingFieldsCount.value)

    const progressPct = computed(() => {
      if (requiredCount.value === 0) return 0
      return Math.round((completedCount.value / requiredCount.value) * 100)
    })

    const headerSubtitle = computed(() => {
      const parts = []
      if (form.value.casita) parts.push(`Casita ${form.value.casita}`)
      if (form.value.caja_fuerte) parts.push(form.value.caja_fuerte)
      if (parts.length > 0) return parts.join(' · ')
      return 'Completa los campos obligatorios'
    })

    const validationErrors = computed(() => {
      if (formSubmitted.value !== true) return {}
      return missingFields.value.reduce((acc, field) => {
        acc[field] = true
        return acc
      }, {})
    })

    const fieldState = (field) => ({
      'nr-field--error': validationErrors.value[field] === true,
      'nr-field--filled': isFieldFilled(field)
    })

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

    // En el shell móvil el documento no hace scroll: el teclado tapa el input.
    // No movemos el layout en el mismo instante del focus (iOS cierra el teclado).
    // Esperamos al visualViewport y subimos el campo con scroll instantáneo.
    const REVEAL_DELAYS = [80, 220, 420, 700]
    let revealTimers = []

    const clearRevealTimers = () => {
      revealTimers.forEach((id) => window.clearTimeout(id))
      revealTimers = []
    }

    const revealFocusedField = () => {
      const el = document.activeElement
      if (!isTextControl(el) || !el.closest?.('.nr-page')) return

      const target = el.closest('.nr-field') || el
      const header = document.querySelector('.nr-header')
      const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 8
      scrollElementIntoAppView(target, {
        topGutter: headerH + 10,
        bottomGutter: 20,
        behavior: 'auto'
      })
    }

    const scheduleRevealFocusedField = () => {
      clearRevealTimers()
      REVEAL_DELAYS.forEach((ms) => {
        revealTimers.push(window.setTimeout(revealFocusedField, ms))
      })
    }

    const setFieldEditing = (open) => {
      document.documentElement.classList.toggle('nr-field-editing', open)
    }

    const onPageFocusIn = (event) => {
      const el = event?.target || document.activeElement
      if (!el || el === document.body) return
      if (!el.closest?.('.nr-page')) return
      if (!isTextControl(el) && !el.closest?.('.nr-input')) return
      setFieldEditing(true)
      scheduleRevealFocusedField()
    }

    const onPageFocusOut = () => {
      window.setTimeout(() => {
        if (isTextControl(document.activeElement) && document.activeElement.closest?.('.nr-page')) return
        setFieldEditing(false)
        clearRevealTimers()
      }, 50)
    }

    let viewportRevealTimer = null
    const onViewportChange = () => {
      if (!isTextControl(document.activeElement)) return
      if (!document.activeElement.closest?.('.nr-page')) return
      if (viewportRevealTimer) window.clearTimeout(viewportRevealTimer)
      viewportRevealTimer = window.setTimeout(() => {
        viewportRevealTimer = null
        revealFocusedField()
      }, 50)
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
          .filter((field) => form.value[field] instanceof Blob)
          .map((field) => ({ field, file: form.value[field] }))

        const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`
        const urls = {}
        EVIDENCIA_FIELDS.forEach((field) => {
          if (previewUrls.value[field]) urls[field] = previewUrls.value[field]
          else if (evidenciaUrls[field]) urls[field] = `${baseUrl}/${evidenciaUrls[field]}`
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

    const toShareableFile = async (field, raw, url) => {
      const name = `${EVIDENCIA_LABELS[field] || field}.jpg`
      if (raw instanceof Blob) {
        const type = raw.type && raw.type.startsWith('image/') ? raw.type : 'image/jpeg'
        return new File([raw], name, { type, lastModified: Date.now() })
      }
      if (!url) return null
      const response = await fetch(url)
      if (!response.ok) throw new Error('No se pudo leer la imagen')
      const blob = await response.blob()
      const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg'
      return new File([blob], name, { type, lastModified: Date.now() })
    }

    const shareViaWebShare = async () => {
      if (sharing.value) return
      sharing.value = true

      try {
        const files = []
        for (const item of shareFiles.value) {
          const url = shareEvidenciaUrls.value[item.field]
          const file = await toShareableFile(item.field, item.file, url)
          if (file) files.push(file)
        }

        if (files.length === 0) {
          for (const item of shareItems.value) {
            const file = await toShareableFile(item.field, null, item.url)
            if (file) files.push(file)
          }
        }

        if (files.length === 0) {
          notify({ type: 'warning', message: 'No hay imágenes para compartir', position: 'top' })
          return
        }

        const shareData = {
          title: 'Evidencias de revisión',
          text: 'Imágenes de evidencia',
          files
        }

        if (typeof navigator.share !== 'function') {
          notify({
            type: 'warning',
            message: 'Compartir no está disponible en este dispositivo',
            caption: 'Usa el menú del sistema al abrir cada foto',
            position: 'top'
          })
          return
        }

        const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files })
        if (canShareFiles) {
          await navigator.share(shareData)
        } else if (navigator.canShare?.({ files: [files[0]] })) {
          await navigator.share({ title: shareData.title, text: shareData.text, files: [files[0]] })
        } else {
          await navigator.share({
            title: shareData.title,
            text: `${shareData.text}\n${shareItems.value.map((item) => item.url).join('\n')}`
          })
        }
        closeShareModal()
      } catch (e) {
        if (e?.name !== 'AbortError') {
          console.warn('[NewRevisionPage] No se pudo compartir:', e)
          notify({ type: 'negative', message: 'No se pudo compartir', position: 'top' })
        }
      } finally {
        sharing.value = false
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
      document.addEventListener('focusin', onPageFocusIn, true)
      document.addEventListener('focusout', onPageFocusOut, true)
      window.addEventListener('resize', onViewportChange)
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onViewportChange)
        window.visualViewport.addEventListener('scroll', onViewportChange)
      }
    })

    onUnmounted(() => {
      if (draftTimer) clearTimeout(draftTimer)
      clearRevealTimers()
      if (viewportRevealTimer) window.clearTimeout(viewportRevealTimer)
      document.removeEventListener('focusin', onPageFocusIn, true)
      document.removeEventListener('focusout', onPageFocusOut, true)
      document.documentElement.classList.remove('nr-field-editing')
      window.removeEventListener('resize', onViewportChange)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onViewportChange)
        window.visualViewport.removeEventListener('scroll', onViewportChange)
      }
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
      inventoryGroups: INVENTORY_GROUPS,
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
      requiredCount,
      completedCount,
      progressPct,
      headerSubtitle,
      selectBehavior,
      isFieldFilled,
      fieldState,
      photoSheetOpen,
      imageModalOpen,
      modalImageUrl,
      showShareModal,
      shareItems,
      sharing,
      setFileRef,
      selectFechaIngresoCasita,
      goBack,
      openPhotoSheet,
      selectPhotoSource,
      openImageModal,
      removePhoto,
      onSubmit,
      onPageFocusIn,
      onPageFocusOut,
      shareViaWebShare,
      closeShareModal
    }
  }
})
</script>

<style scoped>
/* Lenguaje visual plano (estilo Flutter / RN): sin bordes, jerarquía por
   superficie, espacio y tipografía. */
.nr-page {
  --nr-bg: #f4f5f9;
  --nr-surface: #ffffff;
  --nr-track: #eef0f5;
  --nr-track-hover: #e6e9f0;
  --nr-text: #14171f;
  --nr-text-2: #4b5160;
  --nr-muted: #8a90a0;
  --nr-blue: #0a7cff;
  --nr-blue-soft: #e8f1ff;
  --nr-red: #e5484d;
  --nr-red-soft: #fdeeee;
  --nr-green: #1fa463;
  --nr-green-soft: #e6f6ee;
  --nr-radius-xl: 22px;
  --nr-radius: 14px;
  --nr-radius-sm: 10px;
  --nr-shadow: 0 1px 2px rgba(20, 23, 31, 0.04), 0 6px 20px -12px rgba(20, 23, 31, 0.12);

  min-height: 100%;
  padding: 0;
  background: var(--nr-bg);
  color: var(--nr-text);
}

/* Header */
.nr-header {
  position: sticky;
  top: 0;
  z-index: 6;
  padding: 10px 16px 0;
  background: rgba(244, 245, 249, 0.92);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

.nr-header__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  max-width: 820px;
  margin: 0 auto;
}

.nr-header__text {
  flex: 1 1 auto;
  min-width: 0;
}

.nr-back {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--nr-surface);
  color: var(--nr-text);
  box-shadow: var(--nr-shadow);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 0.12s ease;
}

.nr-back:active {
  transform: scale(0.94);
}

.nr-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.nr-subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--nr-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nr-progress-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--nr-blue-soft);
  color: var(--nr-blue);
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.nr-progress-pill--done {
  background: var(--nr-green-soft);
  color: var(--nr-green);
}

.nr-progress {
  max-width: 820px;
  height: 3px;
  margin: 10px auto 0;
  border-radius: 999px;
  background: rgba(20, 23, 31, 0.06);
  overflow: hidden;
}

.nr-progress__bar {
  height: 100%;
  border-radius: inherit;
  background: var(--nr-blue);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Formulario */
.nr-form {
  max-width: 820px;
  margin: 0 auto;
}

.nr-form__body {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 14px 16px 8px;
}

.nr-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nr-group__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 4px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--nr-text);
}

.nr-group__icon {
  flex: none;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #fff;
}

.nr-group__icon--general { background: var(--nr-blue); }
.nr-group__icon--electronics { background: #7c5cff; }
.nr-group__icon--otros { background: #ff9331; }
.nr-group__icon--evidence { background: var(--nr-green); }
.nr-group__icon--notes { background: #64708a; }

.nr-tag {
  margin-left: auto;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--nr-blue-soft);
  color: var(--nr-blue);
  font-size: 0.7rem;
  font-weight: 700;
}

.nr-tag--muted {
  background: var(--nr-track);
  color: var(--nr-muted);
}

.nr-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px;
  background: var(--nr-surface);
  border-radius: var(--nr-radius-xl);
  box-shadow: var(--nr-shadow);
}

.nr-panel--grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

/* Campo */
.nr-field {
  scroll-margin-top: 90px;
  scroll-margin-bottom: max(24px, var(--app-keyboard-inset, 0px));
}

.nr-field[data-field="notas"] {
  scroll-margin-bottom: max(36vh, var(--app-keyboard-inset, 0px));
}

.nr-field--reveal {
  animation: nr-rise 0.25s ease both;
}

.nr-field__label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 8px 2px;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--nr-text-2);
}

.nr-req {
  color: var(--nr-red);
}

.nr-field__check {
  margin-left: auto;
  color: var(--nr-green);
  animation: nr-pop 0.25s ease;
}

.nr-field--error .nr-field__label {
  color: var(--nr-red);
}

.nr-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 6px 2px 0;
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--nr-muted);
}

.nr-hint--error {
  color: var(--nr-red);
  font-weight: 600;
}

/* Píldoras (mismo diseño en todo el formulario) */
.nr-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.nr-pill {
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--nr-track);
  color: var(--nr-text-2);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.nr-pill:active {
  transform: scale(0.96);
}

.nr-pill[aria-checked="true"] {
  background: var(--nr-blue);
  color: #fff;
}

.nr-field--error .nr-pill:not([aria-checked="true"]) {
  background: var(--nr-red-soft);
}

.nr-pill:focus-visible {
  outline: 2px solid var(--nr-blue);
  outline-offset: 2px;
}

/* Inputs Quasar sin borde, con superficie suave. 16px evita zoom en iOS.
   display:flex en el <input> nativo impide escribir en Safari/iOS. */
.nr-input :deep(.q-field__control) {
  min-height: 46px;
  padding: 0 12px;
  border-radius: var(--nr-radius);
  background: var(--nr-track);
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.nr-input :deep(.q-field__control:before),
.nr-input :deep(.q-field__control:after) {
  display: none;
}

.nr-input.q-field--focused :deep(.q-field__control) {
  background: var(--nr-surface);
  box-shadow: 0 0 0 2px rgba(10, 124, 255, 0.35);
}

.nr-input :deep(.q-field__native),
.nr-input :deep(.q-field__input) {
  font-size: 16px;
  font-weight: 500;
  color: var(--nr-text);
  -webkit-user-select: text;
  user-select: text;
}

.nr-input :deep(input.q-field__native) {
  display: block;
  width: 100%;
  min-height: 46px;
  line-height: 1.25;
  padding: 11px 0;
}

.nr-input :deep(.q-field__native span) {
  display: flex;
  align-items: center;
  min-height: 46px;
}

.nr-input :deep(.q-field__native::placeholder),
.nr-input :deep(.q-field__input::placeholder),
.nr-input .nr-placeholder {
  color: var(--nr-muted);
  font-weight: 500;
  opacity: 1;
}

.nr-input :deep(.q-field__prepend),
.nr-input :deep(.q-field__append) {
  height: 46px;
  color: var(--nr-muted);
}

.nr-input.q-field--focused :deep(.q-field__prepend) {
  color: var(--nr-blue);
}

.nr-input--textarea :deep(.q-field__control) {
  padding: 4px 12px;
}

.nr-input--textarea :deep(textarea.q-field__native) {
  display: block;
  width: 100%;
  min-height: 92px;
  line-height: 1.5;
  padding: 10px 0;
}

.nr-field--error .nr-input :deep(.q-field__control) {
  background: var(--nr-red-soft);
}

.nr-static {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 12px;
  border-radius: var(--nr-radius);
  background: var(--nr-track);
  font-size: 16px;
  font-weight: 500;
  color: var(--nr-text);
}

.nr-static__icon {
  color: var(--nr-muted);
}

.nr-static__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nr-static__lock {
  color: #b7bcc8;
}

/* Evidencias */
.nr-evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.nr-evidence__add {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  border: 0;
  border-radius: var(--nr-radius);
  background: var(--nr-track);
  color: var(--nr-text-2);
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.nr-evidence__add:active {
  transform: scale(0.97);
}

.nr-evidence__add:disabled {
  opacity: 0.45;
  cursor: default;
}

.nr-evidence__add.is-error {
  background: var(--nr-red-soft);
  color: var(--nr-red);
}

.nr-evidence__add-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  border-radius: 999px;
  background: var(--nr-surface);
  color: var(--nr-blue);
  box-shadow: var(--nr-shadow);
}

.nr-evidence__add.is-error .nr-evidence__add-icon {
  color: var(--nr-red);
}

.nr-evidence__add-text {
  font-size: 0.86rem;
  font-weight: 600;
}

.nr-evidence__add-sub {
  font-size: 0.72rem;
  color: var(--nr-muted);
}

.nr-evidence__tile {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--nr-radius);
  overflow: hidden;
  background: var(--nr-track);
  animation: nr-rise 0.25s ease both;
}

.nr-evidence__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.nr-evidence__loading {
  z-index: 2;
  background: rgba(255, 255, 255, 0.7);
}

.nr-evidence__badge {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(20, 23, 31, 0.6);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.nr-evidence__delete {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 3;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(20, 23, 31, 0.6);
  color: #fff;
  cursor: pointer;
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.nr-evidence__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 2px 0;
  font-size: 0.72rem;
  color: var(--nr-muted);
}

.nr-evidence__pct {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--nr-green-soft);
  color: var(--nr-green);
  font-weight: 700;
}

/* Barra de guardar: al final del formulario, no flotante */
.nr-submit-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 16px 20px;
  padding: 14px 16px;
  background: var(--nr-surface);
  border-radius: var(--nr-radius-xl);
  box-shadow: var(--nr-shadow);
}

.nr-submit-status {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nr-submit-status .q-icon {
  flex: none;
  color: #ffa726;
}

.nr-submit-status.is-ready .q-icon {
  color: var(--nr-green);
}

.nr-submit-status__title {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--nr-text);
  font-variant-numeric: tabular-nums;
}

.nr-submit-status.is-ready .nr-submit-status__title {
  color: var(--nr-green);
}

.nr-submit-status__caption {
  font-size: 0.72rem;
  line-height: 1.2;
  color: var(--nr-muted);
}

.nr-submit {
  flex: none;
  min-width: 132px;
  height: 46px;
  border-radius: 999px !important;
  background: var(--nr-blue) !important;
  color: #fff !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em;
  box-shadow: 0 8px 20px -8px rgba(10, 124, 255, 0.6) !important;
  touch-action: manipulation;
}

.nr-submit:active {
  transform: translateY(1px) scale(0.985);
}

:global(html.nr-field-editing .nr-form__body),
:global(html.app-keyboard-open .nr-form__body) {
  padding-bottom: max(var(--app-keyboard-inset, 0px), 36vh);
}

/* Bottom sheet de foto */
.photo-sheet {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  border-radius: 24px 24px 0 0;
  background: #fff;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.photo-sheet__grabber {
  width: 38px;
  height: 5px;
  margin: 8px auto 0;
  border-radius: 999px;
  background: #d9dce3;
}

.photo-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 4px 20px;
}

.photo-sheet__title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #14171f;
}

.photo-sheet__close {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #eef0f5;
  color: #64708a;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.photo-sheet__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 8px 16px 16px;
}

.photo-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 18px 12px 16px;
  border: 0;
  border-radius: 18px;
  background: #f4f5f9;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.photo-option:active {
  transform: scale(0.97);
  background: #e9ecf3;
}

.photo-option__icon {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  margin-bottom: 6px;
  border-radius: 999px;
  background: #fff;
  color: #0a7cff;
  box-shadow: 0 1px 2px rgba(20, 23, 31, 0.06);
}

.photo-option__label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #14171f;
}

.photo-option__subtitle {
  font-size: 0.76rem;
  color: #8a90a0;
}

/* Visor de imagen */
.image-modal-card {
  background: rgba(0, 0, 0, 0.96);
}

.image-modal-close {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 12px;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.92) !important;
  color: #14171f !important;
}

.image-modal-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100dvh;
  padding: 0;
}

.full-size-image {
  max-width: 100%;
  max-height: 100dvh;
  object-fit: contain;
}

/* Modal compartir */
.share-modal-card {
  width: 100%;
  max-width: 450px;
  max-height: min(88dvh, 640px);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(20, 23, 31, 0.2);
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: none;
  padding: 16px 12px 8px 20px;
}

.share-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #14171f;
}

.share-modal-title__icon {
  color: #1fa463;
}

.share-modal-copy {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #64708a;
}

.share-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.share-evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.share-evidence-image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
}

.share-evidence-label {
  margin-top: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #8a90a0;
  text-align: center;
}

.share-modal-actions {
  flex: none;
  padding: 8px 20px calc(16px + env(safe-area-inset-bottom, 0px));
}

.share-btn {
  width: 100%;
  min-height: 46px;
  border-radius: 999px;
  font-weight: 700;
}

.share-btn-native {
  background: #0a7cff !important;
  color: #fff !important;
}

.share-btn-cancel {
  margin-top: 6px;
  color: #64708a !important;
}

/* Animaciones */
@keyframes nr-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes nr-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (hover: hover) and (pointer: fine) {
  .nr-pill:hover:not([aria-checked="true"]),
  .nr-evidence__add:hover:not(:disabled) {
    background: var(--nr-track-hover);
  }

  .photo-option:hover {
    background: #e9ecf3;
  }
}

/* Breakpoints */
@media (min-width: 600px) {
  .nr-panel--grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 24px;
  }
}

@media (min-width: 1024px) {
  .nr-page {
    padding-bottom: 32px;
  }

  .nr-header {
    position: static;
    background: transparent;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    padding-top: 18px;
  }

  .nr-title {
    font-size: 1.4rem;
  }

  .nr-submit-bar {
    margin: 8px 16px 24px;
  }

  .nr-submit {
    min-width: 200px;
  }
}

@media (max-width: 380px) {
  .nr-form__body {
    padding: 12px 12px 8px;
  }

  .nr-panel {
    padding: 14px;
  }

  .nr-submit {
    min-width: 118px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nr-field--reveal,
  .nr-evidence__tile,
  .nr-field__check {
    animation: none;
  }

  .nr-progress__bar,
  .nr-pill {
    transition: none;
  }
}
</style>
