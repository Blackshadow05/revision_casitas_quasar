<template>
  <q-page class="bg-grey-1">
    <!-- Image Slider at the top (Optional, but useful) -->
    <div v-if="images.length > 0" class="image-header">
      <q-carousel
        animated
        v-model="slide"
        infinite
        arrows
        navigation
        height="250px"
        class="bg-transparent"
      >
        <q-carousel-slide 
          v-for="(img, index) in images" 
          :key="index" 
          :name="index" 
          :img-src="img" 
          @click="onOpenImage(index)"
          class="rounded-header-img"
        />
      </q-carousel>
      <!-- Back Button Floating -->
      <q-btn 
        flat round dense 
        icon="arrow_back" 
        class="absolute-top-left q-ma-md bg-white-glass shadow-5" 
        @click="$router.back()" 
      />
    </div>

    <!-- Main Content following the Image Design -->
    <div v-if="casa" class="content-container" :class="[themeClass, { 'no-images-margin': images.length === 0 }]">
      
      <!-- EDIT MODE FORM -->
      <div v-if="isEditing" class="edit-form-container q-pa-md">
        <!-- Header -->
        <div class="row items-center q-mb-lg">
          <q-btn flat round icon="arrow_back" color="grey-8" @click="cancelEditing" />
          <div class="text-h6 q-ml-sm" style="color: #424242;">Editar Revisión</div>
        </div>

        <q-form @submit="saveEditing" class="q-gutter-y-md">
          <!-- Casita and Quien Revisa -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-xs">Casita <span class="required-asterisk">*</span></div>
              <q-select
                v-model="editForm.casita"
                :options="casitaOptions"
                outlined
                dense
                bg-color="white"
                class="input-styled"
                behavior="menu"
                :rules="[val => !!val || 'Campo requerido']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-xs">Quién Revisa <span class="required-asterisk">*</span></div>
              <q-input
                v-model="editForm.quien_revisa"
                outlined
                dense
                bg-color="grey-2"
                class="input-styled"
                readonly
                disable
              />
            </div>
          </div>

          <!-- Caja fuerte -->
          <div class="section-container">
            <div class="section-label q-mb-md">
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
                :class="{ 'selected': editForm.caja_fuerte === option }"
                @click="editForm.caja_fuerte = option"
              />
            </div>
          </div>

          <!-- Movimiento de casita -->
          <div v-if="editForm.caja_fuerte === 'Room Move'" class="section-container">
            <div class="section-label q-mb-xs">Movimiento de casita</div>
            <q-input
              v-model="editForm.room_move"
              placeholder="Ingrese detalle del movimiento"
              outlined
              dense
              bg-color="white"
              class="input-styled"
            />
          </div>

          <!-- Puertas y ventanas -->
          <div class="section-container">
            <div class="section-label q-mb-xs">
              <q-icon name="meeting_room" color="grey-7" class="q-mr-sm" size="20px" />
              Puertas y Ventanas <span class="required-asterisk">*</span>
            </div>
            <q-input
              v-model="editForm.puertas_ventanas"
              placeholder="Ingrese puertas y ventanas"
              outlined
              dense
              bg-color="white"
              class="input-styled"
              :rules="[val => !!val || 'Campo requerido']"
            />
          </div>

          <!-- Electrónicos Category -->
          <div class="category-header edit-category">
            <q-icon name="devices" />
            <span class="category-title">Electrónicos</span>
          </div>

          <!-- Chromecast -->
          <div class="section-container">
            <div class="section-label q-mb-md">Chromecast <span class="required-asterisk">*</span></div>
            <div class="button-grid">
              <q-btn
                v-for="option in ['0', '01', '02', '03', '04']"
                :key="option"
                :label="option"
                unelevated
                class="custom-select-btn option-btn"
                style="min-width: 50px;"
                :class="{ 'selected': editForm.chromecast === option }"
                @click="editForm.chromecast = option"
              />
            </div>
          </div>

          <!-- Speaker -->
          <div class="section-container">
            <div class="section-label q-mb-md">Speaker <span class="required-asterisk">*</span></div>
            <div class="button-grid">
              <q-btn
                v-for="option in ['0', '01', '02', '03']"
                :key="option"
                :label="option"
                unelevated
                class="custom-select-btn option-btn"
                :class="{ 'selected': editForm.speaker === option }"
                @click="editForm.speaker = option"
              />
            </div>
          </div>

          <!-- USB Speaker -->
          <div class="section-container">
            <div class="section-label q-mb-md">USB Speaker <span class="required-asterisk">*</span></div>
            <div class="button-grid">
              <q-btn
                v-for="option in ['0', '01', '02', '03']"
                :key="option"
                :label="option"
                unelevated
                class="custom-select-btn option-btn"
                :class="{ 'selected': editForm.usb_speaker === option }"
                @click="editForm.usb_speaker = option"
              />
            </div>
          </div>

          <!-- Controles TV -->
          <div class="section-container">
            <div class="section-label q-mb-md">Controles TV <span class="required-asterisk">*</span></div>
            <div class="button-grid">
              <q-btn
                v-for="option in ['0', '01', '02', '03']"
                :key="option"
                :label="option"
                unelevated
                class="custom-select-btn option-btn"
                :class="{ 'selected': editForm.controles_tv === option }"
                @click="editForm.controles_tv = option"
              />
            </div>
          </div>

          <!-- Otros Items header -->
          <div class="category-header edit-category" style="background: #fff3e0; color: #ef6c00;">
            <q-icon name="category" />
            <span class="category-title">Otros Artículos</span>
          </div>

          <!-- Binoculares -->
          <div class="section-container">
            <div class="section-label q-mb-md">
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
                :class="{ 'selected': editForm.binoculares === option }"
                @click="editForm.binoculares = option"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Trapo para binoculares <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['Si', 'No']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.trapo_binoculares === option }"
                  @click="editForm.trapo_binoculares = option"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Bolsa Vapor <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['Si', 'No']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.bolsa_vapor === option }"
                  @click="editForm.bolsa_vapor = option"
                />
              </div>
            </div>
          </div>

          <!-- Secadora & Steamer -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Secadora <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['0', '01', '02', '03']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.secadora === option }"
                  @click="editForm.secadora = option"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Steamer <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['0', '01', '02', '03']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.steamer === option }"
                  @click="editForm.steamer = option"
                />
              </div>
            </div>
          </div>

          <!-- Accesorios Secadora -->
          <div class="section-container">
            <div class="section-label q-mb-md">Accesorios Secadora <span class="required-asterisk">*</span></div>
            <div class="button-grid">
              <q-btn
                v-for="option in ['0', '01', '02', '03', '04', '05', '06', '07', '08']"
                :key="option"
                :label="option"
                unelevated
                class="custom-select-btn option-btn"
                style="min-width: 45px;"
                :class="{ 'selected': editForm.accesorios_secadora === option }"
                @click="editForm.accesorios_secadora = option"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Plancha Cabello <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['0', '01', '02']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.plancha_cabello === option }"
                  @click="editForm.plancha_cabello = option"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Cola Caballo <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['Si', 'No']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.cola_caballo === option }"
                  @click="editForm.cola_caballo = option"
                />
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Bulto <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['Si', 'No']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.bulto === option }"
                  @click="editForm.bulto = option"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Sombrero <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['Si', 'No']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.sombrero === option }"
                  @click="editForm.sombrero = option"
                />
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Bolso Yute <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['0', '01', '02', '03']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.bolso_yute === option }"
                  @click="editForm.bolso_yute = option"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="section-label q-mb-md">Camas Ordenadas <span class="required-asterisk">*</span></div>
              <div class="button-grid">
                <q-btn
                  v-for="option in ['Si', 'No']"
                  :key="option"
                  :label="option"
                  unelevated
                  class="custom-select-btn option-btn"
                  :class="{ 'selected': editForm.camas_ordenadas === option }"
                  @click="editForm.camas_ordenadas = option"
                />
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div class="section-container">
            <div class="section-label q-mb-xs">Notas y observaciones adicionales</div>
            <q-input
              v-model="editForm.notas"
              type="textarea"
              placeholder="Escriba aquí sus observaciones..."
              outlined
              dense
              bg-color="white"
              class="input-styled"
              rows="3"
            />
          </div>

          <!-- Submit Buttons -->
          <div class="row q-gutter-sm q-mt-xl q-pb-xl">
            <div class="col">
              <q-btn
                label="Cancelar"
                color="grey"
                unelevated
                class="full-width"
                style="border-radius: 12px; height: 48px;"
                @click="cancelEditing"
              />
            </div>
            <div class="col">
              <q-btn
                label="Guardar Cambios"
                type="submit"
                color="primary"
                unelevated
                class="full-width submit-btn"
                style="border-radius: 12px; height: 48px;"
                :loading="savingEdit"
              />
            </div>
          </div>
        </q-form>
      </div>

      <!-- VIEW MODE -->
      <div v-else>
        <!-- Top Title Section -->
        <div class="q-px-lg q-pt-lg q-pb-md header-gradient" :class="{ 'rounded-top': images.length > 0 }">
          <div v-if="images.length === 0" class="row items-center q-mb-md">
             <q-btn flat round dense icon="arrow_back" color="dark" @click="$router.back()" />
          </div>
          <div class="row items-center justify-between">
            <div class="text-h4 text-weight-bolder text-dark">Casita {{ casa.casita || '--' }}</div>
            <q-btn
              icon="edit"
              label="Editar"
              color="primary"
              unelevated
              class="edit-btn"
              @click="startEditing"
            />
          </div>
          <div class="text-subtitle1 text-grey-7 q-mb-md">Revisión completa</div>

          <!-- Indicador de Nota Extra -->
          <div v-if="casa.nota_extra" class="row items-center q-mb-md">
            <div class="nota-extra-badge row items-center no-wrap">
              <q-icon name="sticky_note_2" size="16px" class="q-mr-xs" />
              <span class="text-weight-bold">Hay una nota extra</span>
            </div>
          </div>

          <!-- Info Cards -->
          <div class="info-card inspector-card q-mb-sm row items-center no-wrap">
            <q-icon name="person" color="primary" size="20px" class="q-mr-sm" />
            <div>
              <div class="text-caption text-primary text-weight-bold">Revisado por:</div>
              <div class="text-subtitle1 text-weight-bold text-dark">{{ casa.quien_revisa || 'Anónimo' }}</div>
            </div>
          </div>

          <div class="info-card date-card row items-center no-wrap">
            <q-icon name="schedule" color="green-7" size="20px" class="q-mr-sm" />
            <div>
              <div class="text-caption text-green-7 text-weight-bold">Fecha de revisión:</div>
              <div class="text-subtitle1 text-weight-bold text-dark">{{ formatDate(casa.created_at) }}</div>
            </div>
          </div>
        </div>

        <!-- Sections Grid -->
        <div class="q-pa-md q-gutter-y-lg">
        
        <!-- Section: Seguridad -->
        <div class="section-card shadow-1">
          <div class="row items-center justify-between q-mb-md action-hero-card theme-action-card">
            <div class="row items-center">
              <div class="icon-box bg-white-20 q-mr-md">
                <q-icon name="shield" color="white" size="28px" />
              </div>
              <div class="text-h6 text-white text-weight-bold">Seguridad</div>
            </div>
            <q-icon name="login" color="white" size="20px" />
          </div>

          <div class="q-gutter-y-lg q-mt-md">
            <!-- Check in Badge -->
            <div class="row">
               <div class="status-chip theme-status-chip row items-center no-wrap">
                 <q-icon name="login" size="14px" class="q-mr-xs" />
                 <span class="text-weight-bold">{{ casa.caja_fuerte || 'Check in' }}</span>
               </div>
            </div>

            <!-- Room Move Detail -->
            <div v-if="casa.room_move" class="row items-center justify-between q-py-sm border-bottom-light">
              <div class="row items-center">
                <div class="mini-icon-box bg-yellow-1 q-mr-sm">
                  <q-icon name="move_up" color="yellow-9" />
                </div>
                <div class="text-weight-medium text-grey-8">Detalle Movimiento</div>
              </div>
              <div class="text-weight-bold text-grey-7">{{ casa.room_move }}</div>
            </div>

            <!-- Doors Row -->
            <div class="row items-center justify-between q-py-sm border-bottom-light">
              <div class="row items-center">
                <div class="mini-icon-box bg-green-1 q-mr-sm">
                  <q-icon name="door_front" color="green" />
                </div>
                <div class="text-weight-medium text-grey-8">Puertas y Ventanas</div>
              </div>
              <q-btn outline color="green" label="Ok" rounded dense class="q-px-lg text-weight-bold" no-caps />
            </div>
          </div>
        </div>

        <!-- Section: Electrónicos -->
        <div class="section-card shadow-1">
          <div class="row items-center q-mb-lg">
            <div class="icon-box-small bg-blue-1 q-mr-md">
              <q-icon name="laptop" color="blue" size="24px" />
            </div>
            <div class="text-h6 text-weight-bold text-dark">Electrónicos</div>
          </div>

          <div class="q-gutter-y-sm">
            <div v-for="item in electronicItems" :key="item.label" class="row items-center justify-between q-py-xs">
              <div class="row items-center">
                <div class="mini-icon-box q-mr-sm" :class="item.bgClass">
                  <q-icon :name="item.icon" :color="item.color" />
                </div>
                <div class="text-weight-medium text-grey-8">{{ item.label }}</div>
              </div>
              <div class="count-badge q-px-sm row items-center justify-center" :class="{ 'count-badge-error': item.value === '0' || item.value === 0 || item.value === 'No' }">
                {{ item.value || '0' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Equipamiento & Otros (Dynamic based on logic from image) -->
        <div v-if="otherItems.length > 0" class="section-card shadow-1">
          <div class="row items-center q-mb-lg">
            <div class="icon-box-small bg-purple-1 q-mr-md">
              <q-icon name="inventory_2" color="purple" size="24px" />
            </div>
            <div class="text-h6 text-weight-bold text-dark">Equipamiento</div>
          </div>

          <div class="q-gutter-y-sm">
            <div v-for="item in otherItems" :key="item.label" class="row items-center justify-between q-py-xs">
              <div class="row items-center">
                <div class="mini-icon-box q-mr-sm" :class="item.bgClass">
                  <q-icon :name="item.icon" :color="item.color" />
                </div>
                <div class="text-weight-medium text-grey-8">{{ item.label }}</div>
              </div>
              <div class="count-badge q-px-sm row items-center justify-center" :class="{ 'count-badge-error': item.value === '0' || item.value === 0 || item.value === 'No' }">
                {{ item.value || '0' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div v-if="casa.notas" class="section-card shadow-1">
           <div class="row items-center q-mb-md">
             <q-icon name="notes" color="grey-7" size="20px" class="q-mr-sm" />
             <div class="text-weight-bold text-grey-8">Notas de revisión</div>
           </div>
           <div class="text-body2 text-grey-7 bg-grey-2 q-pa-md rounded-12">
             {{ casa.notas }}
           </div>
        </div>

        <!-- Nota Extra Button -->
        <div v-if="!showNotaExtra && (!casa.nota_extra)" class="q-mt-lg q-mb-xl">
          <q-btn
            label="Agregar nota extra"
            icon="note_add"
            color="primary"
            unelevated
            class="full-width"
            style="border-radius: 12px; height: 48px;"
            @click="enableNotaExtra"
          />
        </div>

        <!-- Display existing nota extra -->
        <div v-if="casa.nota_extra" class="section-card shadow-1 q-mt-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="sticky_note_2" color="orange-7" size="20px" class="q-mr-sm" />
            <div class="text-weight-bold text-grey-8">Nota Extra</div>
          </div>
          <div class="text-body2 text-grey-7 bg-orange-1 q-pa-md rounded-12 q-mb-md">
            {{ casa.nota_extra }}
          </div>
          <div class="row items-center q-gutter-x-md text-caption text-grey-6">
            <div class="row items-center">
              <q-icon name="person" size="14px" class="q-mr-xs" />
              {{ casa.usuario_nota }}
            </div>
            <div class="row items-center">
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              {{ formatDate(casa.hora_nota) }}
            </div>
          </div>
          <div v-if="casa.imagen_nota" class="q-mt-md">
            <img 
              :src="getImageUrl(casa.imagen_nota)" 
              class="nota-extra-image"
              @click="openNoteImage"
            />
          </div>
        </div>

        <!-- Formulario Nota Extra -->
        <div v-if="showNotaExtra" class="section-card shadow-1 q-mt-lg q-mb-xl">
          <div class="row items-center q-mb-md">
            <q-icon name="sticky_note_2" color="orange-7" size="20px" class="q-mr-sm" />
            <div class="text-weight-bold text-grey-8">Agregar Nota Extra</div>
          </div>

          <!-- Nota -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Nota</div>
            <q-input
              v-model="notaExtraForm.nota_extra"
              type="textarea"
              placeholder="Escriba la nota extra..."
              outlined
              dense
              bg-color="white"
              rows="3"
            />
          </div>

          <!-- Usuario (solo lectura) -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Usuario</div>
            <q-input
              v-model="notaExtraForm.usuario_nota"
              outlined
              dense
              bg-color="grey-2"
              readonly
              disable
            />
          </div>

          <!-- Hora (solo lectura) -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Hora</div>
            <q-input
              v-model="notaExtraForm.hora_nota"
              outlined
              dense
              bg-color="grey-2"
              readonly
              disable
            />
          </div>

          <!-- Imagen -->
          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">Imagen de la nota</div>
            <q-btn
              v-if="!notaExtraForm.imagen_nota"
              label="Agregar Foto"
              icon="add_a_photo"
              unelevated
              class="full-width photo-btn"
              @click="openPhotoSheet"
            />
            <div v-else>
              <div class="photo-preview-container">
                <img :src="getPreviewUrl(notaExtraForm.imagen_nota)" class="photo-preview" @click="openImageModal(getPreviewUrl(notaExtraForm.imagen_nota))" />
                <q-btn
                  icon="delete"
                  round
                  size="sm"
                  color="negative"
                  class="delete-photo-btn"
                  @click="removePhoto"
                />
              </div>
              <div v-if="compressionInfoNota" class="compression-info q-mt-sm">
                <div class="compression-row">
                  <span class="text-grey-7">Original:</span>
                  <span class="text-negative">{{ compressionInfoNota.originalSize }}</span>
                  <q-icon name="arrow_forward" size="12px" color="grey-5" />
                  <span class="text-positive">{{ compressionInfoNota.compressedSize }}</span>
                  <span class="text-primary">({{ compressionInfoNota.reduction }}%)</span>
                </div>
                <div class="compression-row">
                  <span class="text-grey-7">Formato: {{ compressionInfoNota.format }}</span>
                  <span class="text-grey-5 q-ml-xs">{{ compressionInfoNota.originalDimensions }} → {{ compressionInfoNota.compressedDimensions }}</span>
                </div>
              </div>
            </div>
            <q-file
              ref="fileNotaExtra"
              v-model="notaExtraForm.imagen_nota"
              label=""
              outlined
              dense
              bg-color="white"
              class="input-styled q-mt-xs"
              accept="image/*"
              style="display: none;"
            />
          </div>

          <!-- Botones -->
          <div class="row q-gutter-sm q-mt-md">
            <div class="col">
              <q-btn
                label="Cancelar"
                color="grey"
                unelevated
                class="full-width"
                style="border-radius: 8px;"
                @click="showNotaExtra = false"
              />
            </div>
            <div class="col">
              <q-btn
                label="Guardar Nota"
                color="primary"
                unelevated
                class="full-width"
                style="border-radius: 8px;"
                :loading="savingNota"
                :disable="!notaExtraForm.nota_extra"
                @click="saveNotaExtra"
              />
            </div>
          </div>
        </div>

        <!-- Historial de Ediciones -->
        <div v-if="logs.length > 0" class="section-card shadow-1 q-mt-lg q-mb-xl">
          <div class="row items-center q-mb-md">
            <q-icon name="history" color="blue-7" size="20px" class="q-mr-sm" />
            <div class="text-weight-bold text-grey-8">Historial de Ediciones</div>
          </div>
          
          <q-list separator class="q-pt-none">
            <q-item v-for="log in logs" :key="log.id" class="q-px-none q-py-md">
              <q-item-section>
                <div class="row items-center justify-between q-mb-xs">
                  <div class="row items-center">
                    <q-icon name="person" size="14px" class="q-mr-xs text-grey-6" />
                    <span class="text-weight-bold text-grey-8 text-caption">{{ log['Usuario que Edito'] }}</span>
                  </div>
                  <div class="row items-center">
                    <q-icon name="schedule" size="14px" class="q-mr-xs text-grey-6" />
                    <span class="text-caption text-grey-6">{{ formatDate(log.created_at) }}</span>
                  </div>
                </div>
                
                <div class="log-content">
                  <div class="log-row old-value">
                    <div class="log-tag">Anterior</div>
                    <div class="log-text">{{ formatLogData(log.Dato_anterior) }}</div>
                  </div>
                  <div class="log-row new-value">
                    <div class="log-tag">Nuevo</div>
                    <div class="log-text">{{ formatLogData(log.Dato_nuevo) }}</div>
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

      </div> <!-- end q-pa-md -->
    </div> <!-- end v-else -->
  </div> <!-- end casa container -->



    <!-- Error/Not Found -->
    <div v-else class="flex flex-center full-height q-pa-xl">
      <div class="text-center">
        <q-icon name="error_outline" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-5 q-mt-md">No se encontró la información</div>
        <q-btn flat color="primary" label="Volver" class="q-mt-md" @click="$router.back()" />
      </div>
    </div>

    <!-- Full Screen Image Viewer -->
    <q-dialog v-model="dialog" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black text-white">
        <q-card-actions align="right" class="absolute-top-right z-max">
          <q-btn flat round icon="close" color="white" @click="dialog = false" />
        </q-card-actions>
         <q-carousel
           v-model="dialogSlide"
           animated
           infinite
           arrows
           navigation
           class="bg-transparent full-height image-carousel overlay-carousel"
           navigation-icon="radio_button_unchecked"
           navigation-active-icon="radio_button_checked"
           control-color="white"
           control-type="flat"
           control-text-color="white"
           :swipeable="zoomLevel === 1"
           navigation-position="bottom"
         >
           <q-carousel-slide 
             v-for="(img, index) in images" 
             :key="index" 
             :name="index" 
             class="flex flex-center q-pa-none"
           >
             <q-img 
               :src="img" 
               fit="contain" 
               :style="{ height: '100vh', width: '100vw', transform: index === dialogSlide ? `scale(${zoomLevel})` : 'scale(1)', transition: isZooming ? 'none' : 'transform 0.3s ease', touchAction: 'manipulation' }"
               class="zoomable-image"
               @touchstart="onTouchStart"
               @touchmove="onTouchMove"
               @touchend="onTouchEnd"
               @wheel="onWheel"
             />
           </q-carousel-slide>
         </q-carousel>
      </q-card>
    </q-dialog>

    <!-- Photo Selection Dialog -->
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

    <!-- Image Modal for Nota -->
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

  </q-page>
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch } from 'vue'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { date, useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'

export default defineComponent({
  name: 'DetailsPage',
  setup () {
    const $q = useQuasar()
    const store = useCasasStore()
    const route = useRoute()
    const slide = ref(0)
    const dialog = ref(false)
    const dialogSlide = ref(0)
    const zoomLevel = ref(1)
    const isZooming = ref(false)
    const lastTouchDistance = ref(0)
    const lastScale = ref(1)
    
    const casa = computed(() => store.selectedCasa)
    const authStore = useAuthStore()
    
    // Nota extra fields
    const showNotaExtra = ref(false)
    const notaExtraForm = ref({
      nota_extra: '',
      usuario_nota: '',
      hora_nota: '',
      imagen_nota: null
    })
    const savingNota = ref(false)

    // Edit mode
    const isEditing = ref(false)
    const savingEdit = ref(false)
    const editForm = ref({
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
      notas: ''
    })

    const logs = ref([])

    const fetchLogs = async () => {
      if (!casa.value || !casa.value.id) return
      try {
        const { data, error } = await supabase
          .from('Registro_ediciones')
          .select('*')
          .ilike('Dato_anterior', `%[${casa.value.id}]%`)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching logs:', error)
          return
        }
        logs.value = data || []
      } catch (error) {
        console.error('Error fetching logs:', error)
      }
    }

    const formatLogData = (str) => {
      if (!str) return ''
      // Elimina la parte del UUID [uuid] para que sea más legible
      return str.replace(/\[.*?\]\s*/, '')
    }

    // Options for edit form
    const casitaOptions = Array.from({ length: 50 }, (_, i) => (i + 1).toString())
    const cajaFuerteOptions = [
      'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell',
      'Back to Back', 'Show Room', 'Room Move'
    ]
    const users = ref([])

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
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
    const photoSheetOpen = ref(false)
    const compressionInfoNota = ref(null)
    const fileNotaExtra = ref(null)
    const imageModalOpen = ref(false)
    const modalImageUrl = ref('')
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    const getLocalTime = () => {
      const now = new Date()
      return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ')
    }

    const enableNotaExtra = () => {
      showNotaExtra.value = true
      notaExtraForm.value.usuario_nota = authStore.user?.Usuario || ''
      notaExtraForm.value.hora_nota = getLocalTime()
    }

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

          const decodeSafely = async (file, img) => {
            if ('createImageBitmap' in window) {
              try {
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

          nCtx.fillStyle = '#FFFFFF'
          nCtx.fillRect(0, 0, normalizeCanvas.width, normalizeCanvas.height)
          
          const source = await decodeSafely(file, img)
          nCtx.drawImage(source, 0, 0)
          
          if (source instanceof ImageBitmap) {
            source.close()
          }

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
                const finalFile = new File([blob], `nota_${Date.now()}.jpg`, { type: 'image/jpeg' })
                
                compressionInfoNota.value = {
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
          console.error(`[Compression] Failed:`, error)
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

    const uploadImageToCloudinary = async (file) => {
      if (!file) return null

      try {
        const monthFolder = getMonthFolder()
        const timestamp = Date.now()
        const publicId = `nota_${timestamp}`
        const folderPath = `Notas/${monthFolder}`

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
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`)
        }

        const responseData = await response.json()
        return `${folderPath}/${publicId}`
      } catch (error) {
        console.error(`[Cloudinary] Error uploading:`, error)
        return null
      }
    }

    const openPhotoSheet = () => {
      photoSheetOpen.value = true
    }

    const selectPhotoSource = (source) => {
      photoSheetOpen.value = false
      setTimeout(() => {
        if (fileNotaExtra.value && fileNotaExtra.value.$el) {
          const fileInput = fileNotaExtra.value.$el.querySelector('input[type="file"]')
          if (fileInput) {
            if (source === 'camera') {
              fileInput.setAttribute('capture', 'environment')
            } else {
              fileInput.removeAttribute('capture')
            }
            fileInput.click()
          }
        }
      }, 300)
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

    const removePhoto = () => {
      notaExtraForm.value.imagen_nota = null
      compressionInfoNota.value = null
    }

    const saveNotaExtra = async () => {
      if (!casa.value || !casa.value.id) {
        $q.dialog({
          title: 'Error',
          message: 'No se encontró la revisión para actualizar',
          ok: { label: 'Aceptar', color: 'primary' }
        })
        return
      }

      savingNota.value = true
      try {
        let imagenUrl = null
        if (notaExtraForm.value.imagen_nota) {
          imagenUrl = await uploadImageToCloudinary(notaExtraForm.value.imagen_nota)
        }

        const updateData = {
          nota_extra: notaExtraForm.value.nota_extra,
          usuario_nota: notaExtraForm.value.usuario_nota,
          hora_nota: notaExtraForm.value.hora_nota,
          imagen_nota: imagenUrl
        }

        const { error } = await supabase
          .from('revisiones_casitas')
          .update(updateData)
          .eq('id', casa.value.id)

        if (error) throw error

        // Update local state
        casa.value.nota_extra = updateData.nota_extra
        casa.value.usuario_nota = updateData.usuario_nota
        casa.value.hora_nota = updateData.hora_nota
        casa.value.imagen_nota = updateData.imagen_nota

        $q.dialog({
          title: 'Éxito',
          message: 'Nota extra guardada correctamente',
          ok: { label: 'Aceptar', color: 'primary' }
        })

        showNotaExtra.value = false
        notaExtraForm.value = {
          nota_extra: '',
          usuario_nota: '',
          hora_nota: '',
          imagen_nota: null
        }
        compressionInfoNota.value = null
      } catch (error) {
        console.error('Error saving nota extra:', error)
        $q.dialog({
          title: 'Error',
          message: 'No se pudo guardar la nota extra. Intente nuevamente.',
          ok: { label: 'Aceptar', color: 'negative' }
        })
      } finally {
        savingNota.value = false
      }
    }

    // Watch for image compression
    watch(() => notaExtraForm.value.imagen_nota, async (newFile) => {
      if (newFile && typeof newFile !== 'string' && !newFile._isCompressed) {
        try {
          const compressed = await compressImage(newFile)
          if (compressed) {
            compressed._isCompressed = true
            notaExtraForm.value.imagen_nota = compressed
          }
        } catch (e) {
          console.error('[Watcher] Compression failed:', e)
        }
      }
    })

    onMounted(() => {
      const stored = localStorage.getItem('selectedCasa')
      console.log('[DetailsPage] localStorage inicial:', stored ? 'Contiene datos' : 'Vacío')
      console.log('[DetailsPage] Montado. Casa en store:', store.selectedCasa ? store.selectedCasa.id : 'Ninguna')
      
      if (!store.selectedCasa && stored) {
        console.log('[DetailsPage] Reintentando cargar desde localStorage...')
        store.selectedCasa = JSON.parse(stored)
      }

      if (!store.selectedCasa) {
        console.warn('[DetailsPage] No hay casa en el store ni en localStorage.')
      }

      // Load users for edit form
      loadUsers()

      // Load edition history
      fetchLogs()
    })

    const formatDate = (val) => {
      if (!val) return '--'
      return date.formatDate(val, 'DD MMMM YYYY - HH:mm', {
        months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      })
    }

    const getImageUrl = (path) => {
      if (!path) return ''
      if (path.startsWith('http')) return path
      const cloudinaryBase = 'https://res.cloudinary.com/dhd61lan4/image/upload'
      let cleanPath = path.split(' ').join('%20')
      if (!cleanPath.toLowerCase().endsWith('.jpg') && !cleanPath.toLowerCase().endsWith('.png')) {
        cleanPath += '.jpg'
      }
      return `${cloudinaryBase}/${cleanPath}`
    }

    const onOpenImage = (index) => {
      dialogSlide.value = index
      dialog.value = true
      zoomLevel.value = 1
      isZooming.value = false
      lastTouchDistance.value = 0
      lastScale.value = 1
    }

    const openNoteImage = () => {
      if (!casa.value?.imagen_nota) return
      const noteImageUrl = getImageUrl(casa.value.imagen_nota)
      const index = images.value.indexOf(noteImageUrl)
      if (index >= 0) {
        onOpenImage(index)
      }
    }

    // Edit functions
    const startEditing = () => {
      if (!casa.value) return
      
      // Copy current values to edit form
      editForm.value = {
        casita: casa.value.casita || '',
        quien_revisa: casa.value.quien_revisa || '',
        caja_fuerte: casa.value.caja_fuerte || '',
        room_move: casa.value.room_move || '',
        puertas_ventanas: casa.value.puertas_ventanas || '',
        chromecast: casa.value.chromecast || '',
        binoculares: casa.value.binoculares || '',
        trapo_binoculares: casa.value.trapo_binoculares || '',
        speaker: casa.value.speaker || '',
        usb_speaker: casa.value.usb_speaker || '',
        controles_tv: casa.value.controles_tv || '',
        secadora: casa.value.secadora || '',
        accesorios_secadora: casa.value.accesorios_secadora || '',
        steamer: casa.value.steamer || '',
        bolsa_vapor: casa.value.bolsa_vapor || '',
        plancha_cabello: casa.value.plancha_cabello || '',
        cola_caballo: casa.value.cola_caballo || '',
        bulto: casa.value.bulto || '',
        sombrero: casa.value.sombrero || '',
        bolso_yute: casa.value.bolso_yute || '',
        camas_ordenadas: casa.value.camas_ordenadas || '',
        notas: casa.value.notas || ''
      }
      
      isEditing.value = true
    }

    const cancelEditing = () => {
      isEditing.value = false
    }

    const saveEditing = async () => {
      if (!casa.value || !casa.value.id) {
        $q.dialog({
          title: 'Error',
          message: 'No se encontró la revisión para actualizar',
          ok: { label: 'Aceptar', color: 'primary' }
        })
        return
      }

      savingEdit.value = true
      try {
        const updateData = {
          casita: editForm.value.casita,
          caja_fuerte: editForm.value.caja_fuerte,
          room_move: editForm.value.room_move,
          puertas_ventanas: editForm.value.puertas_ventanas,
          chromecast: editForm.value.chromecast,
          binoculares: editForm.value.binoculares,
          trapo_binoculares: editForm.value.trapo_binoculares,
          speaker: editForm.value.speaker,
          usb_speaker: editForm.value.usb_speaker,
          controles_tv: editForm.value.controles_tv,
          secadora: editForm.value.secadora,
          accesorios_secadora: editForm.value.accesorios_secadora,
          steamer: editForm.value.steamer,
          bolsa_vapor: editForm.value.bolsa_vapor,
          plancha_cabello: editForm.value.plancha_cabello,
          cola_caballo: editForm.value.cola_caballo,
          bulto: editForm.value.bulto,
          sombrero: editForm.value.sombrero,
          bolso_yute: editForm.value.bolso_yute,
          camas_ordenadas: editForm.value.camas_ordenadas,
          notas: editForm.value.notas
        }

        // Registrar cambios en Registro_ediciones
        const changes = []
        const localTime = getLocalTime()
        const currentUser = authStore.user?.Usuario || 'Desconocido'

        for (const field in updateData) {
          const oldValue = casa.value[field]
          const newValue = updateData[field]

          // Solo registrar si el valor realmente cambió
          if (String(oldValue || '') !== String(newValue || '')) {
            changes.push({
              created_at: localTime,
              'Usuario que Edito': currentUser,
              Dato_anterior: `[${casa.value.id}] ${field}: ${oldValue || ''}`,
              Dato_nuevo: `[${casa.value.id}] ${field}: ${newValue || ''}`
            })
          }
        }

        // Si hay cambios, guardarlos en Registro_ediciones
        if (changes.length > 0) {
          const { error: logError } = await supabase
            .from('Registro_ediciones')
            .insert(changes)
          
          if (logError) {
            console.error('Error al registrar ediciones:', logError)
          }
        }

        const { error } = await supabase
          .from('revisiones_casitas')
          .update(updateData)
          .eq('id', casa.value.id)

        if (error) throw error

        // Update local state
        Object.assign(casa.value, updateData)

        $q.dialog({
          title: 'Éxito',
          message: 'Revisión actualizada correctamente',
          ok: { label: 'Aceptar', color: 'primary' }
        })

        isEditing.value = false
        // Refrescar el historial después de guardar
        fetchLogs()
      } catch (error) {
        console.error('Error updating revision:', error)
        $q.dialog({
          title: 'Error',
          message: 'No se pudo actualizar la revisión. Intente nuevamente.',
          ok: { label: 'Aceptar', color: 'negative' }
        })
      } finally {
        savingEdit.value = false
      }
    }

    const onTouchStart = (event) => {
      if (event.touches.length === 2) {
        isZooming.value = true
        lastTouchDistance.value = Math.hypot(
          event.touches[0].pageX - event.touches[1].pageX,
          event.touches[0].pageY - event.touches[1].pageY
        )
        lastScale.value = zoomLevel.value
      }
    }

    const onTouchMove = (event) => {
      if (event.touches.length === 2 && isZooming.value) {
        event.preventDefault()
        const currentDistance = Math.hypot(
          event.touches[0].pageX - event.touches[1].pageX,
          event.touches[0].pageY - event.touches[1].pageY
        )
        
        if (lastTouchDistance.value > 0) {
          const scale = currentDistance / lastTouchDistance.value
          const newZoom = Math.min(Math.max(lastScale.value * scale, 1), 4)
          zoomLevel.value = newZoom
        }
      }
    }

    const onTouchEnd = () => {
      isZooming.value = false
      if (zoomLevel.value < 1) {
        zoomLevel.value = 1
      } else if (zoomLevel.value > 4) {
        zoomLevel.value = 4
      }
    }

    const onWheel = (event) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(zoomLevel.value * delta, 1), 4)
      zoomLevel.value = newZoom
    }

    const images = computed(() => {
      if (!casa.value) return []
      const found = []
      const imageFields = ['evidencia_01', 'evidencia_02', 'evidencia_03', 'foto_minibar', 'foto_amenidad']
      imageFields.forEach(field => {
        const val = casa.value[field]
        if (val && typeof val === 'string' && val.length > 5) {
          found.push(getImageUrl(val))
        }
      })
      // Agregar imagen de la nota extra si existe
      if (casa.value.imagen_nota && typeof casa.value.imagen_nota === 'string' && casa.value.imagen_nota.length > 5) {
        found.push(getImageUrl(casa.value.imagen_nota))
      }
      return found
    })

    const electronicItems = computed(() => {
      if (!casa.value) return []
      return [
        { label: 'Chromecast', value: casa.value.chromecast, icon: 'cast', color: 'blue', bgClass: 'bg-blue-1' },
        { label: 'Speaker', value: casa.value.speaker, icon: 'speaker', color: 'green', bgClass: 'bg-green-1' },
        { label: 'USB Speaker', value: casa.value.usb_speaker, icon: 'usb', color: 'orange', bgClass: 'bg-orange-1' },
        { label: 'Controles TV', value: casa.value.controles_tv, icon: 'settings_remote', color: 'purple', bgClass: 'bg-purple-1' }
      ]
    })

    const themeClass = computed(() => {
      if (!casa.value) return 'theme-green'
      const caja = casa.value.caja_fuerte
      if (!caja) return 'theme-green'
      
      const cajaLower = caja.toLowerCase()
      
      if (cajaLower === 'check out') return 'theme-red'
      if (cajaLower === 'check in') return 'theme-green'
      if (cajaLower === 'si' || cajaLower === 'no') return 'theme-gold'
      if (cajaLower === 'upsell') return 'theme-blue'
      if (cajaLower === 'guardar upsell') return 'theme-purple'
      if (cajaLower === 'room move') return 'theme-orange'
      if (cajaLower === 'back to back' || cajaLower === 'show room') return 'theme-brown'
      
      return 'theme-green'
    })

    const otherItems = computed(() => {
      if (!casa.value) return []
      const items = []
      const mapping = [
        { key: 'secadora', label: 'Secadora', icon: 'air', color: 'red', bgClass: 'bg-red-1' },
        { key: 'accesorios_secadora', label: 'Acc. Secadora', icon: 'extension', color: 'deep-orange', bgClass: 'bg-deep-orange-1' },
        { key: 'steamer', label: 'Steamer', icon: 'iron', color: 'indigo', bgClass: 'bg-indigo-1' },
        { key: 'bolsa_vapor', label: 'Bolsa Vapor', icon: 'shopping_bag', color: 'light-blue', bgClass: 'bg-light-blue-1' },
        { key: 'plancha_cabello', label: 'Plancha Cabello', icon: 'electric_bolt', color: 'pink', bgClass: 'bg-pink-1' },
        { key: 'binoculares', label: 'Binoculares', icon: 'visibility', color: 'green', bgClass: 'bg-green-1' },
        { key: 'trapo_binoculares', label: 'Trapo Binoculares', icon: 'cleaning_services', color: 'blue-grey', bgClass: 'bg-blue-grey-1' },
        { key: 'cola_caballo', label: 'Cola Caballo', icon: 'face', color: 'brown-4', bgClass: 'bg-brown-1' },
        { key: 'bolso_yute', label: 'Bolso Yute', icon: 'shopping_basket', color: 'orange-8', bgClass: 'bg-orange-1' },
        { key: 'bulto', label: 'Bulto', icon: 'backpack', color: 'brown', bgClass: 'bg-brown-1' },
        { key: 'sombrero', label: 'Sombrero', icon: 'style', color: 'amber', bgClass: 'bg-amber-1' },
        { key: 'camas_ordenadas', label: 'Camas Ordenadas', icon: 'bed', color: 'teal', bgClass: 'bg-teal-1' }
      ]

      mapping.forEach(m => {
        if (casa.value[m.key]) {
          items.push({
            label: m.label,
            value: casa.value[m.key],
            icon: m.icon,
            color: m.color,
            bgClass: m.bgClass
          })
        }
      })
      return items
    })

    return {
      casa,
      images,
      slide,
      formatDate,
      electronicItems,
      otherItems,
      themeClass,
      dialog,
      dialogSlide,
      zoomLevel,
      isZooming,
      onOpenImage,
      openNoteImage,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onWheel,
      // Nota extra
      showNotaExtra,
      notaExtraForm,
      savingNota,
      photoSheetOpen,
      compressionInfoNota,
      fileNotaExtra,
      imageModalOpen,
      modalImageUrl,
      enableNotaExtra,
      openPhotoSheet,
      selectPhotoSource,
      getPreviewUrl,
      openImageModal,
      removePhoto,
      saveNotaExtra,
      formatBytes,
      getImageUrl,
      // Edit mode
      isEditing,
      editForm,
      savingEdit,
      casitaOptions,
      cajaFuerteOptions,
      users,
      startEditing,
      cancelEditing,
      saveEditing,
      logs,
      fetchLogs,
      formatLogData
    }
  }
})
</script>

<style scoped>
.content-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.rounded-top {
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  position: relative;
  z-index: 1;
}

.no-images-margin {
  padding-top: 20px;
}

.image-header {
  position: relative;
  height: auto;
  background-color: transparent;
  z-index: 2;
  margin: 16px 16px 0 16px;
}

@media (min-width: 768px) {
  .image-header {
    margin: 20px 20px 0 20px;
  }
}

@media (min-width: 1024px) {
  .image-header {
    margin: 24px 24px 0 24px;
  }
}

.rounded-header-img {
  border-radius: 24px;
  transition: transform 0.3s ease;
}

.rounded-header-img:hover {
  transform: translateY(-5px);
}

.bg-white-glass {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(8px);
}

.info-card {
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.03);
}

.inspector-card {
  background-color: #e0f7f4;
}

.date-card {
  background-color: #effbf0;
}

.section-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.action-hero-card {
  border-radius: 20px;
  padding: 16px;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-white-20 {
  background: rgba(255, 255, 255, 0.2);
}

.icon-box-small {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-chip {
  background-color: #00D26A;
  color: white;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
}

.border-bottom-light {
  border-bottom: 1px solid #f0f0f0;
}

.count-badge {
  background-color: #e8fdf2;
  color: #00D26A;
  min-width: 28px;
  height: 28px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
}

.count-badge-error {
  background-color: #ffebee;
  color: #f44336;
}

.rounded-12 {
  border-radius: 12px;
}

.action-btn {
  background: #4CAF50 !important;
  color: white;
  border-radius: 16px;
  font-weight: 700;
  text-transform: none;
}

/* ===== OVERLAY CAROUSEL STYLES ===== */

.image-carousel .q-carousel__control {
  position: absolute;
  z-index: 2;
}

.image-carousel .q-carousel__arrow {
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(4px);
  border-radius: 50%;
  margin: 0 16px;
}

.image-carousel .q-carousel__arrow .q-icon {
  color: white;
  font-size: 24px;
}

.image-carousel .q-carousel__navigation {
  bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  padding: 8px 16px;
}

.image-carousel .q-carousel__navigation-icon {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.image-carousel .q-carousel__navigation-icon--active {
  color: white;
}

/* ===== THEME COLORS ===== */

/* Theme Red - Check Out */
.theme-red .header-gradient {
  background: linear-gradient(135deg, #ffebee 0%, #ffffff 100%);
}
.theme-red .theme-action-card {
  background: linear-gradient(90deg, #f44336 0%, #ff5252 100%);
}
.theme-red .theme-status-chip {
  background-color: #f44336;
}

/* Theme Green - Check In */
.theme-green .header-gradient {
  background: linear-gradient(135deg, #e8fdf2 0%, #ffffff 100%);
}
.theme-green .theme-action-card {
  background: linear-gradient(90deg, #00D26A 0%, #00e676 100%);
}
.theme-green .theme-status-chip {
  background-color: #00D26A;
}

/* Theme Gold - Si/No */
.theme-gold .header-gradient {
  background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
}
.theme-gold .theme-action-card {
  background: linear-gradient(90deg, #ffc107 0%, #ffd54f 100%);
}
.theme-gold .theme-status-chip {
  background-color: #ffc107;
  color: #333;
}

/* Theme Orange - Room Move */
.theme-orange .header-gradient {
  background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%);
}
.theme-orange .theme-action-card {
  background: linear-gradient(90deg, #ff9800 0%, #ffa726 100%);
}
.theme-orange .theme-status-chip {
  background-color: #ff9800;
  color: #333;
}

/* Theme Blue - Upsell */
.theme-blue .header-gradient {
  background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%);
}
.theme-blue .theme-action-card {
  background: linear-gradient(90deg, #2196f3 0%, #42a5f5 100%);
}
.theme-blue .theme-status-chip {
  background-color: #2196f3;
}

/* Theme Purple - Guardar Upsell */
.theme-purple .header-gradient {
  background: linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%);
}
.theme-purple .theme-action-card {
  background: linear-gradient(90deg, #9c27b0 0%, #ab47bc 100%);
}
.theme-purple .theme-status-chip {
  background-color: #9c27b0;
}

/* Theme Yellow - Room Move */
.theme-yellow .header-gradient {
  background: linear-gradient(135deg, #fffde7 0%, #ffffff 100%);
}
.theme-yellow .theme-action-card {
  background: linear-gradient(90deg, #ffeb3b 0%, #fff176 100%);
}
.theme-yellow .theme-status-chip {
  background-color: #ffeb3b;
  color: #333;
}

/* Theme Brown - Back to Back / Show Room */
.theme-brown .header-gradient {
  background: linear-gradient(135deg, #efebe9 0%, #ffffff 100%);
}
.theme-brown .theme-action-card {
  background: linear-gradient(90deg, #795548 0%, #8d6e63 100%);
}
.theme-brown .theme-status-chip {
  background-color: #795548;
}

.z-max {
  z-index: 1000;
}

/* Nota Extra Styles */
.nota-extra-image {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 12px;
  cursor: pointer;
  object-fit: cover;
}

.nota-extra-badge {
  background: linear-gradient(135deg, #ff9800 0%, #ffa726 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.photo-preview-container {
  position: relative;
  display: inline-block;
}

.photo-preview {
  width: 100%;
  max-width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.delete-photo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.compression-info {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 11px;
}

.compression-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Photo Bottom Sheet */
.photo-bottom-sheet {
  border-radius: 20px 20px 0 0;
}

.photo-options-container {
  display: flex;
  padding: 20px;
  gap: 20px;
}

.photo-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  background: #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.photo-option:hover {
  background: #e0e0e0;
}

.photo-option-label {
  margin-top: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.photo-option-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

/* Image Modal */
.image-modal-card {
  background: black;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.image-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  color: white;
}

.image-modal-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.full-size-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.photo-btn {
  background: #f5f5f5;
  color: #424242;
  border-radius: 8px;
  height: 120px;
}

.photo-btn:hover {
  background: #e0e0e0;
}

.rounded-12 {
  border-radius: 12px;
}

/* Edit Mode Styles */
.edit-btn {
  border-radius: 20px;
  padding: 4px 16px;
  font-weight: 600;
  font-size: 0.875rem;
}

.edit-form-container {
  background: white;
  min-height: 100vh;
}

.edit-form-container .section-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #424242;
  display: flex;
  align-items: center;
}

.edit-form-container .required-asterisk {
  color: #ef5350;
  margin-left: 4px;
  font-weight: bold;
}

.edit-form-container .section-container {
  background: transparent;
  margin-bottom: 20px;
}

.edit-form-container .category-header {
  background: #e3f2fd;
  border-radius: 12px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  color: #1976d2;
  margin-bottom: 16px;
  margin-top: 8px;
}

.edit-form-container .edit-category {
  width: 100%;
}

.edit-form-container .category-title {
  font-weight: 700;
  margin-left: 8px;
  font-size: 1rem;
}

.edit-form-container .button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.edit-form-container .custom-select-btn {
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

.edit-form-container .custom-select-btn:active {
  transform: scale(0.95);
}

.edit-form-container .custom-select-btn.selected {
  border: 2px solid #4CAF50 !important;
  color: #4CAF50 !important;
  box-shadow: 0 10px 15px -3px rgba(76, 175, 80, 0.1), 0 4px 6px -2px rgba(76, 175, 80, 0.05) !important;
}

.edit-form-container .input-styled :deep(.q-field__control) {
  background: white !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;
  border-radius: 12px !important;
}

.edit-form-container .submit-btn {
  background: #4CAF50 !important;
  color: white !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 14px 0 rgba(76, 175, 80, 0.39) !important;
}

@media (max-width: 600px) {
  .edit-btn {
    padding: 4px 12px;
    font-size: 0.8rem;
  }
  
  .edit-form-container .button-grid {
    gap: 8px;
  }
  
  .edit-form-container .custom-select-btn {
    padding: 6px 12px !important;
    min-height: 40px;
  }
}

/* Historial Styles */
.log-content {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #edf0f2;
}

.log-row {
  display: flex;
  align-items: flex-start;
  padding: 2px 0;
  font-size: 13px;
}

.log-tag {
  font-weight: 700;
  min-width: 80px;
  font-size: 10px;
  text-transform: uppercase;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

.old-value .log-tag {
  color: #ef5350;
}

.new-value .log-tag {
  color: #4caf50;
}

.log-text {
  color: #424242;
  line-height: 1.4;
  word-break: break-word;
}

.old-value {
  border-bottom: 1px dashed #e0e0e0;
  margin-bottom: 6px;
  padding-bottom: 6px;
}
</style>
