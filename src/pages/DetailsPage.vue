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
      <!-- Top Title Section -->
      <div class="q-px-lg q-pt-lg q-pb-md header-gradient" :class="{ 'rounded-top': images.length > 0 }">
        <div v-if="images.length === 0" class="row items-center q-mb-md">
           <q-btn flat round dense icon="arrow_back" color="dark" @click="$router.back()" />
        </div>
        <div class="text-h4 text-weight-bolder text-dark">Casita {{ casa.casita || '--' }}</div>
        <div class="text-subtitle1 text-grey-7 q-mb-md">Revisión completa</div>

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
        <div v-if="casa.notas" class="section-card shadow-1 q-mb-xl">
           <div class="row items-center q-mb-md">
             <q-icon name="notes" color="grey-7" size="20px" class="q-mr-sm" />
             <div class="text-weight-bold text-grey-8">Notas de revisión</div>
           </div>
           <div class="text-body2 text-grey-7 bg-grey-2 q-pa-md rounded-12">
             {{ casa.notas }}
           </div>
        </div>

      </div>

    </div>

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

  </q-page>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from 'vue'
import { useCasasStore } from '../stores/casas'
import { date } from 'quasar'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'DetailsPage',
  setup () {
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
        { key: 'steamer', label: 'Steamer', icon: 'iron', color: 'indigo', bgClass: 'bg-indigo-1' },
        { key: 'plancha_cabello', label: 'Plancha Cabello', icon: 'electric_bolt', color: 'pink', bgClass: 'bg-pink-1' },
        { key: 'binoculares', label: 'Binoculares', icon: 'visibility', color: 'green', bgClass: 'bg-green-1' },
        { key: 'trapo_binoculares', label: 'Trapo Binoculares', icon: 'cleaning_services', color: 'blue-grey', bgClass: 'bg-blue-grey-1' },
        { key: 'accesorios_secadora', label: 'Acc. Secadora', icon: 'extension', color: 'deep-orange', bgClass: 'bg-deep-orange-1' },
        { key: 'bolsa_vapor', label: 'Bolsa Vapor', icon: 'shopping_bag', color: 'light-blue', bgClass: 'bg-light-blue-1' },
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
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onWheel
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
</style>
