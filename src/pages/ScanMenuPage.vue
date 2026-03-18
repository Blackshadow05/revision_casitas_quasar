<template>
  <q-page class="bg-gray-1">
    <div class="top-nav-bar q-pa-md row items-center">
      <q-btn flat round dense color="white" icon="arrow_back" @click="$router.back()" />
      <div class="text-h6 text-white q-ml-md">Escanear Menú</div>
    </div>

    <div class="q-pa-md">
      <!-- 1. SECCIÓN DE CARGA / LISTA -->
      <div v-if="!menusDiarios.length" class="scan-container shadow-2 q-pa-lg bg-white rounded-xl">
        <div v-if="!selectedImage" class="upload-section column items-center justify-center q-gutter-md q-py-xl">
          <q-icon name="image" size="100px" color="grey-4" />
          <div class="text-h6 text-grey-7 text-center">Sube una foto del menú</div>
          <q-file
            v-model="file"
            label="Seleccionar imagen"
            accept="image/*"
            outlined
            class="full-width"
            @update:model-value="onImageSelected"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
          
          <div class="row q-gutter-sm full-width">
            <q-btn
              color="primary"
              icon="camera_alt"
              label="Tomar Foto"
              class="col"
              @click="capturePhoto"
            />
          </div>
        </div>

        <div v-else class="preview-section">
          <div class="relative-position">
            <q-img :src="imagePreview" class="rounded-lg shadow-1" />
            <q-btn
              fab
              color="negative"
              icon="close"
              class="absolute-top-right q-ma-sm"
              size="sm"
              @click="clearImage"
              :disabled="loading"
            />
          </div>

          <div class="q-mt-lg">
            <q-btn
              color="primary"
              label="Escanear"
              icon="auto_awesome"
              class="full-width py-md rounded-lg text-bold"
              size="lg"
              :loading="loading"
              @click="scanWithAI"
            />
          </div>
        </div>
      </div>

      <!-- 2. RESULTADOS DEL ESCANEO -->
      <div v-else>
        <div class="row items-center q-mb-md">
          <div class="text-h6 text-grey-8">Menús Detectados</div>
          <q-space />
          <q-btn 
            color="primary" 
            label="Guardar Todos" 
            icon="save_all"
            @click="handleGuardarMenu"
            :loading="loading"
            :disabled="savingAll"
          />
        </div>

        <div v-for="(dia, index) in menusDiarios" :key="index" class="q-mb-md">
          <q-card flat bordered class="rounded-lg">
            <q-card-section>
              <div class="row items-center no-wrap">
                <div class="column">
                  <div class="text-subtitle1 text-weight-bold text-primary">{{ dia.dia_semana }}</div>
                  <div class="text-caption text-grey-7">{{ formatearFecha(dia.fecha) }}</div>
                </div>
                <q-space />
                <q-btn 
                  flat 
                  round 
                  color="primary" 
                  icon="save" 
                  @click="handleGuardarMenuDia(dia, index)"
                  :loading="savingDayIndex === index"
                >
                  <q-tooltip>Guardar este día</q-tooltip>
                </q-btn>
              </div>

              <q-separator class="q-my-sm" />

              <div class="q-gutter-y-xs">
                <div v-for="(comida, cIdx) in dia.comidas" :key="cIdx" class="row items-center no-wrap">
                  <q-icon name="circle" size="8px" color="grey-4" class="q-mr-sm" />
                  <div class="text-body2">{{ comida }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <q-btn 
          flat 
          color="grey-6" 
          label="Cancelar y volver a escanear" 
          class="full-width q-mt-md"
          @click="resetScan"
          :disabled="loading"
        />
      </div>

      <!-- Estado de carga inferior -->
      <div v-if="loading" class="q-mt-xl text-center">
        <q-spinner-dots color="primary" size="40px" />
        <div class="text-subtitle1 text-grey-7 q-mt-md">{{ loadingStatus }}</div>
      </div>
    </div>

    <!-- Diálogo de confirmación para reemplazar -->
    <q-dialog v-model="confirmReplace.show" persistent>
      <q-card style="min-width: 300px" class="rounded-lg">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">
            {{ confirmReplace.isGeneral 
                ? 'Ya existen menús para algunas de las fechas detectadas. ¿Deseas reemplazarlos?' 
                : `Ya existe un menú para el ${confirmReplace.dia?.dia_semana}. ¿Deseas reemplazarlo?` 
            }}
          </span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn 
            flat 
            label="Reemplazar" 
            color="primary" 
            @click="confirmAction" 
            v-close-popup 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Input oculto para cámara -->
    <input type="file" ref="cameraInput" accept="image/*" capture="environment" class="hidden" @change="onCameraChange" />
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, date } from 'quasar'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../supabase'

export default defineComponent({
  name: 'ScanMenuPage',
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    
    // Estados básicos
    const file = ref(null)
    const selectedImage = ref(null)
    const imagePreview = ref(null)
    const cameraInput = ref(null)
    
    // Estados de proceso
    const loading = ref(false)
    const loadingStatus = ref('')
    const menusDiarios = ref([])
    const savingDayIndex = ref(null)
    const savingAll = ref(false)
    
    // Confirmación
    const confirmReplace = reactive({
      show: false,
      dia: null,
      index: null,
      isGeneral: false
    })

    const onImageSelected = (val) => {
      if (val) {
        selectedImage.value = val
        imagePreview.value = URL.createObjectURL(val)
      }
    }

    const capturePhoto = () => { cameraInput.value.click() }
    
    const onCameraChange = (e) => {
      const capturedFile = e.target.files[0]
      if (capturedFile) {
        selectedImage.value = capturedFile
        imagePreview.value = URL.createObjectURL(capturedFile)
      }
    }

    const clearImage = () => {
      selectedImage.value = null
      imagePreview.value = null
      file.value = null
    }

    const resetScan = () => {
      menusDiarios.value = []
      clearImage()
    }

    const formatearFecha = (f) => {
      if (!f) return ''
      const [y, m, d] = f.split('-')
      return date.formatDate(new Date(y, m - 1, d), 'dddd D [de] MMMM', {
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      })
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

    // 1. ESCANEO DE IMAGEN
    const scanWithAI = async () => {
      if (!selectedImage.value) return
      
      loading.value = true
      loadingStatus.value = 'Gemini está analizando la imagen...'
      menusDiarios.value = []

      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('API Key no encontrada')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' })

        const imagePart = await fileToGenerativePart(selectedImage.value)
        const prompt = `
          Analiza esta imagen y extrae el menú de comida detallado por días.
          
          Devuelve estrictamente un JSON con esta estructura:
          {
            "menus": [
              {
                "dia_semana": "Lunes",
                "fecha": "YYYY-MM-DD",
                "comidas": ["Platillo 1", "Platillo 2"]
              }
            ]
          }
          
          Consideraciones:
          - Si no hay fecha explícita, usa hoy (${new Date().toISOString().split('T')[0]}) como referencia para calcular el resto de la semana.
          - Si la imagen muestra un menú semanal, extrae cada día por separado.
          - Solo devuelve el JSON, sin texto adicional ni backticks.
        `

        const result = await model.generateContent([prompt, imagePart])
        const text = result.response.text()
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        
        const extracted = JSON.parse(cleanJson)
        if (extracted.menus) {
          menusDiarios.value = extracted.menus
        } else {
          throw new Error('No se detectaron menús')
        }
      } catch (error) {
        console.error('Scan Error:', error)
        $q.notify({ type: 'negative', message: 'Error: ' + error.message })
      } finally {
        loading.value = false
      }
    }

    // 2. VERIFICACIÓN Y GUARDADO
    const checkExistingMenu = async (fecha) => {
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('id')
          .eq('fecha_menu', fecha)
          .maybeSingle()
        if (error) throw error
        return data
      } catch (err) {
        console.error('Check Error:', err)
        return null
      }
    }

    const executeGeneralSave = async (forceReplace) => {
      loading.value = true
      savingAll.value = true
      loadingStatus.value = 'Guardando todos los menús...'

      try {
        const total = menusDiarios.value.length
        for (let i = 0; i < total; i++) {
          const dia = menusDiarios.value[i]
          savingDayIndex.value = i
          
          const content = {
            dia_semana: dia.dia_semana,
            fecha: dia.fecha,
            comidas: dia.comidas
          }

          const existing = await checkExistingMenu(dia.fecha)
          
          if (existing && !forceReplace) {
            continue
          }

          let result;
          if (existing) {
            // Si existe, actualizamos por ID
            result = await supabase
              .from('menus')
              .update({
                contenido_menu: JSON.stringify(content)
              })
              .eq('id', existing.id)
          } else {
            // Si no existe, insertamos nuevo
            result = await supabase
              .from('menus')
              .insert({
                fecha_menu: dia.fecha,
                contenido_menu: JSON.stringify(content)
              })
          }

          if (result.error) throw result.error

          if (i < (total - 1)) {
            loadingStatus.value = `Esperando... (${i+1}/${total})`
            await new Promise(r => setTimeout(r, 2000))
          }
        }

        $q.notify({ type: 'positive', message: '¡Todos los menús guardados!' })
        router.push('/menus')
      } catch (error) {
        console.error('Save Error:', error)
        $q.notify({ type: 'negative', message: 'Error guardando: ' + error.message })
      } finally {
        loading.value = false
        savingDayIndex.value = null
        savingAll.value = false
      }
    }

    const handleGuardarMenu = async () => {
      if (!menusDiarios.value.length) return

      let hasDuplicates = false
      for (const dia of menusDiarios.value) {
        const exists = await checkExistingMenu(dia.fecha)
        if (exists) {
          hasDuplicates = true
          break
        }
      }

      if (hasDuplicates) {
        confirmReplace.show = true
        confirmReplace.isGeneral = true
        confirmReplace.dia = null
        return
      }

      await executeGeneralSave(false)
    }

    const handleGuardarMenuDia = async (dia, index, forceReplace = false) => {
      let existing = null;
      if (!forceReplace) {
        existing = await checkExistingMenu(dia.fecha)
        if (existing) {
          confirmReplace.show = true
          confirmReplace.isGeneral = false
          confirmReplace.dia = dia
          confirmReplace.index = index
          return
        }
      } else {
        // Si es forceReplace, necesitamos el ID si existe
        existing = await checkExistingMenu(dia.fecha)
      }

      savingDayIndex.value = index
      try {
        const content = {
          dia_semana: dia.dia_semana,
          fecha: dia.fecha,
          comidas: dia.comidas
        }

        let result;
        if (existing) {
          result = await supabase
            .from('menus')
            .update({
              contenido_menu: JSON.stringify(content)
            })
            .eq('id', existing.id)
        } else {
          result = await supabase
            .from('menus')
            .insert({
              fecha_menu: dia.fecha,
              contenido_menu: JSON.stringify(content)
            })
        }

        if (result.error) throw result.error
        $q.notify({ type: 'positive', message: `Menú del ${dia.dia_semana} guardado` })
      } catch (err) {
        $q.notify({ type: 'negative', message: 'Error: ' + err.message })
      } finally {
        savingDayIndex.value = null
      }
    }

    const confirmAction = () => {
      if (confirmReplace.isGeneral) {
        executeGeneralSave(true)
      } else {
        handleGuardarMenuDia(confirmReplace.dia, confirmReplace.index, true)
      }
    }

    return {
      file, selectedImage, imagePreview, cameraInput,
      loading, loadingStatus, menusDiarios, savingDayIndex, savingAll,
      confirmReplace,
      onImageSelected, capturePhoto, onCameraChange, clearImage, resetScan,
      scanWithAI, handleGuardarMenu, handleGuardarMenuDia,
      confirmAction, formatearFecha
    }
  }
})
</script>

<style scoped>
.bg-gray-1 { background-color: #f5f5f5; min-height: 100vh; }
.top-nav-bar { background-color: #3498db; color: white; }
.scan-container { border-radius: 20px; }
.rounded-lg { border-radius: 12px; }
.rounded-xl { border-radius: 20px; }
.py-md { padding-top: 16px; padding-bottom: 16px; }

/* Limitar tamaño de la imagen de vista previa */
.preview-section .q-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

@media (max-width: 600px) {
  .preview-section .q-img {
    max-height: 300px;
  }
}
</style>
