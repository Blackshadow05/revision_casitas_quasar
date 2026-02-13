<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" color="grey-8" @click="goBack" />
      <div class="text-h5 q-ml-sm" style="color: #424242;">Nueva Revisión</div>
    </div>

    <q-form @submit="onSubmit" class="q-gutter-y-lg">
      <!-- Casita and Quien Revisa -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
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
            :rules="[val => !!val || 'Campo requerido']"
          />
        </div>
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors.quien_revisa }">Quién Revisa <span class="required-asterisk">*</span></div>
          <q-select
            v-model="form.quien_revisa"
            :options="users"
            outlined
            dense
            bg-color="white"
            class="input-styled"
            :class="{ 'error-field': validationErrors.quien_revisa }"
            behavior="menu"
            :disable="!!authStore.user"
            :rules="[val => !!val || 'Campo requerido']"
          />
        </div>
      </div>

      <!-- Caja fuerte -->
      <div class="section-container" :class="{ 'error-section': validationErrors.caja_fuerte }">
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
            :class="{ 'selected': form.caja_fuerte === option }"
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
      <div class="section-container" :class="{ 'error-section': validationErrors.puertas_ventanas }">
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

      <!-- Electrónicos Category -->
      <div class="category-header">
        <q-icon name="devices" />
        <span class="category-title">Electrónicos</span>
      </div>

      <!-- Chromecast -->
      <div class="section-container" :class="{ 'error-section': validationErrors.chromecast }">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.chromecast }">
          Chromecast <span class="required-asterisk">*</span>
        </div>
        <div class="button-grid">
          <q-btn
            v-for="option in ['0', '01', '02', '03', '04']"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            style="min-width: 50px;"
            :class="{ 'selected': form.chromecast === option }"
            @click="form.chromecast = option"
          />
        </div>
      </div>

      <!-- Speaker -->
      <div class="section-container" :class="{ 'error-section': validationErrors.speaker }">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.speaker }">Speaker <span class="required-asterisk">*</span></div>
        <div class="button-grid">
          <q-btn
            v-for="option in ['0', '01', '02', '03']"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            :class="{ 'selected': form.speaker === option }"
            @click="form.speaker = option"
          />
        </div>
      </div>

      <!-- USB Speaker -->
      <div class="section-container" :class="{ 'error-section': validationErrors.usb_speaker }">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.usb_speaker }">USB Speaker <span class="required-asterisk">*</span></div>
        <div class="button-grid">
          <q-btn
            v-for="option in ['0', '01', '02', '03']"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            :class="{ 'selected': form.usb_speaker === option }"
            @click="form.usb_speaker = option"
          />
        </div>
      </div>

      <!-- Controles TV -->
      <div class="section-container" :class="{ 'error-section': validationErrors.controles_tv }">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.controles_tv }">Controles TV <span class="required-asterisk">*</span></div>
        <div class="button-grid">
          <q-btn
            v-for="option in ['0', '01', '02', '03']"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            :class="{ 'selected': form.controles_tv === option }"
            @click="form.controles_tv = option"
          />
        </div>
      </div>

      <!-- Otros Items header -->
      <div class="category-header" style="background: #fff3e0; color: #ef6c00;">
        <q-icon name="category" />
        <span class="category-title">Otros Artículos</span>
      </div>

      <!-- Binoculares -->
      <div class="section-container" :class="{ 'error-section': validationErrors.binoculares }">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.binoculares }">
          <q-icon name="visibility" color="grey-7" class="q-mr-sm" size="20px" />
          Binoculares <span class="required-asterisk">*</span>
        </div>
        <div class="button-grid">
          <q-btn
            v-for="option in ['0', '01', '02', '03']"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            :class="{ 'selected': form.binoculares === option }"
            @click="form.binoculares = option"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md" :class="{ 'error-row': validationErrors.trapo_binoculares || validationErrors.bolsa_vapor }">
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.trapo_binoculares }">Trapo para binoculares <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['Si', 'No']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.trapo_binoculares === option }"
              @click="form.trapo_binoculares = option"
            />
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.bolsa_vapor }">Bolsa Vapor <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['Si', 'No']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.bolsa_vapor === option }"
              @click="form.bolsa_vapor = option"
            />
          </div>
        </div>
      </div>

      <!-- Secadora & Steamer -->
      <div class="row q-col-gutter-md" :class="{ 'error-row': validationErrors.secadora || validationErrors.steamer }">
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.secadora }">Secadora <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['0', '01', '02', '03']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.secadora === option }"
              @click="form.secadora = option"
            />
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.steamer }">Steamer <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['0', '01', '02', '03']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.steamer === option }"
              @click="form.steamer = option"
            />
          </div>
        </div>
      </div>

      <!-- Accesorios Secadora -->
      <div class="section-container" :class="{ 'error-section': validationErrors.accesorios_secadora }">
        <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.accesorios_secadora }">Accesorios Secadora <span class="required-asterisk">*</span></div>
        <div class="button-grid">
          <q-btn
            v-for="option in ['0', '01', '02', '03', '04', '05', '06', '07', '08']"
            :key="option"
            :label="option"
            unelevated
            class="custom-select-btn option-btn"
            style="min-width: 45px;"
            :class="{ 'selected': form.accesorios_secadora === option }"
            @click="form.accesorios_secadora = option"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md" :class="{ 'error-row': validationErrors.plancha_cabello || validationErrors.cola_caballo }">
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.plancha_cabello }">Plancha Cabello <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['0', '01', '02']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.plancha_cabello === option }"
              @click="form.plancha_cabello = option"
            />
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.cola_caballo }">Cola Caballo <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['Si', 'No']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.cola_caballo === option }"
              @click="form.cola_caballo = option"
            />
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md" :class="{ 'error-row': validationErrors.bulto || validationErrors.sombrero }">
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.bulto }">Bulto <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['Si', 'No']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.bulto === option }"
              @click="form.bulto = option"
            />
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.sombrero }">Sombrero <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['Si', 'No']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.sombrero === option }"
              @click="form.sombrero = option"
            />
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md" :class="{ 'error-row': validationErrors.bolso_yute || validationErrors.camas_ordenadas }">
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.bolso_yute }">Bolso Yute <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['0', '01', '02', '03']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.bolso_yute === option }"
              @click="form.bolso_yute = option"
            />
          </div>
        </div>
        <div class="col-12 col-sm-6">
          <div class="section-label q-mb-md" :class="{ 'error-label': validationErrors.camas_ordenadas }">Camas Ordenadas <span class="required-asterisk">*</span></div>
          <div class="button-grid">
            <q-btn
              v-for="option in ['Si', 'No']"
              :key="option"
              :label="option"
              unelevated
              class="custom-select-btn option-btn"
              :class="{ 'selected': form.camas_ordenadas === option }"
              @click="form.camas_ordenadas = option"
            />
          </div>
        </div>
      </div>

      <!-- Evidencias -->
      <div v-if="showEvidencias">
        <div class="category-header" style="background: #f1f8e9; color: #33691e;">
          <q-icon name="photo_camera" />
          <span class="category-title">Evidencia Fotográfica</span>
          <q-badge v-if="evidencia1Required" color="primary" class="q-ml-sm" style="font-size: 0.8rem;">Evidencia 1 obligatoria</q-badge>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors.evidencia_01 }">Evidencia 1 <span class="required-asterisk" v-if="evidencia1Required">*</span></div>
            <q-btn
              v-if="!form.evidencia_01"
              label="Agregar Foto"
              icon="add_a_photo"
              unelevated
              class="full-width photo-btn"
              :class="{ 'error-photo': validationErrors.evidencia_01 }"
              :disable="evidencia1Disabled"
              @click="openPhotoSheet('evidencia_01')"
            />
            <div v-else>
              <div class="photo-preview-container">
                <img :src="getPreviewUrl(form.evidencia_01)" class="photo-preview" @click="openImageModal(getPreviewUrl(form.evidencia_01))" />
                <q-btn
                  icon="delete"
                  round
                  size="sm"
                  color="negative"
                  class="delete-photo-btn"
                  @click="removePhoto('evidencia_01')"
                />
              </div>
              <div v-if="compressionInfo.evidencia_01" class="compression-info">
                <div class="compression-row">
                  <span class="text-grey-7">-</span>
                  <span class="text-negative">{{ compressionInfo.evidencia_01.originalSize }}</span>
                  <q-icon name="arrow_forward" size="12px" color="grey-5" />
                  <span class="text-positive">{{ compressionInfo.evidencia_01.compressedSize }}</span>
                  <span class="text-primary">({{ compressionInfo.evidencia_01.reduction }}%)</span>
                </div>
                <div class="compression-row">
                  <span class="text-grey-7">-</span>
                  <span class="text-body2">{{ compressionInfo.evidencia_01.format }}</span>
                  <span class="text-grey-5 q-ml-xs">{{ compressionInfo.evidencia_01.originalDimensions }} → {{ compressionInfo.evidencia_01.compressedDimensions }}</span>
                </div>
              </div>
            </div>
            <q-file
              ref="fileEvidencia01"
              v-model="form.evidencia_01"
              label=""
              outlined
              dense
              bg-color="white"
              class="input-styled q-mt-xs"
              accept="image/*"
              :rules="evidencia1Required ? [val => !!val || 'Evidencia requerida'] : []"
              style="display: none;"
            />
          </div>
        <div class="col-12 col-sm-4" v-if="showEvidencia2">
          <div class="section-label q-mb-xs" :class="{ 'error-label': validationErrors.evidencia_02 }">Evidencia 2 <span class="required-asterisk" v-if="evidencia2Required">*</span></div>
          <q-btn
            v-if="!form.evidencia_02"
            label="Agregar Foto"
            icon="add_a_photo"
            unelevated
            class="full-width photo-btn"
            :class="{ 'error-photo': validationErrors.evidencia_02 }"
            :disable="evidencia2Disabled"
            @click="openPhotoSheet('evidencia_02')"
          />
          <div v-else>
            <div class="photo-preview-container">
              <img :src="getPreviewUrl(form.evidencia_02)" class="photo-preview" @click="openImageModal(getPreviewUrl(form.evidencia_02))" />
              <q-btn
                icon="delete"
                round
                size="sm"
                color="negative"
                class="delete-photo-btn"
                @click="removePhoto('evidencia_02')"
              />
            </div>
            <div v-if="compressionInfo.evidencia_02" class="compression-info">
              <div class="compression-row">
                <span class="text-grey-7">-</span>
                <span class="text-negative">{{ compressionInfo.evidencia_02.originalSize }}</span>
                <q-icon name="arrow_forward" size="12px" color="grey-5" />
                <span class="text-positive">{{ compressionInfo.evidencia_02.compressedSize }}</span>
                <span class="text-primary">({{ compressionInfo.evidencia_02.reduction }}%)</span>
              </div>
              <div class="compression-row">
                <span class="text-grey-7">-</span>
                <span class="text-body2">{{ compressionInfo.evidencia_02.format }}</span>
                <span class="text-grey-5 q-ml-xs">{{ compressionInfo.evidencia_02.originalDimensions }} → {{ compressionInfo.evidencia_02.compressedDimensions }}</span>
              </div>
            </div>
          </div>
          <q-file
            ref="fileEvidencia02"
            v-model="form.evidencia_02"
            label=""
            outlined
            dense
            bg-color="white"
            class="input-styled q-mt-xs"
            accept="image/*"
            :rules="evidencia2Required ? [val => !!val || 'Evidencia requerida'] : []"
            style="display: none;"
          />
        </div>
        <div class="col-12 col-sm-4" v-if="showEvidencia3">
          <div class="section-label q-mb-xs">Evidencia 3</div>
          <q-btn
            v-if="!form.evidencia_03"
            label="Agregar Foto"
            icon="add_a_photo"
            unelevated
            class="full-width photo-btn"
            :disable="evidencia3Disabled"
            @click="openPhotoSheet('evidencia_03')"
          />
          <div v-else>
            <div class="photo-preview-container">
              <img :src="getPreviewUrl(form.evidencia_03)" class="photo-preview" @click="openImageModal(getPreviewUrl(form.evidencia_03))" />
              <q-btn
                icon="delete"
                round
                size="sm"
                color="negative"
                class="delete-photo-btn"
                @click="removePhoto('evidencia_03')"
              />
            </div>
            <div v-if="compressionInfo.evidencia_03" class="compression-info">
              <div class="compression-row">
                <span class="text-grey-7">-</span>
                <span class="text-negative">{{ compressionInfo.evidencia_03.originalSize }}</span>
                <q-icon name="arrow_forward" size="12px" color="grey-5" />
                <span class="text-positive">{{ compressionInfo.evidencia_03.compressedSize }}</span>
                <span class="text-primary">({{ compressionInfo.evidencia_03.reduction }}%)</span>
              </div>
              <div class="compression-row">
                <span class="text-grey-7">-</span>
                <span class="text-body2">{{ compressionInfo.evidencia_03.format }}</span>
                <span class="text-grey-5 q-ml-xs">{{ compressionInfo.evidencia_03.originalDimensions }} → {{ compressionInfo.evidencia_03.compressedDimensions }}</span>
              </div>
            </div>
          </div>
          <q-file
            ref="fileEvidencia03"
            v-model="form.evidencia_03"
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
      </div>
    </q-form>
  </q-page>

  <!-- Bottom Sheet for Photo Selection -->
  <q-dialog v-model="photoSheetOpen" position="bottom">
    <q-card class="photo-bottom-sheet">
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
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'

export default defineComponent({
  name: 'NewRevisionPage',
  setup () {
    const router = useRouter()
    const store = useCasasStore()
    const authStore = useAuthStore()
    const loading = ref(false)
    const users = ref([])
    const photoSheetOpen = ref(false)
    const formSubmitted = ref(false)
    const currentPhotoField = ref('')
    const fileEvidencia01 = ref(null)
    const fileEvidencia02 = ref(null)
    const fileEvidencia03 = ref(null)
    const imageModalOpen = ref(false)
    const modalImageUrl = ref('')

    // Generate casita options 1-50
    const casitaOptions = Array.from({ length: 50 }, (_, i) => (i + 1).toString())

    // Caja fuerte options
    const cajaFuerteOptions = [
      'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell',
      'Back to Back', 'Show Room', 'Room Move'
    ]

    // Form data
    const form = ref({
      casita: '',
      quien_revisa: '',
      caja_fuerte: '',
      room_move: '',
      puertas_ventanas: '',
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

    // Computed properties for required evidencias
    const evidencia1Required = computed(() => {
      return form.value.caja_fuerte === 'Check in' || form.value.caja_fuerte === 'Upsell'
    })

    const evidencia2Required = computed(() => {
      return form.value.caja_fuerte === 'Check out' || form.value.caja_fuerte === 'Guardar Upsell'
    })

    const showEvidencias = computed(() => {
      return ['Check in', 'Upsell', 'Back to Back', 'Check out', 'Guardar Upsell', 'Room Move', 'Show Room'].includes(form.value.caja_fuerte)
    })

    const showEvidencia1 = computed(() => {
      return showEvidencias.value
    })

    const showEvidencia2 = computed(() => {
      if (!showEvidencias.value) return false
      if (['Check out', 'Guardar Upsell'].includes(form.value.caja_fuerte)) return false
      return ['Check in', 'Upsell', 'Room Move', 'Show Room', 'Back to Back'].includes(form.value.caja_fuerte) && !!form.value.evidencia_01
    })

    const showEvidencia3 = computed(() => {
      if (!showEvidencias.value) return false
      if (['Check out', 'Guardar Upsell'].includes(form.value.caja_fuerte)) return false
      return ['Check in', 'Upsell', 'Room Move', 'Show Room', 'Back to Back'].includes(form.value.caja_fuerte) && !!form.value.evidencia_01 && !!form.value.evidencia_02
    })

    const evidencia1Disabled = computed(() => {
      return false
    })

    const evidencia2Disabled = computed(() => {
      return !form.value.evidencia_01
    })

    const evidencia3Disabled = computed(() => {
      return !form.value.evidencia_02
    })

    // Validation errors for required fields
    const validationErrors = computed(() => {
      const errors = {
        casita: false,
        quien_revisa: false,
        caja_fuerte: false,
        puertas_ventanas: false,
        chromecast: false,
        speaker: false,
        usb_speaker: false,
        controles_tv: false,
        binoculares: false,
        trapo_binoculares: false,
        bolsa_vapor: false,
        secadora: false,
        steamer: false,
        accesorios_secadora: false,
        plancha_cabello: false,
        cola_caballo: false,
        bulto: false,
        sombrero: false,
        bolso_yute: false,
        camas_ordenadas: false,
        evidencia_01: false,
        evidencia_02: false
      }
      
      if (formSubmitted.value) {
        errors.casita = !form.value.casita
        errors.quien_revisa = !form.value.quien_revisa
        errors.caja_fuerte = !form.value.caja_fuerte
        errors.puertas_ventanas = !form.value.puertas_ventanas
        errors.chromecast = !form.value.chromecast
        errors.speaker = !form.value.speaker
        errors.usb_speaker = !form.value.usb_speaker
        errors.controles_tv = !form.value.controles_tv
        errors.binoculares = !form.value.binoculares
        errors.trapo_binoculares = !form.value.trapo_binoculares
        errors.bolsa_vapor = !form.value.bolsa_vapor
        errors.secadora = !form.value.secadora
        errors.steamer = !form.value.steamer
        errors.accesorios_secadora = !form.value.accesorios_secadora
        errors.plancha_cabello = !form.value.plancha_cabello
        errors.cola_caballo = !form.value.cola_caballo
        errors.bulto = !form.value.bulto
        errors.sombrero = !form.value.sombrero
        errors.bolso_yute = !form.value.bolso_yute
        errors.camas_ordenadas = !form.value.camas_ordenadas
        errors.evidencia_01 = evidencia1Required.value && !form.value.evidencia_01
        errors.evidencia_02 = evidencia2Required.value && !form.value.evidencia_02
      }
      
      return errors
    })

    // Load users from Supabase
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('Usuarios')
          .select('Usuario')
          .order('Usuario')
        
        if (error) {
          console.error('Error loading users:', error)
          return
        }
        
        users.value = data.map(user => user.Usuario) || []
        
        // Set current logged in user automatically
        if (authStore.user && authStore.user.Usuario) {
          form.value.quien_revisa = authStore.user.Usuario
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    const compressionInfo = ref({
      evidencia_01: null,
      evidencia_02: null,
      evidencia_03: null
    })

    const getCompressionConfig = () => {
      return isIOS ? {
        targetSizeKB: 600,
        maxResolution: 1000,
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

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const compressImage = async (file, field) => {
      const config = getCompressionConfig()
      const originalSize = file.size
      const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
      
      return new Promise(async (resolve, reject) => {
        try {
          console.log(`[Compression] Starting normalization for ${field} (iOS optimization)...`)
          
          // 1. Load Image
          const img = new Image()
          const url = URL.createObjectURL(file)
          await new Promise((res, rej) => {
            img.onload = res
            img.onerror = rej
            img.src = url
          })

          if ('decode' in img) await img.decode()

          // 2. NORMALIZATION STAGE (FORCED DECODE FIX)
          // Reemplazo de nCtx.drawImage(img, 0, 0) para forzar a WebKit a decodificar HEIC
          const decodeSafely = async (file, img) => {
            if ('createImageBitmap' in window) {
              try {
                // Truco: convertir a blob intermedio obliga a WebKit a terminar el decode
                const tempUrl = URL.createObjectURL(file)
                const tempBlob = await fetch(tempUrl).then(r => r.blob())
                URL.revokeObjectURL(tempUrl)
                return await createImageBitmap(tempBlob)
              } catch (e) {
                console.warn('[Compression] createImageBitmap failed, fallback to img', e)
              }
            }
            return img
          }

          const normalizeCanvas = document.createElement('canvas')
          normalizeCanvas.width = img.width
          normalizeCanvas.height = img.height
          
          const nCtx = normalizeCanvas.getContext('2d', { 
            willReadFrequently: true,
            alpha: false 
          })
          
          if (!nCtx) throw new Error('Could not get normalization context')

          // Normalize background
          nCtx.fillStyle = '#FFFFFF'
          nCtx.fillRect(0, 0, normalizeCanvas.width, normalizeCanvas.height)
          
          // FORCED DECODE DRAWING
          const source = await decodeSafely(file, img)
          nCtx.drawImage(source, 0, 0)
          
          // Liberar bitmap si se usó uno
          if (source instanceof ImageBitmap) {
            source.close()
          }

          // 3. RESIZING STAGES (Conservative Step-Down)
          let width = img.width
          let height = img.height
          
          let currentCanvas = normalizeCanvas

          while (width > config.maxResolution * 1.5) {
            const nextWidth = Math.floor(width / 2)
            const nextHeight = Math.floor(height / 2)
            
            const nextCanvas = document.createElement('canvas')
            const nextCtx = nextCanvas.getContext('2d', { alpha: false, style: 'image-rendering: crisp-edges;' })
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
            console.log(`[Compression] Resizing step: ${width}x${height}`)
          }

          // 4. PRECISE FINAL SCALE
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

          // Cleanup
          URL.revokeObjectURL(url)
          if (currentCanvas !== normalizeCanvas) {
            currentCanvas.width = 0
            currentCanvas.height = 0
          }
          normalizeCanvas.width = 0
          normalizeCanvas.height = 0

          // 5. ITERATIVE BLOB GENERATION
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
                const finalFile = new File([blob], `normalized.jpg`, { type: 'image/jpeg' })
                
                compressionInfo.value[field] = {
                  originalSize: formatBytes(originalSize),
                  compressedSize: formatBytes(finalFile.size),
                  reduction: Math.round(((originalSize - finalFile.size) / originalSize) * 100),
                  format: 'JPEG',
                  originalDimensions: `${img.width}x${img.height}`,
                  compressedDimensions: `${targetW}x${targetH}`
                }
                
                finalCanvas.width = 0
                finalCanvas.height = 0
                resolve(finalFile)
              } else {
                quality -= 0.05
                attempts++
                generateBlob()
              }
            }, 'image/jpeg', quality)
          }

          generateBlob()
        } catch (error) {
          console.error(`[Compression] iOS Normalization Failed:`, error)
          reject(error)
        }
      })
    }

    const getMonthFolder = () => {
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      const now = new Date()
      return `${months[now.getMonth()]} ${now.getFullYear()}`
    }

    const uploadImageToCloudinary = async (file, field) => {
      if (!file) {
        console.log(`[Cloudinary] No file provided for field: ${field}`)
        return null
      }

      try {
        console.log(`[Cloudinary] Starting upload for ${field}. File size: ${formatBytes(file.size)}`)
        const monthFolder = getMonthFolder()
        const timestamp = Date.now()
        // Si el campo es 'evidencia_01', extraemos '01', si no usamos el nombre completo
        const n = field.startsWith('evidencia_') ? field.split('_')[1] : field
        const publicId = `evidencia_${n}_${timestamp}`
        const folderPath = `Evidencias/${monthFolder}`

        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
        formData.append('folder', folderPath)
        formData.append('public_id', publicId)
        formData.append('quality', 'auto:good')
        formData.append('fetch_format', 'auto')

        console.log(`[Cloudinary] Upload URL: ${CLOUDINARY_CONFIG.uploadUrl(CLOUDINARY_CONFIG.cloudName)}`)
        console.log(`[Cloudinary] Upload Preset: ${CLOUDINARY_CONFIG.uploadPreset}`)
        console.log(`[Cloudinary] Public ID: ${publicId}`)

        const response = await fetch(CLOUDINARY_CONFIG.uploadUrl(CLOUDINARY_CONFIG.cloudName), {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`[Cloudinary] Upload failed for ${field}:`, response.status, errorData)
          throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`)
        }

        const responseData = await response.json()
        console.log(`[Cloudinary] Upload success for ${field}:`, responseData.secure_url)
        
        // Devolvemos la ruta relativa como solicitaste: Evidencias/[Mes Año]/evidencia_[N]_[timestamp]
        return `${folderPath}/${publicId}`
      } catch (error) {
        console.error(`[Cloudinary] Error uploading ${field}:`, error)
        return null
      }
    }

    const goBack = () => {
      router.back()
    }

    const openPhotoSheet = (field) => {
      currentPhotoField.value = field
      photoSheetOpen.value = true
    }

    const selectPhotoSource = (source) => {
      photoSheetOpen.value = false
      setTimeout(() => {
        capturePhoto(currentPhotoField.value, source)
      }, 300)
    }

    const capturePhoto = (field, source) => {
      let fileInputRef = null
      
      if (field === 'evidencia_01') {
        fileInputRef = fileEvidencia01.value
      } else if (field === 'evidencia_02') {
        fileInputRef = fileEvidencia02.value
      } else if (field === 'evidencia_03') {
        fileInputRef = fileEvidencia03.value
      }
      
      if (fileInputRef && fileInputRef.$el) {
        const fileInput = fileInputRef.$el.querySelector('input[type="file"]')
        if (fileInput) {
          if (source === 'camera') {
            fileInput.setAttribute('capture', 'environment')
          } else {
            fileInput.removeAttribute('capture')
          }
          fileInput.click()
        }
      }
    }

    const getPreviewUrl = (file) => {
      if (!file) return ''
      if (typeof file === 'string') return file
      return URL.createObjectURL(file)
    }

    const openImageModal = (url) => {
      modalImageUrl.value = url
      imageModalOpen.value = true
    }

    const removePhoto = (field) => {
      if (field === 'evidencia_01') {
        form.value.evidencia_01 = null
        compressionInfo.value.evidencia_01 = null
      } else if (field === 'evidencia_02') {
        form.value.evidencia_02 = null
        compressionInfo.value.evidencia_02 = null
      } else if (field === 'evidencia_03') {
        form.value.evidencia_03 = null
        compressionInfo.value.evidencia_03 = null
      }
    }

    const onSubmit = async () => {
      // Mark form as submitted to show validation errors
      formSubmitted.value = true
      
      // Check for validation errors
      const hasErrors = Object.values(validationErrors.value).some(error => error)
      
      if (hasErrors) {
        console.log('[NewRevisionPage] Validation errors detected')
        return
      }
      
      loading.value = true
      try {
        console.log('[NewRevisionPage] Iniciando onSubmit')
        console.log('[NewRevisionPage] Valores del formulario:', form.value)
        
        // Upload images if present
        const evidencia01Url = form.value.evidencia_01 ?
          await uploadImageToCloudinary(form.value.evidencia_01, 'evidencia_01') : null
        const evidencia02Url = form.value.evidencia_02 ?
          await uploadImageToCloudinary(form.value.evidencia_02, 'evidencia_02') : null
        const evidencia03Url = form.value.evidencia_03 ?
          await uploadImageToCloudinary(form.value.evidencia_03, 'evidencia_03') : null
        
        // Set created_at to local device time without timezone
        const now = new Date()
        const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ')
        
        const newRevision = {
          casita: form.value.casita,
          quien_revisa: form.value.quien_revisa,
          caja_fuerte: form.value.caja_fuerte,
          room_move: form.value.room_move,
          puertas_ventanas: form.value.puertas_ventanas,
          chromecast: form.value.chromecast,
          binoculares: form.value.binoculares,
          trapo_binoculares: form.value.trapo_binoculares,
          speaker: form.value.speaker,
          usb_speaker: form.value.usb_speaker,
          controles_tv: form.value.controles_tv,
          secadora: form.value.secadora,
          accesorios_secadora: form.value.accesorios_secadora,
          steamer: form.value.steamer,
          bolsa_vapor: form.value.bolsa_vapor,
          plancha_cabello: form.value.plancha_cabello,
          cola_caballo: form.value.cola_caballo,
          bulto: form.value.bulto,
          sombrero: form.value.sombrero,
          bolso_yute: form.value.bolso_yute,
          camas_ordenadas: form.value.camas_ordenadas,
          evidencia_01: evidencia01Url,
          evidencia_02: evidencia02Url,
          evidencia_03: evidencia03Url,
          notas: form.value.notas,
          created_at: localTime
        }
        
        console.log('[NewRevisionPage] Datos a enviar a Supabase:', newRevision)

        const result = await store.addCasa(newRevision)
        
        console.log('[NewRevisionPage] Resultado de addCasa:', result)
        
        if (result.success) {
          console.log('[NewRevisionPage] Revisión guardada exitosamente')
          // Reset form
          form.value = {
            casita: '',
            quien_revisa: users.value.length === 1 ? users.value[0] : '',
            caja_fuerte: '',
            room_move: '',
            puertas_ventanas: '',
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
          }
          
          compressionInfo.value = {
            evidencia_01: null,
            evidencia_02: null,
            evidencia_03: null
          }
          
          router.back()
        } else {
          console.error('[NewRevisionPage] Error al guardar:', result.error)
        }
      } catch (error) {
        console.error('[NewRevisionPage] Error saving revision:', error)
      } finally {
        loading.value = false
      }
    }

    // Load users on mount
    onMounted(() => {
      loadUsers()
    })

    // Watchers to compress images when files are selected
    watch(() => form.value.evidencia_01, async (newFile) => {
      if (newFile && typeof newFile !== 'string' && !newFile._isCompressed) {
        console.log('[Watcher] New file detected for evidencia_01, starting compression...')
        try {
          const compressed = await compressImage(newFile, 'evidencia_01')
          if (compressed) {
            compressed._isCompressed = true
            form.value.evidencia_01 = compressed
            console.log('[Watcher] evidencia_01 updated with compressed version')
          }
        } catch (e) {
          console.error('[Watcher] Compression failed for evidencia_01:', e)
        }
      }
    })

    watch(() => form.value.evidencia_02, async (newFile) => {
      if (newFile && typeof newFile !== 'string' && !newFile._isCompressed) {
        console.log('[Watcher] New file detected for evidencia_02, starting compression...')
        try {
          const compressed = await compressImage(newFile, 'evidencia_02')
          if (compressed) {
            compressed._isCompressed = true
            form.value.evidencia_02 = compressed
            console.log('[Watcher] evidencia_02 updated with compressed version')
          }
        } catch (e) {
          console.error('[Watcher] Compression failed for evidencia_02:', e)
        }
      }
    })

    watch(() => form.value.evidencia_03, async (newFile) => {
      if (newFile && typeof newFile !== 'string' && !newFile._isCompressed) {
        console.log('[Watcher] New file detected for evidencia_03, starting compression...')
        try {
          const compressed = await compressImage(newFile, 'evidencia_03')
          if (compressed) {
            compressed._isCompressed = true
            form.value.evidencia_03 = compressed
            console.log('[Watcher] evidencia_03 updated with compressed version')
          }
        } catch (e) {
          console.error('[Watcher] Compression failed for evidencia_03:', e)
        }
      }
    })

    return {
      form,
      loading,
      users,
      casitaOptions,
      cajaFuerteOptions,
      authStore,
      evidencia1Required,
      evidencia2Required,
      showEvidencias,
      showEvidencia1,
      showEvidencia2,
      showEvidencia3,
      evidencia1Disabled,
      evidencia2Disabled,
      evidencia3Disabled,
      photoSheetOpen,
      currentPhotoField,
      fileEvidencia01,
      fileEvidencia02,
      fileEvidencia03,
      imageModalOpen,
      modalImageUrl,
      compressionInfo,
      formatBytes,
      formSubmitted,
      validationErrors,
      goBack,
      openPhotoSheet,
      selectPhotoSource,
      capturePhoto,
      getPreviewUrl,
      openImageModal,
      removePhoto,
      onSubmit
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
  font-size: 1rem;
  font-weight: 600;
  color: #424242;
  display: flex;
  align-items: center;
}

.required-asterisk {
  color: #ef5350;
  margin-left: 4px;
  font-weight: bold;
}

.error-label {
  color: #d32f2f !important;
}

.error-section {
  background: rgba(211, 47, 47, 0.08);
  border-radius: 12px;
  padding: 12px;
  margin-left: -12px;
  margin-right: -12px;
  border: 2px solid #d32f2f;
}

.error-field :deep(.q-field__control) {
  border: 2px solid #d32f2f !important;
  box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.2) !important;
}

.error-row {
  background: rgba(211, 47, 47, 0.08);
  border-radius: 12px;
  padding: 12px;
  margin-left: -12px;
  margin-right: -12px;
  border: 2px solid #d32f2f;
}

.custom-select-btn {
  background: white !important;
  color: #616161 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  border: 1px solid transparent !important;
  text-transform: none !important;
  font-weight: 500 !important;
  padding: 8px 16px !important;
  min-height: 44px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-select-btn:active {
  transform: scale(0.95);
}

.custom-select-btn.selected {
  /* Design choice: use a subtle border or background for selected state */
  border: 1px solid #4CAF50 !important;
  color: #4CAF50 !important;
  box-shadow: 0 10px 15px -3px rgba(76, 175, 80, 0.1), 0 4px 6px -2px rgba(76, 175, 80, 0.05) !important;
}

.section-container {
  background: transparent;
  margin-bottom: 24px;
}

.category-header {
  background: #e3f2fd;
  border-radius: 12px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  color: #1976d2;
  margin-bottom: 16px;
  margin-top: 8px;
}

.category-header q-icon {
  font-size: 20px;
}

.category-title {
  font-weight: 700;
  margin-left: 8px;
  font-size: 1.1rem;
}

.input-styled :deep(.q-field__control) {
  background: white !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;
  border-radius: 12px !important;
}

.input-styled :deep(.q-field__marginal) {
  color: #757575;
}

.submit-btn {
  background: #4CAF50 !important;
  color: white !important;
  border-radius: 16px !important;
  padding: 12px !important;
  font-weight: 700 !important;
  font-size: 1.1rem !important;
  box-shadow: 0 4px 14px 0 rgba(76, 175, 80, 0.39) !important;
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

.photo-btn {
  background: #f5f5f5 !important;
  color: #616161 !important;
  border-radius: 12px !important;
  border: 1px dashed #bdbdbd !important;
  text-transform: none !important;
  font-weight: 500 !important;
  padding: 12px 16px !important;
  min-height: 48px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.photo-btn.error-photo {
  border: 2px solid #d32f2f !important;
  background: rgba(211, 47, 47, 0.05) !important;
}

.photo-btn:active {
  transform: scale(0.95);
}

.photo-options-container {
  padding: 16px;
  background: white;
  border-radius: 16px 16px 0 0;
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
  width: 100%;
  padding-top: 60%;
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

.delete-photo-btn {
  position: absolute !important;
  top: 8px;
  right: 8px;
  z-index: 1;
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
}
</style>