<template>
  <q-page style="background: #f5f5f7;">
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

          <!-- Evidencias: solo permite agregar en espacios vacios -->
          <div v-if="editableEvidenceFields.length > 0 && !['Si', 'No'].includes(editForm.caja_fuerte)" class="section-container">
            <div class="category-header edit-category" style="background: #f1f8e9; color: #33691e;">
              <q-icon name="photo_camera" />
              <span class="category-title">Evidencia Fotográfica</span>
            </div>

            <div class="row q-col-gutter-md">
              <div
                v-for="field in editableEvidenceFields"
                :key="field.key"
                class="col-12 col-sm-4"
              >
                <div class="section-label q-mb-xs">{{ field.label }}</div>
                <q-btn
                  v-if="!editForm[field.key]"
                  label="Agregar Foto"
                  icon="add_a_photo"
                  unelevated
                  class="full-width photo-btn"
                  @click="openPhotoSheet(field.key)"
                />
                <div v-else>
                  <div class="photo-preview-container">
                    <img
                      :src="getPreviewUrl(editForm[field.key])"
                      class="photo-preview"
                      @click="openImageModal(getPreviewUrl(editForm[field.key]))"
                    />
                    <q-btn
                      icon="delete"
                      round
                      size="sm"
                      color="negative"
                      class="delete-photo-btn"
                      @click="removePhoto(field.key)"
                    />
                  </div>
                  <div v-if="compressionInfoEdit[field.key]" class="compression-info q-mt-sm">
                    <div class="compression-row">
                      <span class="text-grey-7">Original:</span>
                      <span class="text-negative">{{ compressionInfoEdit[field.key].originalSize }}</span>
                      <q-icon name="arrow_forward" size="12px" color="grey-5" />
                      <span class="text-positive">{{ compressionInfoEdit[field.key].compressedSize }}</span>
                      <span class="text-primary">({{ compressionInfoEdit[field.key].reduction }}%)</span>
                    </div>
                    <div class="compression-row">
                      <span class="text-grey-7">Formato: {{ compressionInfoEdit[field.key].format }}</span>
                      <span class="text-grey-5 q-ml-xs">{{ compressionInfoEdit[field.key].originalDimensions }} -> {{ compressionInfoEdit[field.key].compressedDimensions }}</span>
                    </div>
                  </div>
                </div>
                <q-file
                  :ref="el => setEvidenceFileRef(field.key, el)"
                  v-model="editForm[field.key]"
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

          <!-- Guardado Cancel buttons -->
          <div class="row q-gutter-sm q-mt-xl q-pb-xl">
            <div class="col">
              <q-btn
                label="Cancelar"
                unelevated
                class="full-width"
                style="border-radius: 980px; height: 48px; background: rgba(0,0,0,0.07); color: #1d1d1f; font-weight: 600; text-transform: none;"
                @click="cancelEditing"
              />
            </div>
            <div class="col">
              <q-btn
                label="Guardar Cambios"
                type="submit"
                unelevated
                class="full-width submit-btn"
                style="border-radius: 980px; height: 48px; text-transform: none;"
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
             <q-btn flat round dense icon="arrow_back" style="color: #1d1d1f; background: rgba(0,0,0,0.06); border-radius: 50%;" @click="$router.back()" />
          </div>
          <div class="row items-center justify-between">
            <div style="font-size: 28px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.5px;">Casita {{ casa.casita || '--' }}</div>
            <q-btn
              v-if="canEdit"
              icon="edit"
              label="Editar"
              color="primary"
              unelevated
              class="edit-btn"
              @click="startEditing"
            />
          </div>
          <div style="font-size: 15px; color: rgba(0,0,0,0.48); margin-bottom: 14px; letter-spacing: -0.2px;">Revisión completa</div>

          <!-- Indicador de Nota Extra -->
          <div v-if="notasExtra.length > 0" class="row items-center q-mb-md">
            <div class="nota-extra-badge row items-center no-wrap">
              <q-icon name="sticky_note_2" size="16px" class="q-mr-xs" />
              <span class="text-weight-bold">{{ notasExtra.length }} nota{{ notasExtra.length === 1 ? '' : 's' }} extra</span>
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
        <div v-if="canAdd && !showNotaExtra" class="q-mt-lg q-mb-xl">
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
        <div v-for="nota in notasExtra" :key="nota.id" class="section-card shadow-1 q-mt-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="sticky_note_2" color="orange-7" size="20px" class="q-mr-sm" />
            <div class="text-weight-bold text-grey-8">Nota Extra</div>
          </div>
          <div class="text-body2 text-grey-7 bg-orange-1 q-pa-md rounded-12 q-mb-md">
            {{ nota.nota }}
          </div>
          <div class="row items-center q-gutter-x-md text-caption text-grey-6">
            <div class="row items-center">
              <q-icon name="person" size="14px" class="q-mr-xs" />
              {{ nota.usuario || 'Anónimo' }}
            </div>
            <div class="row items-center">
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              {{ formatNotaDate(nota.hora) }}
            </div>
          </div>
          <div v-if="nota.imagen" class="q-mt-md">
            <img 
              :src="getImageUrl(nota.imagen)" 
              class="nota-extra-image"
              @click="openNoteImage(nota.imagen)"
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
              @click="openPhotoSheet()"
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
                  @click="removePhoto()"
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
import { defineComponent, computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { date, useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { CLOUDINARY_CONFIG } from '../cloudinary'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'

export default defineComponent({
  name: 'DetailsPage',
  setup () {
    const $q = useQuasar()
    const store = useCasasStore()
    const route = useRoute()
    const slide = ref(0)

    // ─── PhotoSwipe lightbox (pinch-to-zoom, swipe, doble-tap) ───
    let lightbox = null

    // PhotoSwipe necesita el tamaño real de cada imagen; lo precargamos.
    const loadImageSize = (src) => new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({
        src,
        width: img.naturalWidth || 1600,
        height: img.naturalHeight || 1200
      })
      img.onerror = () => resolve({ src, width: 1600, height: 1200 })
      img.src = src
    })

    const getCurrentImageUrl = () => {
      if (lightbox && lightbox.pswp) {
        return images.value[lightbox.pswp.currIndex]
      }
      return null
    }

    const initLightbox = () => {
      lightbox = new PhotoSwipeLightbox({
        pswpModule: () => import('photoswipe'),
        bgOpacity: 1,
        showHideAnimationType: 'fade',
        wheelToZoom: true,
        zoom: true,
        padding: { top: 60, bottom: 60, left: 0, right: 0 }
      })

      // Botones personalizados de compartir y descargar en la barra superior
      lightbox.on('uiRegister', () => {
        lightbox.pswp.ui.registerElement({
          name: 'download-button',
          order: 9,
          isButton: true,
          tagName: 'button',
          title: 'Descargar',
          html: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
          onClick: () => downloadImage()
        })

        if (canShare.value) {
          lightbox.pswp.ui.registerElement({
            name: 'share-button',
            order: 8,
            isButton: true,
            tagName: 'button',
            title: 'Compartir',
            html: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>',
            onClick: () => shareImage()
          })
        }
      })

      lightbox.init()
    }

    const casa = computed(() => store.selectedCasa)
    const authStore = useAuthStore()
    const canAdd = computed(() => authStore.canAdd)
    const canEdit = computed(() => authStore.canEdit)
    
    // Nota extra fields
    const showNotaExtra = ref(false)
    const notasExtra = ref([])
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
      evidencia_01: null,
      evidencia_02: null,
      evidencia_03: null,
      notas: ''
    })

    const logs = ref([])
    const evidenceFields = [
      { key: 'evidencia_01', label: 'Evidencia 1' },
      { key: 'evidencia_02', label: 'Evidencia 2' },
      { key: 'evidencia_03', label: 'Evidencia 3' }
    ]
    const evidenceLabelMap = evidenceFields.reduce((acc, field) => {
      acc[field.key] = field.label
      return acc
    }, {})
    const evidenceFileRefs = ref({})
    const currentPhotoField = ref('imagen_nota')
    const compressionInfoEdit = ref({
      evidencia_01: null,
      evidencia_02: null,
      evidencia_03: null
    })
    const editableEvidenceFields = computed(() => {
      if (!casa.value) return []
      return evidenceFields.filter(field => !casa.value[field.key])
    })

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
      const clean = str.replace(/\[.*?\]\s*/, '')
      const evidenceMatch = clean.match(/^(evidencia_0[1-3]|Evidencia [1-3])/)
      if (evidenceMatch) {
        const key = evidenceMatch[1]
        return evidenceLabelMap[key] || key
      }
      return clean
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

    const fetchNotasExtra = async () => {
      if (!casa.value?.id) {
        notasExtra.value = []
        return
      }

      try {
        const { data, error } = await supabase
          .from('notas_revisiones_casitas')
          .select('*')
          .eq('revision_id', casa.value.id)
          .order('hora', { ascending: false })

        if (error) {
          console.error('Error cargando notas extra:', error)
          return
        }

        notasExtra.value = data || []
      } catch (error) {
        console.error('Error cargando notas extra:', error)
      }
    }
    const photoSheetOpen = ref(false)
    const compressionInfoNota = ref(null)
    const fileNotaExtra = ref(null)
    const imageModalOpen = ref(false)
    const modalImageUrl = ref('')
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    // Check if Web Share API is available
    const canShare = computed(() => {
      return typeof navigator !== 'undefined' && !!navigator.share
    })

    const shareImage = async () => {
      const currentImageUrl = getCurrentImageUrl()
      if (!currentImageUrl) return

      try {
        if (navigator.share) {
          // Fetch the image as a blob for sharing
          const response = await fetch(currentImageUrl)
          const blob = await response.blob()
          const file = new File([blob], 'evidencia.jpg', { type: 'image/jpeg' })

          await navigator.share({
            title: 'Evidencia de Revisión - Casita ' + (casa.value?.casita || ''),
            text: 'Revisión de casita ' + (casa.value?.casita || ''),
            files: [file]
          })
        } else {
          // Fallback: copy URL to clipboard
          await navigator.clipboard.writeText(currentImageUrl)
          $q.notify({
            message: 'Enlace copiado al portapapeles',
            color: 'positive',
            position: 'top',
            timeout: 2000
          })
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error)
          // Fallback to clipboard
          try {
            await navigator.clipboard.writeText(currentImageUrl)
            $q.notify({
              message: 'Enlace copiado al portapapeles',
              color: 'positive',
              position: 'top',
              timeout: 2000
            })
          } catch (clipError) {
            console.error('Error copying to clipboard:', clipError)
          }
        }
      }
    }

    const downloadImage = async () => {
      const currentImageUrl = getCurrentImageUrl()
      if (!currentImageUrl) return

      try {
        // Fetch the image
        const response = await fetch(currentImageUrl)
        const blob = await response.blob()
        
        // Create a download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `evidencia_${casa.value?.casita || 'image'}_${Date.now()}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        $q.notify({
          message: 'Imagen descargada correctamente',
          color: 'positive',
          position: 'top',
          timeout: 2000
        })
      } catch (error) {
        console.error('Error downloading:', error)
        $q.notify({
          message: 'Error al descargar la imagen',
          color: 'negative',
          position: 'top',
          timeout: 2000
        })
      }
    }

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

    const compressImage = async (file, field = null) => {
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
          const finalMime = field ? `image/${config.format}` : 'image/jpeg'
          const finalFormat = field ? config.format.toUpperCase() : 'JPEG'

          const generateBlob = () => {
            finalCanvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to generate final blob'))
                return
              }

              const sizeKB = blob.size / 1024
              if (sizeKB <= config.targetSizeKB || attempts >= config.maxAttempts || quality <= config.minQuality) {
                const finalFile = new File([blob], `${field || 'nota'}_${Date.now()}.${field ? config.format : 'jpg'}`, { type: finalMime })
                
                const info = {
                  originalSize: formatBytes(originalSize),
                  compressedSize: formatBytes(finalFile.size),
                  reduction: Math.round(((originalSize - finalFile.size) / originalSize) * 100),
                  format: finalFormat,
                  originalDimensions: `${img.width}x${img.height}`,
                  compressedDimensions: `${targetW}x${targetH}`
                }
                if (field && compressionInfoEdit.value[field] !== undefined) {
                  compressionInfoEdit.value[field] = info
                } else {
                  compressionInfoNota.value = info
                }
                
                finalCanvas.width = 0
                finalCanvas.height = 0
                resolve(finalFile)
              } else {
                quality -= 0.05
                attempts++
                generateBlob()
              }
            }, finalMime, quality)
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

    const uploadImageToCloudinary = async (file, field = 'nota') => {
      if (!file) return null

      try {
        const monthFolder = getMonthFolder()
        const timestamp = Date.now()
        const isEvidence = field.startsWith('evidencia_')
        const n = isEvidence ? field.split('_')[1] : null
        const publicId = isEvidence ? `evidencia_${n}_${timestamp}` : `nota_${timestamp}`
        const folderPath = isEvidence ? `Evidencias/${monthFolder}` : `Notas/${monthFolder}`

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

    const setEvidenceFileRef = (field, el) => {
      if (el) evidenceFileRefs.value[field] = el
    }

    const openPhotoSheet = (field = 'imagen_nota') => {
      currentPhotoField.value = field
      photoSheetOpen.value = true
    }

    const selectPhotoSource = (source) => {
      photoSheetOpen.value = false
      setTimeout(() => {
        const field = currentPhotoField.value
        const fileInputRef = field === 'imagen_nota'
          ? fileNotaExtra.value
          : evidenceFileRefs.value[field]

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

    const removePhoto = (field = 'imagen_nota') => {
      if (field && evidenceLabelMap[field] && !casa.value?.[field]) {
        editForm.value[field] = null
        compressionInfoEdit.value[field] = null
        return
      }
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

        const localTime = getLocalTime()

        const nuevaNota = {
          revision_id: casa.value.id,
          nota: notaExtraForm.value.nota_extra,
          usuario: notaExtraForm.value.usuario_nota,
          hora: notaExtraForm.value.hora_nota || localTime,
          imagen: imagenUrl
        }

        const { data, error } = await supabase
          .from('notas_revisiones_casitas')
          .insert(nuevaNota)
          .select()
          .single()

        if (error) throw error

        const { error: updateError } = await supabase
          .from('revisiones_casitas')
          .update({ update_at: localTime })
          .eq('id', casa.value.id)

        if (updateError) {
          console.error('Error actualizando fecha de revision:', updateError)
        }

        notasExtra.value = data ? [data, ...notasExtra.value] : [{ ...nuevaNota, id: `local-${Date.now()}`, created_at: localTime }, ...notasExtra.value]
        casa.value.update_at = localTime

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

    evidenceFields.forEach(({ key }) => {
      watch(() => editForm.value[key], async (newFile) => {
        if (newFile && typeof newFile !== 'string' && !newFile._isCompressed) {
          try {
            const compressed = await compressImage(newFile, key)
            if (compressed) {
              compressed._isCompressed = true
              editForm.value[key] = compressed
            }
          } catch (e) {
            console.error(`[Watcher] Compression failed for ${key}:`, e)
          }
        }
      })
    })

    onMounted(async () => {
      const stored = localStorage.getItem('selectedCasa')

      if (!store.selectedCasa && stored) {
        try {
          store.selectedCasa = JSON.parse(stored)
        } catch (error) {
          console.error('[DetailsPage] No se pudo leer selectedCasa guardada:', error)
        }
      }

      if (store.selectedCasa?.id) {
        await store.fetchCasaById(store.selectedCasa.id)
      }

      if (!store.selectedCasa) {
        console.warn('[DetailsPage] No hay casa en el store ni en localStorage.')
      }

      // Load users for edit form
      loadUsers()

      // Load edition history
      fetchLogs()

      // Load multiple extra notes
      fetchNotasExtra()
    })

    onUnmounted(() => {
      if (lightbox) {
        lightbox.destroy()
        lightbox = null
      }
    })

    const formatDate = (val) => {
      if (!val) return '--'
      return date.formatDate(val, 'DD MMMM YYYY - HH:mm', {
        months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      })
    }

    const formatNotaDate = (val) => {
      if (!val) return '--'
      const match = String(val).match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
      if (!match) return String(val)

      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      const [, year, month, day, hour, minute] = match
      return `${Number(day)} De ${months[Number(month) - 1] || month} ${year} ${hour}:${minute}`
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

    const onOpenImage = async (index) => {
      if (!images.value.length) return
      const dataSource = await Promise.all(images.value.map(loadImageSize))
      if (!lightbox) initLightbox()
      lightbox.loadAndOpen(index, dataSource)
    }

    const openNoteImage = (imagePath) => {
      if (!imagePath) return
      const noteImageUrl = getImageUrl(imagePath)
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
        evidencia_01: null,
        evidencia_02: null,
        evidencia_03: null,
        notas: casa.value.notas || ''
      }
      compressionInfoEdit.value = {
        evidencia_01: null,
        evidencia_02: null,
        evidencia_03: null
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
        const localTime = getLocalTime()
        const uploadedEvidence = {}

        for (const { key } of evidenceFields) {
          const selectedFile = editForm.value[key]
          if (!casa.value[key] && selectedFile && typeof selectedFile !== 'string') {
            const uploadedUrl = await uploadImageToCloudinary(selectedFile, key)
            if (!uploadedUrl) {
              throw new Error(`No se pudo subir ${evidenceLabelMap[key]}`)
            }
            uploadedEvidence[key] = uploadedUrl
          }
        }

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
          notas: editForm.value.notas,
          ...uploadedEvidence
        }

        // Registrar cambios en Registro_ediciones
        const changes = []
        const currentUser = authStore.user?.Usuario || 'Desconocido'

        for (const field in updateData) {
          const oldValue = casa.value[field]
          const newValue = updateData[field]

          // Solo registrar si el valor realmente cambió
          if (String(oldValue || '') !== String(newValue || '')) {
            const isEvidenceField = !!evidenceLabelMap[field]
            changes.push({
              created_at: localTime,
              'Usuario que Edito': currentUser,
              Dato_anterior: `[${casa.value.id}] ${isEvidenceField ? evidenceLabelMap[field] : `${field}: ${oldValue || ''}`}`,
              Dato_nuevo: `[${casa.value.id}] ${isEvidenceField ? evidenceLabelMap[field] : `${field}: ${newValue || ''}`}`
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

        updateData.update_at = localTime

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
      notasExtra.value.forEach(nota => {
        if (nota.imagen && typeof nota.imagen === 'string' && nota.imagen.length > 5) {
          found.push(getImageUrl(nota.imagen))
        }
      })
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
      formatNotaDate,
      electronicItems,
      otherItems,
      themeClass,
      onOpenImage,
      openNoteImage,
      // Share
      canShare,
      shareImage,
      downloadImage,
      // Nota extra
      showNotaExtra,
      notasExtra,
      notaExtraForm,
      savingNota,
      photoSheetOpen,
      currentPhotoField,
      compressionInfoNota,
      compressionInfoEdit,
      fileNotaExtra,
      editableEvidenceFields,
      imageModalOpen,
      modalImageUrl,
      enableNotaExtra,
      openPhotoSheet,
      selectPhotoSource,
      setEvidenceFileRef,
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
      formatLogData,
      canAdd,
      canEdit
    }
  }
})
</script>

<style scoped>
.content-container {
  background-color: #f5f5f7;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
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

.zoomable-image {
  backface-visibility: hidden;
  will-change: transform;
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
  border-radius: 18px;
  transition: transform 0.3s ease;
}

.rounded-header-img:hover {
  transform: translateY(-3px);
}

.bg-white-glass {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ─── Info Cards ─── */
.info-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: none;
}

.inspector-card {
  background-color: rgba(0, 113, 227, 0.06);
}

.date-card {
  background-color: rgba(52, 199, 89, 0.07);
}

/* ─── Section Cards ─── */
.section-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.section-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}

.action-hero-card {
  border-radius: 14px;
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
  border-radius: 10px;
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
  background-color: #0071e3;
  color: white;
  padding: 6px 16px;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.border-bottom-light {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.count-badge {
  background-color: rgba(0, 113, 227, 0.08);
  color: #0071e3;
  min-width: 32px;
  height: 28px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
}

.count-badge-error {
  background-color: rgba(255, 59, 48, 0.08);
  color: #ff3b30;
}

.rounded-12 {
  border-radius: 12px;
}

.action-btn {
  background: #0071e3 !important;
  color: white;
  border-radius: 980px;
  font-weight: 600;
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
  background: linear-gradient(135deg, #fff2f2 0%, #f5f5f7 100%);
}
.theme-red .theme-action-card {
  background: linear-gradient(90deg, #ff3b30 0%, #ff6b60 100%);
}
.theme-red .theme-status-chip {
  background-color: #ff3b30;
}

/* Theme Green - Check In */
.theme-green .header-gradient {
  background: linear-gradient(135deg, #f0fff6 0%, #f5f5f7 100%);
}
.theme-green .theme-action-card {
  background: linear-gradient(90deg, #34c759 0%, #30d158 100%);
}
.theme-green .theme-status-chip {
  background-color: #34c759;
}

/* Theme Gold - Si/No */
.theme-gold .header-gradient {
  background: linear-gradient(135deg, #fffbf0 0%, #f5f5f7 100%);
}
.theme-gold .theme-action-card {
  background: linear-gradient(90deg, #ff9f0a 0%, #ffcc02 100%);
}
.theme-gold .theme-status-chip {
  background-color: #ff9f0a;
  color: white;
}

/* Theme Orange - Room Move */
.theme-orange .header-gradient {
  background: linear-gradient(135deg, #fff5ec 0%, #f5f5f7 100%);
}
.theme-orange .theme-action-card {
  background: linear-gradient(90deg, #ff6b2b 0%, #ff9500 100%);
}
.theme-orange .theme-status-chip {
  background-color: #ff6b2b;
}

/* Theme Blue - Upsell */
.theme-blue .header-gradient {
  background: linear-gradient(135deg, #f0f7ff 0%, #f5f5f7 100%);
}
.theme-blue .theme-action-card {
  background: linear-gradient(90deg, #0071e3 0%, #5ac8fa 100%);
}
.theme-blue .theme-status-chip {
  background-color: #0071e3;
}

/* Theme Purple */
.theme-purple .header-gradient {
  background: linear-gradient(135deg, #f8f0ff 0%, #f5f5f7 100%);
}
.theme-purple .theme-action-card {
  background: linear-gradient(90deg, #bf5af2 0%, #9b59b6 100%);
}
.theme-purple .theme-status-chip {
  background-color: #bf5af2;
}

/* Theme Yellow */
.theme-yellow .header-gradient {
  background: linear-gradient(135deg, #fffde0 0%, #f5f5f7 100%);
}
.theme-yellow .theme-action-card {
  background: linear-gradient(90deg, #ffd60a 0%, #ffcc02 100%);
}
.theme-yellow .theme-status-chip {
  background-color: #ffd60a;
  color: #333;
}

/* Theme Brown */
.theme-brown .header-gradient {
  background: linear-gradient(135deg, #f5f0eb 0%, #f5f5f7 100%);
}
.theme-brown .theme-action-card {
  background: linear-gradient(90deg, #6e4e37 0%, #8e6a56 100%);
}
.theme-brown .theme-status-chip {
  background-color: #6e4e37;
}

.z-max {
  z-index: 1000;
}

/* ─── Nota Extra ─── */
.nota-extra-image {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 12px;
  cursor: pointer;
  object-fit: cover;
}

.nota-extra-badge {
  background: linear-gradient(135deg, #ff9500 0%, #ffcc02 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
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
  border-radius: 10px;
  cursor: pointer;
}

.delete-photo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.compression-info {
  background: #f5f5f7;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11px;
}

.compression-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ─── Photo Bottom Sheet ─── */
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
  border-radius: 14px;
  background: #f5f5f7;
  cursor: pointer;
  transition: background 0.2s;
}

.photo-option:hover {
  background: #e9e9eb;
}

.photo-option-label {
  margin-top: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #1d1d1f;
}

.photo-option-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.48);
}

/* ─── Image Modal ─── */
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
  background: #f5f5f7;
  color: #1d1d1f;
  border-radius: 10px;
  height: 120px;
  border: 1.5px dashed rgba(0, 0, 0, 0.15);
}

.photo-btn:hover {
  background: #e9e9eb;
}

/* ─── Edit Mode Styles ─── */
.edit-btn {
  border-radius: 980px;
  padding: 4px 18px;
  font-weight: 600;
  font-size: 0.875rem;
}

.edit-form-container {
  background: #f5f5f7;
  min-height: 100vh;
}

.edit-form-container .section-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1d1d1f;
  display: flex;
  align-items: center;
}

.edit-form-container .required-asterisk {
  color: #ff3b30;
  margin-left: 4px;
  font-weight: bold;
}

.edit-form-container .section-container {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  margin-bottom: 12px;
}

.edit-form-container .category-header {
  background: rgba(0, 113, 227, 0.06);
  border-radius: 10px;
  padding: 8px 14px;
  display: inline-flex;
  align-items: center;
  color: #0071e3;
  margin-bottom: 16px;
  margin-top: 8px;
}

.edit-form-container .edit-category {
  width: 100%;
}

.edit-form-container .category-title {
  font-weight: 700;
  margin-left: 8px;
  font-size: 0.95rem;
}

.edit-form-container .button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.edit-form-container .custom-select-btn {
  background: #ffffff !important;
  color: rgba(0, 0, 0, 0.6) !important;
  border-radius: 10px !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
  border: 1.5px solid transparent !important;
  text-transform: none !important;
  font-weight: 500 !important;
  padding: 8px 16px !important;
  min-height: 42px;
  transition: all 0.15s ease;
}

.edit-form-container .custom-select-btn:active {
  transform: scale(0.96);
}

.edit-form-container .custom-select-btn.selected {
  border: 1.5px solid #0071e3 !important;
  color: #0071e3 !important;
  background: rgba(0, 113, 227, 0.05) !important;
  box-shadow: none !important;
}

.edit-form-container .input-styled :deep(.q-field__control) {
  background: white !important;
  border-radius: 10px !important;
}

.edit-form-container .submit-btn {
  background: #0071e3 !important;
  color: white !important;
  border-radius: 980px !important;
  font-weight: 600 !important;
}

@media (max-width: 600px) {
  .edit-btn {
    padding: 4px 12px;
    font-size: 0.8rem;
  }

  .edit-form-container .button-grid {
    gap: 6px;
  }

  .edit-form-container .custom-select-btn {
    padding: 6px 12px !important;
    min-height: 38px;
  }
}

/* ─── Historial Styles ─── */
.log-content {
  background: #f5f5f7;
  border-radius: 10px;
  padding: 12px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
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
  color: #ff3b30;
}

.new-value .log-tag {
  color: #34c759;
}

.log-text {
  color: #1d1d1f;
  line-height: 1.4;
  word-break: break-word;
}

.old-value {
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  margin-bottom: 6px;
  padding-bottom: 6px;
}

/* Desktop layout */
@media (min-width: 1024px) {
  .content-container {
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
    padding: 0 24px;
  }

  .image-header {
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-gradient {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
    max-width: 100%;
  }

  .header-gradient .row.items-center.justify-between {
    grid-column: 1 / -1;
  }

  .header-gradient .text-subtitle1.text-grey-7 {
    grid-column: 1 / -1;
  }

  .header-gradient .nota-extra-badge {
    grid-column: 1 / -1;
  }

  .info-card {
    margin-bottom: 0 !important;
  }

  .q-pa-md.q-gutter-y-lg {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .q-pa-md.q-gutter-y-lg > .section-card {
    max-width: 100%;
    margin: 0;
  }

  .q-pa-md.q-gutter-y-lg > .section-card:first-child {
    grid-column: 1 / -1;
  }

  .q-pa-md.q-gutter-y-lg > .section-card:has(.text-body2) {
    grid-column: 1 / -1;
  }

  .q-pa-md.q-gutter-y-lg > .section-card:last-child {
    grid-column: 1 / -1;
  }

  .q-pa-md.q-gutter-y-lg > .q-mt-lg {
    grid-column: 1 / -1;
  }

  .section-card {
    border-radius: 16px;
    padding: 24px;
  }

  .section-card .row.items-center.justify-between {
    padding: 8px 0;
  }

  .count-badge {
    min-width: 36px;
    height: 32px;
    border-radius: 16px;
    font-size: 15px;
  }
}
</style>
