<template>
  <q-page class="lost-found-list-page">
    <div class="lf-uber-page">
      <section class="lf-hero">
        <div class="lf-hero__topbar">
          <q-btn flat round dense icon="arrow_back" class="lf-back-btn" @click="router.push('/seguridad')" />
          <div class="lf-hero__section-label">Seguridad</div>
          <div class="lf-hero__count">{{ formatCount(filteredItems.length) }}</div>
        </div>

        <div class="lf-hero__grid">
          <div class="lf-hero__copy">
            <div class="lf-kicker">Lost &amp; Found Desk</div>
            <h1 class="lf-hero__title lf-hero__title--small">Objetos perdidos</h1>

            <div class="lf-hero__actions">
              <q-btn
                no-caps
                unelevated
                rounded
                icon="add"
                label="Registrar objeto"
                class="lf-primary-btn"
                @click="router.push('/seguridad/objetos-perdidos/nuevo')"
                :disable="!isLoggedIn"
              />
              <q-btn
                no-caps
                flat
                rounded
                icon="north_west"
                label="Volver al menú"
                class="lf-secondary-btn"
                @click="router.push('/seguridad')"
              />
            </div>

            <div v-if="!isLoggedIn" class="lf-auth-hint">
              Solo usuarios autenticados pueden registrar nuevos objetos.
            </div>
          </div>

          <div class="lf-hero__stats">
            <article v-for="stat in heroStats" :key="stat.label" class="lf-stat-card">
              <div class="lf-stat-card__label">{{ stat.label }}</div>
              <div class="lf-stat-card__value">{{ formatCount(stat.value) }}</div>
              <div class="lf-stat-card__meta">{{ stat.meta }}</div>
            </article>
          </div>
        </div>
      </section>

      <section class="lf-main-grid">
        <aside class="lf-sidebar">
          <div class="lf-panel lf-panel--filters">
            <div class="lf-panel__eyebrow">Búsqueda</div>
            <div class="lf-panel__title">Filtra por texto, boleta o ubicación.</div>

            <q-input
              v-model="searchTerm"
              outlined
              dense
              placeholder="Buscar por objeto, boleta, responsable o zona..."
              class="lf-search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="searchTerm" name="close" class="cursor-pointer" @click="searchTerm = ''" />
              </template>
            </q-input>

            <div class="lf-filter-label">Estado</div>
            <div class="lf-filter-chips">
              <q-chip
                v-for="option in filterOptions"
                :key="option.value || 'all'"
                clickable
                :class="['lf-filter-chip', { 'lf-filter-chip--active': statusFilter === option.value }]"
                @click="statusFilter = option.value"
              >
                <q-icon :name="option.icon" size="14px" class="q-mr-xs" />
                {{ option.label }}
              </q-chip>
            </div>

            <div class="lf-filter-summary">
              <div>
                <span class="lf-filter-summary__label">Visibles</span>
                <strong>{{ filteredItems.length }}</strong>
              </div>
              <div>
                <span class="lf-filter-summary__label">Último ingreso</span>
                <strong>{{ latestActivityLabel }}</strong>
              </div>
            </div>

            <q-btn
              v-if="hasActiveFilters"
              no-caps
              flat
              rounded
              label="Limpiar filtros"
              class="lf-clear-btn"
              @click="clearFilters"
            />
          </div>
        </aside>

        <div class="lf-content">
          <div class="lf-results-head">
            <div>
              <h2 class="lf-results-title">{{ filteredItems.length }} objetos visibles</h2>
            </div>
            <div class="lf-results-tag">{{ hasActiveFilters ? 'Filtros activos' : 'Vista completa' }}</div>
          </div>

          <div v-if="loading" class="lf-state-card">
            <q-spinner color="dark" size="42px" />
            <div class="lf-state-card__title">Cargando inventario</div>
            <div class="lf-state-card__text">Consultando registros recientes de objetos perdidos.</div>
          </div>

          <div v-else-if="filteredItems.length > 0" class="lf-card-grid">
            <article
              v-for="item in filteredItems"
              :key="item.id"
              class="lf-record-card"
              @click="router.push(`/seguridad/objetos-perdidos/${item.id}`)"
            >
              <div class="lf-record-card__media">
                <q-img
                  v-if="item.image_url"
                  :src="getCloudinaryUrl(item.image_url, 'w_720,h_720,c_fill,q_auto')"
                  :ratio="1"
                  spinner-color="dark"
                  class="lf-record-card__image"
                />
                <div v-else class="lf-record-card__placeholder">
                  <q-icon name="inventory_2" size="36px" />
                </div>
              </div>

              <div class="lf-record-card__body">
                <div class="lf-record-card__top">
                  <div>
                    <div class="lf-record-card__title">{{ getItemTitle(item) }}</div>
                    <div class="lf-record-card__date">{{ formatExactDate(item.found_at || item.created_at) }}</div>
                  </div>
                  <div :class="['lf-status-pill', `lf-status-pill--${getStatusTone(item.status)}`]">
                    {{ item.status || 'Sin estado' }}
                  </div>
                </div>

                <div class="lf-record-card__facts">
                  <div class="lf-fact-pill">
                    <q-icon name="place" size="14px" />
                    <span>{{ getItemLocation(item) }}</span>
                  </div>
                  <div class="lf-fact-pill">
                    <q-icon name="confirmation_number" size="14px" />
                    <span>{{ getItemTicket(item) }}</span>
                  </div>
                </div>

                <p class="lf-record-card__description">{{ getItemDescription(item) }}</p>

                <div class="lf-record-card__footer">
                  <div>
                    <div class="lf-record-card__footer-label">Recibido por</div>
                    <div class="lf-record-card__footer-value">{{ getItemFoundBy(item) }}</div>
                  </div>
                  <q-btn flat round dense icon="north_east" class="lf-card-action" />
                </div>
              </div>
            </article>
          </div>

          <div v-else class="lf-state-card lf-state-card--empty">
            <q-icon :name="hasActiveFilters ? 'search_off' : 'inventory_2'" size="54px" />
            <div class="lf-state-card__title">{{ hasActiveFilters ? 'Sin coincidencias' : 'Sin objetos registrados' }}</div>
            <div class="lf-state-card__text">
              {{ hasActiveFilters ? 'Ajusta la búsqueda o cambia el estado para encontrar registros.' : 'Cuando se registre un hallazgo aparecerá aquí con su foto y trazabilidad.' }}
            </div>
            <q-btn
              v-if="hasActiveFilters"
              no-caps
              unelevated
              rounded
              label="Restablecer filtros"
              class="lf-primary-btn"
              @click="clearFilters"
            />
          </div>
        </div>
      </section>

      <q-page-sticky v-if="isMobile" position="bottom" :offset="[0, 18]">
        <div class="lf-mobile-cta-wrap">
          <q-btn
            no-caps
            unelevated
            rounded
            icon="add"
            label="Registrar objeto"
            class="lf-mobile-cta"
            @click="router.push('/seguridad/objetos-perdidos/nuevo')"
            :disable="!isLoggedIn"
          />
        </div>
      </q-page-sticky>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'LostFoundListPage',
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()
    const quasar = useQuasar()
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const isMobile = computed(() => quasar.screen.lt.md)

    const loading = ref(true)
    const items = ref([])
    const searchTerm = ref('')
    const statusFilter = ref('')

    const statusOptions = ['Almacenado', 'Entregado', 'Desechado']
    const filterOptions = [
      { label: 'Todos', value: '', icon: 'apps' },
      { label: 'Almacenado', value: 'Almacenado', icon: 'warehouse' },
      { label: 'Entregado', value: 'Entregado', icon: 'check_circle' },
      { label: 'Desechado', value: 'Desechado', icon: 'delete' }
    ]

    const getStatusTone = (status) => {
      const map = { 'Almacenado': 'stored', 'Entregado': 'delivered', 'Desechado': 'discarded' }
      return map[status] || 'neutral'
    }

    const CLOUDINARY_BASE = 'https://res.cloudinary.com/dhd61lan4/image/upload'

    function getCloudinaryUrl (url, transforms) {
      if (!url) return ''
      if (url.startsWith('http')) {
        if (transforms && url.includes('/upload/')) {
          return url.replace('/upload/', `/upload/${transforms}/`)
        }
        return url
      }
      const cleanPath = url.replace(/^\/+/, '')
      return transforms ? `${CLOUDINARY_BASE}/${transforms}/${cleanPath}` : `${CLOUDINARY_BASE}/${cleanPath}`
    }

    const parseDateValue = (dateString) => {
      if (!dateString) return null
      const d = new Date(dateString)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const formatRelativeDate = (dateString) => {
      const date = parseDateValue(dateString)
      if (!date) return 'Sin fecha'
      const today = new Date()
      const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const targetMid = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const diff = Math.round((todayMid - targetMid) / 86400000)
      if (diff === 0) return 'Hoy'
      if (diff === 1) return 'Ayer'
      if (diff > 1 && diff < 7) return `Hace ${diff} días`
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      return `${dd}/${mm}`
    }

    const formatExactDate = (dateString) => {
      const date = parseDateValue(dateString)
      if (!date) return 'Fecha no disponible'
      return new Intl.DateTimeFormat('es-CR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }

    const formatCount = (value) => String(value || 0).padStart(2, '0')

    const getItemTitle = (item) => item.item_name || item.titulo || 'Objeto sin nombre'
    const getItemTicket = (item) => item.boleta_numero || item['#_boleta'] || 'Sin boleta'
    const getItemLocation = (item) => item.found_location || 'Ubicación no registrada'
    const getItemFoundBy = (item) => item.encontrado_por || 'No indicado'
    const getItemDescription = (item) => {
      if (!item.description) return 'Sin descripción física registrada.'
      return item.description.length > 120 ? `${item.description.slice(0, 120)}...` : item.description
    }

    const filteredItems = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      return items.value.filter(item => {
        if (statusFilter.value && item.status !== statusFilter.value) return false
        if (!term) return true
        return (
          (item.titulo || '').toLowerCase().includes(term) ||
          (item.item_name || '').toLowerCase().includes(term) ||
          (item.description || '').toLowerCase().includes(term) ||
          (item['#_boleta'] || '').toLowerCase().includes(term) ||
          (item.boleta_numero || '').toLowerCase().includes(term) ||
          (item.found_location || '').toLowerCase().includes(term) ||
          (item.encontrado_por || '').toLowerCase().includes(term) ||
          (item.claimant_name || '').toLowerCase().includes(term)
        )
      })
    })

    const hasActiveFilters = computed(() => {
      return Boolean(searchTerm.value.trim()) || Boolean(statusFilter.value)
    })

    const heroStats = computed(() => {
      const stored = items.value.filter(item => item.status === 'Almacenado').length
      const delivered = items.value.filter(item => item.status === 'Entregado').length
      const discarded = items.value.filter(item => item.status === 'Desechado').length

      return [
        { label: 'Resguardados', value: stored, meta: 'Pendientes de entrega' },
        { label: 'Entregados', value: delivered, meta: 'Objetos restituidos' },
        { label: 'Desechados', value: discarded, meta: 'Cierre de ciclo' }
      ]
    })

    const latestActivityLabel = computed(() => {
      if (!items.value.length) return 'Sin actividad'
      // Sort items by found_at to find the most recent one
      const sortedByFound = [...items.value].filter(i => i.found_at).sort((a, b) => {
        return new Date(b.found_at).getTime() - new Date(a.found_at).getTime()
      })
      if (sortedByFound.length > 0) {
        return formatRelativeDate(sortedByFound[0].found_at)
      }
      return formatRelativeDate(items.value[0].created_at)
    })

    const clearFilters = () => {
      searchTerm.value = ''
      statusFilter.value = ''
    }

    const fetchItems = async () => {
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('lost_found')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (error) throw error
        items.value = data || []
      } catch (err) {
        console.error('Error fetching lost & found:', err)
        quasar.notify({ type: 'negative', message: 'Error al cargar objetos perdidos' })
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchItems)

    return {
      router,
      isLoggedIn,
      loading,
      items,
      filteredItems,
      searchTerm,
      statusFilter,
      isMobile,
      statusOptions,
      filterOptions,
      hasActiveFilters,
      heroStats,
      latestActivityLabel,
      clearFilters,
      getStatusTone,
      getCloudinaryUrl,
      getItemTitle,
      getItemTicket,
      getItemLocation,
      getItemFoundBy,
      getItemDescription,
      formatRelativeDate,
      formatExactDate,
      formatCount
    }
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

.lost-found-list-page {
  background:
    radial-gradient(circle at top left, rgba(0, 0, 0, 0.08), transparent 30%),
    linear-gradient(180deg, #f0f0ec 0%, #ffffff 26%, #f6f5f1 100%);
  color: #0f0f0f;
}

.lf-uber-page {
  width: min(1280px, calc(100% - 24px));
  margin: 0 auto;
  padding: 20px 0 112px;
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.lf-hero {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0)),
    #0b0b0b;
  color: #ffffff;
  border-radius: 32px;
  padding: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.lf-hero__topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.lf-back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.lf-hero__section-label,
.lf-kicker,
.lf-panel__eyebrow,
.lf-record-card__footer-label,
.lf-filter-summary__label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
}

.lf-hero__section-label {
  color: rgba(255, 255, 255, 0.62);
}

.lf-hero__count {
  margin-left: auto;
  min-width: 54px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #ffffff;
  color: #050505;
  font-family: 'Archivo', 'Segoe UI', sans-serif;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.lf-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: 24px;
  align-items: stretch;
}

.lf-kicker {
  color: rgba(255, 255, 255, 0.64);
  margin-bottom: 14px;
}

.lf-hero__title,
.lf-results-title,
.lf-panel__title,
.lf-record-card__title {
  font-family: 'Archivo', 'Segoe UI', sans-serif;
}

.lf-hero__title {
  margin: 0;
  max-width: 10ch;
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 0.98;
}

.lf-hero__title--small {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  max-width: none;
}

.lf-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.lf-primary-btn,
.lf-mobile-cta {
  background: #ffffff !important;
  color: #050505 !important;
  min-height: 50px;
  padding-inline: 22px;
  font-weight: 700;
}

.lf-secondary-btn,
.lf-clear-btn {
  color: #0f0f0f !important;
  background: #efefef;
  min-height: 50px;
  padding-inline: 20px;
  font-weight: 700;
}

.lf-secondary-btn {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.lf-auth-hint {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.lf-hero__stats {
  display: grid;
  gap: 12px;
}

.lf-stat-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 18px;
  min-height: 124px;
}

.lf-stat-card__label {
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  font-weight: 600;
}

.lf-stat-card__value {
  margin-top: 10px;
  font-family: 'Archivo', 'Segoe UI', sans-serif;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  line-height: 1;
}

.lf-stat-card__meta {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.lf-main-grid {
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.lf-sidebar {
  display: grid;
  gap: 20px;
  align-content: start;
}

.lf-panel,
.lf-state-card,
.lf-record-card {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(15, 15, 15, 0.08);
  border-radius: 28px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(14px);
}

.lf-panel {
  padding: 22px;
}

.lf-panel--filters {
  position: sticky;
  top: 24px;
}

.lf-panel__eyebrow {
  color: #717171;
  margin-bottom: 10px;
}

.lf-panel__title {
  font-size: 1.45rem;
  line-height: 1.05;
}

.lf-panel__text {
  margin: 14px 0 0;
  color: #535353;
  line-height: 1.65;
}

.lf-search-input {
  margin-top: 18px;
}

.lf-search-input :deep(.q-field__control) {
  border-radius: 18px;
  background: #ffffff;
  min-height: 54px;
}

.lf-search-input :deep(.q-field__native),
.lf-search-input :deep(.q-field__prefix),
.lf-search-input :deep(.q-field__suffix),
.lf-search-input :deep(.q-field__marginal) {
  color: #141414;
}

.lf-filter-label {
  margin-top: 18px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #545454;
}

.lf-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.lf-filter-chip {
  margin: 0;
  border-radius: 999px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #dedede;
  background: #efefef;
  color: #101010;
  font-weight: 700;
}

.lf-filter-chip--active {
  border-color: #101010;
  background: #101010;
  color: #ffffff;
}

.lf-filter-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.lf-filter-summary > div {
  border-radius: 20px;
  background: #f6f6f3;
  padding: 14px;
}

.lf-filter-summary strong {
  display: block;
  margin-top: 6px;
  font-size: 1rem;
  color: #0f0f0f;
}

.lf-clear-btn {
  margin-top: 16px;
}

.lf-content {
  min-width: 0;
}

.lf-results-head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.lf-results-title {
  margin: 4px 0 0;
  font-size: clamp(1.75rem, 3vw, 2.8rem);
  line-height: 0.98;
}

.lf-results-tag {
  padding: 10px 16px;
  border-radius: 999px;
  background: #0f0f0f;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.lf-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.lf-record-card {
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lf-record-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.12);
}

.lf-record-card__media {
  aspect-ratio: 1.35;
  background: linear-gradient(135deg, #efefef 0%, #dcdcdc 100%);
}

.lf-record-card__image,
.lf-record-card__placeholder {
  width: 100%;
  height: 100%;
}

.lf-record-card__image {
  filter: saturate(0.92) contrast(1.02);
}

.lf-record-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #737373;
}

.lf-record-card__body {
  padding: 18px;
}

.lf-record-card__top {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: start;
}

.lf-record-card__title {
  font-size: 1.35rem;
  line-height: 1.05;
}

.lf-record-card__date {
  margin-top: 6px;
  color: #696969;
  font-size: 13px;
}

.lf-status-pill {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.lf-status-pill--stored {
  background: #111111;
  color: #ffffff;
}

.lf-status-pill--delivered {
  background: #e8f5ec;
  color: #13673d;
}

.lf-status-pill--discarded {
  background: #eee9e2;
  color: #5d554c;
}

.lf-status-pill--neutral {
  background: #efefef;
  color: #111111;
}

.lf-record-card__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.lf-fact-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f2f2ef;
  color: #242424;
  font-size: 13px;
}

.lf-record-card__description {
  margin: 16px 0 0;
  color: #444444;
  line-height: 1.6;
  min-height: 76px;
}

.lf-record-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 12px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(15, 15, 15, 0.08);
}

.lf-record-card__footer-label {
  color: #7a7a7a;
}

.lf-record-card__footer-value {
  margin-top: 6px;
  font-weight: 700;
  color: #0f0f0f;
}

.lf-card-action {
  background: #f3f3f3;
  color: #0f0f0f;
}

.lf-state-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
  padding: 56px 24px;
}

.lf-state-card--empty {
  min-height: 320px;
  align-content: center;
}

.lf-state-card__title {
  font-family: 'Archivo', 'Segoe UI', sans-serif;
  font-size: 1.7rem;
}

.lf-state-card__text {
  max-width: 42ch;
  color: #555555;
  line-height: 1.65;
}

.lf-mobile-cta-wrap {
  width: min(100vw - 24px, 560px);
  padding: 0 12px;
}

.lf-mobile-cta {
  width: 100%;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1023px) {
  .lf-hero__grid,
  .lf-main-grid,
  .lf-card-grid {
    grid-template-columns: 1fr;
  }

  .lf-panel--filters {
    position: static;
  }
}

@media (max-width: 599px) {
  .lf-uber-page {
    width: calc(100% - 16px);
    padding-top: 8px;
    padding-bottom: 108px;
  }

  .lf-hero,
  .lf-panel,
  .lf-record-card,
  .lf-state-card {
    border-radius: 24px;
  }

  .lf-hero {
    padding: 16px;
  }

  .lf-hero__grid {
    gap: 16px;
  }

  .lf-hero__stats {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-top: 16px;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .lf-hero__stats::-webkit-scrollbar {
    display: none;
  }

  .lf-stat-card {
    min-width: 140px;
    flex: 1;
    min-height: auto;
    padding: 12px 14px;
    border-radius: 16px;
  }

  .lf-stat-card__label {
    font-size: 11px;
    margin-bottom: 2px;
  }

  .lf-stat-card__value {
    font-size: 22px;
  }

  .lf-stat-card__meta {
    display: none;
  }

  .lf-hero__topbar {
    margin-bottom: 18px;
  }

  .lf-hero__title {
    max-width: none;
    font-size: 2.3rem;
  }

  .lf-hero__actions {
    display: none;
  }

  .lf-filter-summary {
    grid-template-columns: 1fr;
  }

  .lf-results-head {
    align-items: start;
  }

  .lf-record-card__description {
    min-height: 0;
  }
}
</style>
