<template>
  <q-page class="menus-page">
    <div class="menus-topbar">
      <div>
        <div class="menus-eyebrow">Comedor</div>
        <h1 class="menus-title">Menús</h1>
      </div>
      <q-btn
        v-if="isLoggedIn"
        unelevated
        no-caps
        icon="document_scanner"
        label="Escanear"
        to="/menus/scan"
        class="menus-scan-btn"
      />
    </div>

    <div class="menus-shell">
      <div v-if="loading && menus.length === 0" class="menus-loading">
        <q-spinner-dots color="dark" size="40px" />
        <div>Cargando menús</div>
      </div>

      <div v-else class="content-wrapper">
        <section v-if="todayMenu" class="today-menu-section">
          <div class="section-heading">
            <div>
              <div class="menus-eyebrow">Servicio actual</div>
              <h2>Menú del día</h2>
            </div>
            <div class="today-date-pill">
              <q-icon name="today" size="18px" />
              <span>{{ getRelativeLabel(todayMenu.fecha_menu) }}</span>
            </div>
          </div>

          <article class="today-menu-card">
            <div class="today-menu-card__date">
              <div class="today-menu-card__day">{{ formatDayName(todayMenu.fecha_menu) }}</div>
              <div class="today-menu-card__full-date">{{ formatLongDate(todayMenu.fecha_menu) }}</div>
            </div>

            <div class="today-menu-card__content">
              <div class="menu-items-label">Platillos</div>
              <div class="today-menu-items">
                <div
                  v-for="(item, idx) in parseMenuItems(todayMenu.contenido_menu)"
                  :key="idx"
                  class="today-menu-item"
                >
                  <q-icon name="restaurant_menu" size="18px" />
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section v-if="upcomingMenus.length > 0" class="other-menus-section">
          <div class="section-heading">
            <div>
              <div class="menus-eyebrow">Programación</div>
              <h2>Otros días</h2>
            </div>
            <div class="menus-count">{{ upcomingMenus.length }}</div>
          </div>

          <div class="menus-grid">
            <article v-for="menu in upcomingMenus" :key="menu.id" class="menu-card">
              <div class="menu-card__date">
                <div class="menu-card__number">{{ formatDayNumber(menu.fecha_menu) }}</div>
                <div>
                  <div class="menu-card__day">{{ formatDayName(menu.fecha_menu) }}</div>
                  <div class="menu-card__relative">{{ getRelativeLabel(menu.fecha_menu) }}</div>
                </div>
              </div>

              <div class="menu-card__items">
                <div
                  v-for="(item, idx) in parseMenuItems(menu.contenido_menu)"
                  :key="idx"
                  class="menu-card__item"
                >
                  <q-icon name="fiber_manual_record" size="8px" />
                  <span>{{ item }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <div v-if="menus.length === 0 && !loading" class="empty-state">
          <q-icon name="restaurant" size="56px" color="grey-5" />
          <div>
            <div class="empty-state__title">No hay menús disponibles</div>
            <div class="empty-state__caption">Cuando se carguen desde escaneo aparecerán aquí.</div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { notify } from '../utils/notify'
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

    const getLocalDateString = (dateValue) => {
      const year = dateValue.getFullYear()
      const month = String(dateValue.getMonth() + 1).padStart(2, '0')
      const day = String(dateValue.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const parseDateOnly = (val) => {
      if (!val) return null
      const [year, month, day] = val.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const fetchMenus = async () => {
      loading.value = true
      try {
        const today = new Date()
        const formattedToday = getLocalDateString(today)

        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .gte('fecha_menu', formattedToday)
          .order('fecha_menu', { ascending: true })

        if (error) throw error
        menus.value = data
      } catch (error) {
        console.error('Error fetching menus:', error)
        notify({ type: 'negative', message: 'Error al cargar menús' })
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
      const d = parseDateOnly(val)
      if (!d) return ''
      const name = date.formatDate(d, 'dddd', {
        days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      })
      return name.charAt(0).toUpperCase() + name.slice(1)
    }

    const formatDayNumber = (val) => {
      if (!val) return ''
      return val.split('-')[2]
    }

    const formatLongDate = (val) => {
      const d = parseDateOnly(val)
      if (!d) return ''
      return date.formatDate(d, 'D [de] MMMM, YYYY', {
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      })
    }

    const getRelativeLabel = (val) => {
      const targetDate = parseDateOnly(val)
      if (!targetDate) return ''
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)

      const diff = date.getDateDiff(targetDate, now, 'days')
      if (diff === 0) return 'Hoy'
      if (diff === 1) return 'Mañana'
      return formatLongDate(val)
    }

    const parseMenuItems = (content) => {
      if (!content) return []

      let items = []

      try {
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          const parsed = JSON.parse(content)
          if (parsed.comidas && Array.isArray(parsed.comidas)) {
            items = parsed.comidas.join('\n').split('\n')
          } else if (Array.isArray(parsed)) {
            items = parsed
          }
        } else {
          items = content.split('\n')
        }
      } catch (e) {
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
      formatLongDate,
      getRelativeLabel,
      parseMenuItems,
      isLoggedIn
    }
  }
})
</script>

<style scoped>
.menus-page {
  min-height: 100vh;
  background:
    linear-gradient(180deg, #f4f4f2 0%, #ffffff 34%, #f7f7f5 100%);
  color: var(--uber-black);
  font-family: var(--uber-font-body);
}

.menus-topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px clamp(16px, 4vw, 44px);
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--uber-border);
  backdrop-filter: blur(16px);
}

.menus-eyebrow {
  color: #6b6b6b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.menus-title {
  margin: 2px 0 0;
  font-family: var(--uber-font-display);
  font-size: clamp(1.45rem, 3vw, 2.1rem);
  line-height: 1;
  font-weight: 800;
}

.menus-scan-btn {
  min-height: 42px;
  border-radius: 999px;
  background: var(--uber-black) !important;
  color: var(--uber-white) !important;
  font-weight: 800;
  padding: 0 18px;
}

.menus-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 22px clamp(14px, 3vw, 28px) 96px;
}

.menus-loading,
.empty-state {
  min-height: 52vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #6b6b6b;
  text-align: center;
}

.content-wrapper {
  display: grid;
  gap: 28px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.section-heading h2 {
  margin: 3px 0 0;
  font-family: var(--uber-font-display);
  font-size: clamp(1.3rem, 2.4vw, 1.8rem);
  line-height: 1.05;
}

.today-date-pill,
.menus-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 13px;
  border-radius: 999px;
  background: var(--uber-chip-gray);
  color: var(--uber-black);
  font-size: 13px;
  font-weight: 800;
}

.today-menu-card {
  display: grid;
  grid-template-columns: minmax(210px, 0.72fr) minmax(0, 1.28fr);
  gap: 1px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: var(--uber-shadow-medium);
}

.today-menu-card__date {
  padding: clamp(22px, 4vw, 34px);
  background: #000000;
  color: #ffffff;
}

.today-menu-card__day {
  font-family: var(--uber-font-display);
  font-size: clamp(2.2rem, 6vw, 4.4rem);
  font-weight: 900;
  line-height: 0.94;
}

.today-menu-card__full-date {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.66);
  font-size: 14px;
  font-weight: 700;
}

.today-menu-card__content {
  padding: clamp(22px, 4vw, 34px);
  background: #171717;
  color: #ffffff;
}

.menu-items-label {
  color: rgba(255, 255, 255, 0.52);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.today-menu-items {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.today-menu-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  font-size: clamp(1.02rem, 2vw, 1.22rem);
  font-weight: 800;
  line-height: 1.35;
}

.today-menu-item:last-child {
  border-bottom: 0;
}

.today-menu-item .q-icon {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.72);
}

.menus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.menu-card {
  display: grid;
  gap: 18px;
  align-content: start;
  min-height: 100%;
  padding: 18px;
  border-radius: 8px;
  background: var(--uber-white);
  border: 1px solid var(--uber-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.menu-card__date {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-card__number {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 8px;
  background: #f0f0ed;
  color: #111111;
  font-family: var(--uber-font-display);
  font-size: 1.28rem;
  font-weight: 900;
}

.menu-card__day {
  font-size: 1.05rem;
  font-weight: 900;
  color: #111111;
}

.menu-card__relative {
  margin-top: 2px;
  color: #717171;
  font-size: 12px;
  font-weight: 700;
}

.menu-card__items {
  display: grid;
  gap: 9px;
}

.menu-card__item {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  color: #333333;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.menu-card__item .q-icon {
  margin-top: 7px;
  color: #111111;
}

.empty-state {
  background: var(--uber-white);
  border: 1px solid var(--uber-border);
  border-radius: 8px;
}

.empty-state__title {
  color: #111111;
  font-size: 1.05rem;
  font-weight: 900;
}

.empty-state__caption {
  margin-top: 4px;
  color: #777777;
  font-size: 13px;
}

@media (max-width: 720px) {
  .menus-topbar {
    padding: 14px 16px;
  }

  .menus-scan-btn {
    padding: 0 12px;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
  }

  .today-menu-card {
    grid-template-columns: 1fr;
  }

  .menus-grid {
    grid-template-columns: 1fr;
  }
}
</style>
