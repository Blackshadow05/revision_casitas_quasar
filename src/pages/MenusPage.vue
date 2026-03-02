<template>
  <q-page class="bg-page">
    <!-- Header Personalizado (Azul como en la imagen) -->
    <div class="top-nav-bar q-pa-md row items-center justify-between">
      <div style="width: 40px"></div>
      <div class="text-h6 text-white text-weight-medium">Menús</div>
      <q-btn
        v-if="isLoggedIn"
        flat
        dense
        color="white"
        icon="document_scanner"
        label="Escanear"
        to="/menus/scan"
        class="text-weight-bold"
      />
    </div>

    <div class="q-pa-md">
      <!-- Loading State -->
      <div v-if="loading && menus.length === 0" class="flex flex-center q-my-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <!-- Content -->
      <div v-else>
        <!-- SECCIÓN: MENÚ DE HOY -->
        <div v-if="todayMenu" class="q-mb-xl">
          <div class="modern-menu-card orange-theme">
            <!-- Header de la tarjeta -->
            <div class="card-top-section row items-center no-wrap">
              <div class="icon-container orange-gradient shadow-orange">
                <q-icon name="calendar_today" color="white" size="24px" />
              </div>
              <div class="column q-ml-md flex-grow">
                <div class="text-overline text-orange-9 text-weight-bolder" style="line-height: 1">MENÚ DE HOY</div>
                <div class="text-h5 text-weight-bold text-grey-9">{{ formatDayName(todayMenu.fecha_menu) }}</div>
                <div class="text-body2 text-grey-6">Hoy</div>
              </div>
              <div class="day-badge-circle orange-gradient shadow-orange">
                {{ formatDayNumber(todayMenu.fecha_menu) }}
              </div>
            </div>

            <!-- Caja de Platillos -->
            <div class="content-container">
              <div class="platillo-box">
                <div class="text-overline text-orange-9 text-weight-bold q-mb-xs">PLATILLO</div>
                <div class="q-gutter-y-xs">
                  <div v-for="(item, idx) in parseMenuItems(todayMenu.contenido_menu)" :key="idx" class="row items-start no-wrap q-py-xs">
                    <q-icon name="play_arrow" color="orange-8" size="14px" class="q-mt-xs q-mr-sm" />
                    <div class="text-body1 text-weight-medium text-grey-9">{{ item }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: PRÓXIMOS MENÚS -->
        <div v-if="upcomingMenus.length > 0">
          <div class="row items-center q-mb-md q-px-sm">
            <div class="section-icon-box q-mr-sm">
              <q-icon name="auto_awesome" color="primary" size="20px" />
            </div>
            <div class="text-h6 text-weight-bold text-blue-9">Próximos Menús</div>
            <q-space />
            <q-badge rounded color="blue-1" text-color="primary" class="q-px-sm text-weight-bold">
              {{ upcomingMenus.length }}
            </q-badge>
          </div>

          <div v-for="menu in upcomingMenus" :key="menu.id" class="modern-menu-card blue-theme q-mb-lg">
            <!-- Header de la tarjeta -->
            <div class="card-top-section row items-center no-wrap">
              <div class="icon-container blue-gradient shadow-blue">
                <q-icon name="local_cafe" color="white" size="24px" />
              </div>
              <div class="column q-ml-md flex-grow">
                <div class="text-overline text-primary text-weight-bolder" style="line-height: 1">PRÓXIMO MENÚ</div>
                <div class="text-h5 text-weight-bold text-grey-9">{{ formatDayName(menu.fecha_menu) }}</div>
                <div class="text-body2 text-grey-6">{{ getRelativeLabel(menu.fecha_menu) }}</div>
              </div>
              <div class="day-badge-circle blue-gradient shadow-blue">
                {{ formatDayNumber(menu.fecha_menu) }}
              </div>
            </div>

            <!-- Caja de Platillos -->
            <div class="content-container">
              <div class="platillo-box">
                <div class="text-overline text-primary text-weight-bold q-mb-xs">PLATILLO</div>
                <div class="q-gutter-y-xs">
                  <div v-for="(item, idx) in parseMenuItems(menu.contenido_menu)" :key="idx" class="row items-start no-wrap q-py-xs">
                    <q-icon name="play_arrow" color="primary" size="14px" class="q-mt-xs q-mr-sm" />
                    <div class="text-body1 text-weight-medium text-grey-9">{{ item }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="menus.length === 0 && !loading" class="flex column flex-center q-mt-xl text-center">
          <q-icon name="restaurant" size="80px" color="grey-3" />
          <div class="text-h6 text-grey-5 q-mt-md">No hay menús disponibles por ahora</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { supabase } from '../supabase'
import { date, useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'MenusPage',
  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const menus = ref([])
    const authStore = useAuthStore()
    const isLoggedIn = computed(() => authStore.isLoggedIn)

    // Función para obtener la fecha local en formato YYYY-MM-DD
    const getLocalDateString = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const fetchMenus = async () => {
      loading.value = true
      try {
        const today = new Date()
        const formattedToday = getLocalDateString(today)

        // Pedimos menús de los últimos 10 días ordenados por fecha
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 2) // Para asegurar que agarramos hoy y próximos
        
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .gte('fecha_menu', formattedToday) // Empezamos desde hoy para coincidir con el diseño de "Hoy" y "Próximos"
          .order('fecha_menu', { ascending: true })

        if (error) throw error
        menus.value = data
      } catch (error) {
        console.error('Error fetching menus:', error)
      } finally {
        loading.value = false
      }
    }

    const todayMenu = computed(() => {
      const todayStr = getLocalDateString(new Date())
      return menus.value.find(m => m.fecha_menu === todayStr) || (menus.value.length > 0 ? menus.value[0] : null)
    })

    const upcomingMenus = computed(() => {
      if (!todayMenu.value) return []
      return menus.value.filter(m => m.id !== todayMenu.value.id)
    })

    const formatDayName = (val) => {
      if (!val) return ''
      const [year, month, day] = val.split('-')
      const d = new Date(year, month - 1, day)
      const name = date.formatDate(d, 'dddd', {
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      })
      return name.charAt(0).toUpperCase() + name.slice(1)
    }

    const formatDayNumber = (val) => {
      if (!val) return ''
      return val.split('-')[2]
    }

    const getRelativeLabel = (val) => {
      if (!val) return ''
      const [year, month, day] = val.split('-')
      const targetDate = new Date(year, month - 1, day)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)

      const diff = date.getDateDiff(targetDate, now, 'days')
      if (diff === 0) return 'Hoy'
      if (diff === 1) return 'Mañana'
      return date.formatDate(targetDate, 'D [de] MMMM', {
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      })
    }

    const parseMenuItems = (content) => {
      if (!content) return []
      
      let items = []
      
      // Intentar parsear si es JSON
      try {
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          const parsed = JSON.parse(content)
          if (parsed.comidas && Array.isArray(parsed.comidas)) {
            // Unir todos los strings en comidas y luego separarlos por saltos de línea
            items = parsed.comidas.join('\n').split('\n')
          } else if (Array.isArray(parsed)) {
            items = parsed
          }
        } else {
          // Si no es JSON o falla el parseo, tratarlo como string normal
          items = content.split('\n')
        }
      } catch (e) {
        // En caso de error de parseo, tratar como string normal
        items = content.split('\n')
      }
      
      return items
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => item.replace(/^[•\-\*]\s*/, ''))
    }

    onMounted(() => {
      fetchMenus()
    })

    return {
      loading,
      menus,
      todayMenu,
      upcomingMenus,
      formatDayName,
      formatDayNumber,
      getRelativeLabel,
      parseMenuItems,
      isLoggedIn
    }
  }
})
</script>

<style scoped>
.bg-page {
  background-color: #f7f9fc;
  min-height: 100vh;
}

.top-nav-bar {
  background-color: #3498db;
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Card Base Styles */
.modern-menu-card {
  background-color: white;
  border-radius: 35px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0,0,0,0.02);
}

.card-top-section {
  padding: 25px 25px 15px;
}

/* Themes */
.orange-theme {
  background: linear-gradient(180deg, #fff9f0 0%, #ffffff 40%);
}

.blue-theme {
  background: linear-gradient(180deg, #f0f8ff 0%, #ffffff 40%);
}

/* Icons and Badges */
.icon-container {
  width: 55px;
  height: 55px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orange-gradient {
  background: linear-gradient(135deg, #ffb347 0%, #ff8c00 100%);
}

.blue-gradient {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.shadow-orange {
  box-shadow: 0 8px 15px rgba(255, 140, 0, 0.3);
}

.shadow-blue {
  box-shadow: 0 8px 15px rgba(52, 152, 219, 0.3);
}

.day-badge-circle {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 18px;
}

/* Content Area */
.content-container {
  padding: 0 20px 20px;
}

.platillo-box {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 25px;
  padding: 20px;
  border: 1px solid rgba(0,0,0,0.04);
}

.orange-theme .platillo-box {
  background-color: #fffbf5;
  border: 1px solid #fff2e0;
}

.blue-theme .platillo-box {
  background-color: #fafdff;
  border: 1px solid #e1f0ff;
}

.section-icon-box {
  background-color: #e3f2fd;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-grow {
  flex-grow: 1;
}

/* Typography Adjustments */
.text-overline {
  font-size: 11px;
  letter-spacing: 1px;
}

.line-height-1 {
  line-height: 1;
}

@media (max-width: 400px) {
  .modern-menu-card {
    border-radius: 25px;
  }
}
</style>
