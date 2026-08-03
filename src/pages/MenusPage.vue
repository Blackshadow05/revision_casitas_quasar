<template>
  <q-page class="menus-page">
    <div class="menus-shell">
      <header class="menus-header">
        <div class="menus-header__copy">
          <div class="menus-eyebrow">Comedor</div>
          <h1 class="menus-title">Menús</h1>
        </div>

        <div class="menus-header__actions">
          <q-btn
            round
            flat
            dense
            icon="refresh"
            class="menus-icon-btn"
            :loading="loading && menus.length > 0"
            @click="fetchMenus"
          >
            <q-tooltip>Actualizar</q-tooltip>
          </q-btn>
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
      </header>

      <div v-if="loading && menus.length === 0" class="menus-skeleton">
        <q-skeleton class="menus-skeleton__hero" />
        <div class="menus-grid">
          <q-skeleton v-for="n in 3" :key="n" class="menus-skeleton__card" />
        </div>
      </div>

      <template v-else-if="menus.length > 0">
        <section v-if="featuredMenu" class="featured-section">
          <article class="today-card">
            <div class="today-card__aside">
              <div class="today-card__badge">
                <q-icon name="restaurant" size="15px" />
                <span>{{ isTodayFeatured ? 'Hoy' : 'Próximo servicio' }}</span>
              </div>

              <div class="today-card__day">{{ formatDayName(featuredMenu.fecha_menu) }}</div>
              <div class="today-card__date">{{ formatLongDate(featuredMenu.fecha_menu) }}</div>

              <div class="today-card__meta">
                <q-icon name="lunch_dining" size="14px" />
                <span>{{ featuredItems.length }} {{ featuredItems.length === 1 ? 'platillo' : 'platillos' }}</span>
              </div>
            </div>

            <div class="today-card__main">
              <div class="today-card__label">Platillos</div>

              <ul v-if="featuredItems.length > 0" class="today-card__list">
                <li
                  v-for="(item, idx) in featuredItems"
                  :key="idx"
                  class="today-item"
                  :style="{ animationDelay: `${idx * 45}ms` }"
                >
                  <span class="today-item__index">{{ idx + 1 }}</span>
                  <span class="today-item__text">{{ item }}</span>
                </li>
              </ul>

              <div v-else class="today-card__empty">Sin platillos registrados para este día.</div>
            </div>
          </article>
        </section>

        <section v-if="upcomingMenus.length > 0" class="upcoming-section">
          <div class="section-heading">
            <div>
              <div class="menus-eyebrow">Programación</div>
              <h2 class="section-title">Próximos días</h2>
            </div>
            <div class="section-count">{{ upcomingMenus.length }}</div>
          </div>

          <div class="menus-grid">
            <article
              v-for="(menu, idx) in upcomingMenus"
              :key="menu.id"
              class="menu-card"
              :style="{ animationDelay: `${Math.min(idx, 8) * 50}ms` }"
            >
              <header class="menu-card__head">
                <div class="menu-card__date">
                  <span class="menu-card__day-number">{{ formatDayNumber(menu.fecha_menu) }}</span>
                  <span class="menu-card__month">{{ formatMonthShort(menu.fecha_menu) }}</span>
                </div>

                <div class="menu-card__labels">
                  <div class="menu-card__day-name">{{ formatDayName(menu.fecha_menu) }}</div>
                  <div class="menu-card__relative">{{ getCountdownLabel(menu.fecha_menu) }}</div>
                </div>
              </header>

              <ul v-if="parseMenuItems(menu.contenido_menu).length > 0" class="menu-card__list">
                <li
                  v-for="(item, i) in parseMenuItems(menu.contenido_menu)"
                  :key="i"
                  class="menu-card__item"
                >
                  <span class="menu-card__bullet"></span>
                  <span>{{ item }}</span>
                </li>
              </ul>

              <div v-else class="menu-card__empty">Sin platillos registrados.</div>
            </article>
          </div>
        </section>
      </template>

      <div v-else class="empty-state">
        <div class="empty-state__icon">
          <q-icon name="restaurant" size="30px" />
        </div>
        <div class="empty-state__title">No hay menús disponibles</div>
        <div class="empty-state__caption">Cuando se carguen desde escaneo aparecerán aquí.</div>
        <q-btn
          v-if="isLoggedIn"
          unelevated
          no-caps
          icon="document_scanner"
          label="Escanear menú"
          to="/menus/scan"
          class="menus-scan-btn q-mt-md"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { notify } from '../utils/notify'
import { supabase } from '../supabase'
import { date } from 'quasar'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'MenusPage',
  setup() {
    const loading = ref(false)
    const menus = ref([])
    const authStore = useAuthStore()
    const isLoggedIn = computed(() => authStore.isLoggedIn)

    const monthsShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

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

    const featuredMenu = computed(() => {
      const todayStr = getLocalDateString(new Date())
      return menus.value.find(m => m.fecha_menu === todayStr) || (menus.value.length > 0 ? menus.value[0] : null)
    })

    const isTodayFeatured = computed(() => {
      if (!featuredMenu.value) return false
      return featuredMenu.value.fecha_menu === getLocalDateString(new Date())
    })

    const upcomingMenus = computed(() => {
      if (!featuredMenu.value) return []
      return menus.value.filter(m => m.id !== featuredMenu.value.id)
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

    const formatMonthShort = (val) => {
      const d = parseDateOnly(val)
      if (!d) return ''
      return monthsShort[d.getMonth()]
    }

    const formatLongDate = (val) => {
      const d = parseDateOnly(val)
      if (!d) return ''
      return date.formatDate(d, 'D [de] MMMM, YYYY', {
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      })
    }

    const getDayDiff = (val) => {
      const targetDate = parseDateOnly(val)
      if (!targetDate) return null
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)
      return date.getDateDiff(targetDate, now, 'days')
    }

    const getCountdownLabel = (val) => {
      const diff = getDayDiff(val)
      if (diff === null) return ''
      if (diff === 0) return 'Hoy'
      if (diff === 1) return 'Mañana'
      if (diff > 1) return `En ${diff} días`
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

    const featuredItems = computed(() => {
      if (!featuredMenu.value) return []
      return parseMenuItems(featuredMenu.value.contenido_menu)
    })

    onMounted(() => {
      fetchMenus()
    })

    return {
      loading,
      menus,
      fetchMenus,
      featuredMenu,
      featuredItems,
      isTodayFeatured,
      upcomingMenus,
      formatDayName,
      formatDayNumber,
      formatMonthShort,
      formatLongDate,
      getCountdownLabel,
      parseMenuItems,
      isLoggedIn
    }
  }
})
</script>

<style scoped>
.menus-page {
  background:
    radial-gradient(900px 420px at 100% -8%, rgba(0, 0, 0, 0.07), transparent 62%),
    linear-gradient(180deg, #f2f1ee 0%, #ffffff 26%, #f6f5f2 100%);
  color: var(--uber-black);
  font-family: var(--uber-font-body);
}

.menus-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: clamp(18px, 3vw, 30px) clamp(14px, 3vw, 28px) calc(96px + env(safe-area-inset-bottom));
  display: grid;
  gap: clamp(22px, 3vw, 34px);
  align-content: start;
}

.menus-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.menus-eyebrow {
  color: #8a8a86;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.menus-title {
  margin: 4px 0 0;
  font-family: var(--uber-font-display);
  font-size: clamp(1.9rem, 4.4vw, 2.9rem);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.menus-subtitle {
  margin: 8px 0 0;
  max-width: 42ch;
  color: #6f6f6b;
  font-size: 0.92rem;
  line-height: 1.5;
}

.menus-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menus-icon-btn {
  width: 44px;
  height: 44px;
  background: var(--uber-white);
  color: #111111;
  border: 1px solid var(--uber-border);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.menus-scan-btn {
  min-height: 44px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-black) !important;
  color: var(--uber-white) !important;
  font-weight: 700;
  padding: 0 20px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.menus-skeleton {
  display: grid;
  gap: clamp(22px, 3vw, 34px);
}

.menus-skeleton__hero {
  height: clamp(260px, 34vw, 300px);
  border-radius: 28px;
}

.menus-skeleton__card {
  height: 190px;
  border-radius: 24px;
}

.today-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: clamp(18px, 2.6vw, 32px);
  padding: clamp(22px, 3.2vw, 36px);
  border-radius: 28px;
  background:
    radial-gradient(130% 150% at 0% 0%, rgba(255, 255, 255, 0.12), transparent 58%),
    linear-gradient(158deg, #171717 0%, #090909 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.26);
  color: var(--uber-white);
  overflow: hidden;
  animation: menu-rise 0.4s ease both;
}

.today-card__aside {
  align-self: center;
}

.today-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 0 14px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-white);
  color: #0b0b0b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.today-card__day {
  margin-top: 18px;
  font-family: var(--uber-font-display);
  font-size: clamp(2rem, 5.2vw, 3.1rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.today-card__date {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.92rem;
  font-weight: 600;
}

.today-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  padding: 7px 12px;
  border-radius: var(--uber-radius-pill);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 700;
}

.today-card__main {
  padding-left: clamp(18px, 2.6vw, 32px);
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.today-card__label {
  color: rgba(255, 255, 255, 0.46);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.today-card__list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.today-item {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 13px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  animation: menu-rise 0.36s ease both;
}

.today-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.today-item__index {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 800;
}

.today-item__text {
  font-size: clamp(1rem, 1.7vw, 1.14rem);
  font-weight: 700;
  line-height: 1.38;
}

.today-card__empty {
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-title {
  margin: 4px 0 0;
  font-family: var(--uber-font-display);
  font-size: clamp(1.25rem, 2.4vw, 1.65rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.section-count {
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-white);
  border: 1px solid var(--uber-border);
  color: #111111;
  font-size: 13px;
  font-weight: 800;
}

.menus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
  gap: 14px;
}

.menu-card {
  display: grid;
  gap: 16px;
  align-content: start;
  padding: 18px;
  border-radius: 24px;
  background: var(--uber-white);
  border: 1px solid var(--uber-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: menu-rise 0.4s ease both;
}

.menu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.09);
}

.menu-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-card__date {
  display: grid;
  place-items: center;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #101010;
  color: var(--uber-white);
  line-height: 1;
}

.menu-card__day-number {
  font-family: var(--uber-font-display);
  font-size: 1.32rem;
  font-weight: 800;
}

.menu-card__month {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.menu-card__day-name {
  font-size: 1.02rem;
  font-weight: 800;
  color: #111111;
  letter-spacing: -0.01em;
}

.menu-card__relative {
  margin-top: 3px;
  color: #7d7d78;
  font-size: 12px;
  font-weight: 700;
}

.menu-card__list {
  margin: 0;
  padding: 14px 0 0;
  list-style: none;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  display: grid;
  gap: 10px;
}

.menu-card__item {
  display: grid;
  grid-template-columns: 6px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  color: #3a3a38;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
}

.menu-card__bullet {
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 50%;
  background: #111111;
  opacity: 0.32;
}

.menu-card__empty {
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  color: #9a9a95;
  font-size: 13px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 46vh;
  padding: 40px 20px;
  border-radius: 28px;
  background: var(--uber-white);
  border: 1px solid var(--uber-border);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.05);
}

.empty-state__icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: #f2f2ef;
  color: #9a9a95;
}

.empty-state__title {
  color: #111111;
  font-family: var(--uber-font-display);
  font-size: 1.15rem;
  font-weight: 800;
}

.empty-state__caption {
  margin-top: 6px;
  max-width: 34ch;
  color: #85857f;
  font-size: 13px;
  line-height: 1.5;
}

@keyframes menu-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 720px) {
  .menus-header {
    align-items: flex-start;
  }

  .menus-header__actions {
    width: 100%;
  }

  .menus-scan-btn {
    flex: 1;
  }

  .today-card {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .today-card__main {
    padding-left: 0;
    padding-top: 20px;
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }

  .menus-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .today-card,
  .today-item,
  .menu-card {
    animation: none;
  }

  .menu-card:hover {
    transform: none;
  }
}
</style>
