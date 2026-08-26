<template>
  <q-page class="ingresos-page">
    <header class="ingresos-hero">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        class="ingresos-back"
        aria-label="Volver"
        @click="goBack"
      />
      <div class="ingresos-hero__copy">
        <h1 class="ingresos-hero__title">Ingresos</h1>
        <p class="ingresos-hero__subtitle">
          {{ filteredLogs.length }} {{ filteredLogs.length === 1 ? 'acceso' : 'accesos' }}
          en orden cronológico
        </p>
      </div>
    </header>

    <div class="ingresos-toolbar">
      <q-input
        v-model="searchQuery"
        outlined
        rounded
        dense
        clearable
        debounce="80"
        placeholder="Buscar por usuario, IP, fecha o método"
        class="ingresos-search"
        hide-bottom-space
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-6" />
        </template>
      </q-input>

      <div class="ingresos-filters" role="group" aria-label="Filtrar ingresos">
        <button
          v-for="filter in methodFilters"
          :key="filter.value"
          type="button"
          class="ingresos-chip"
          :class="{ 'is-active': methodFilter === filter.value }"
          @click="methodFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div v-if="activeUserFilter" class="ingresos-user-filter">
      <span>Usuario: {{ activeUserFilter }}</span>
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="close"
        aria-label="Quitar filtro de usuario"
        @click="clearUserFilter"
      />
    </div>

    <div v-if="loading && !logs.length" class="ingresos-empty">
      <q-spinner color="primary" size="28px" />
      <p class="ingresos-empty__title q-mt-md">Cargando ingresos</p>
    </div>

    <div v-else-if="!filteredLogs.length" class="ingresos-empty">
      <div class="ingresos-empty__mark">
        <q-icon name="login" size="28px" />
      </div>
      <p class="ingresos-empty__title">Sin coincidencias</p>
      <p class="ingresos-empty__copy">
        {{ logs.length ? 'Prueba con otro usuario, IP o fecha.' : 'Todavía no hay inicios de sesión registrados.' }}
      </p>
    </div>

    <div v-else class="ingresos-feed">
      <section
        v-for="group in groupedLogs"
        :key="group.key"
        class="ingresos-day"
      >
        <header class="ingresos-day__head">
          <h2 class="ingresos-day__title">{{ group.label }}</h2>
          <span class="ingresos-day__count">{{ group.entries.length }}</span>
        </header>

        <ol class="ingresos-list">
          <li
            v-for="entry in group.entries"
            :key="entry.id"
            class="ingresos-item"
          >
            <div
              class="ingresos-avatar"
              :style="{ background: avatarColor(entry.usuario) }"
            >
              {{ (entry.usuario || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="ingresos-item__body">
              <div class="ingresos-item__top">
                <div class="ingresos-item__name">{{ entry.usuario }}</div>
                <time class="ingresos-item__time" :datetime="entry.logged_at">
                  {{ formatLoginTime(entry.logged_at) }}
                </time>
              </div>
              <div class="ingresos-item__meta">
                <span class="ingresos-ip">{{ entry.ip_address || 'IP no disponible' }}</span>
                <span class="ingresos-method">{{ loginMethodLabel(entry.metodo) }}</span>
              </div>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notify } from '../utils/notify'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import {
  formatLoginDayLabel,
  formatLoginTime,
  loginDayKey,
  loginMethodLabel,
  loginSearchHaystack
} from '../utils/loginLogs'

defineOptions({ name: 'LoginLogsPage' })

const methodFilters = [
  { label: 'Todos', value: 'all' },
  { label: 'Contraseña', value: 'password' },
  { label: 'Google', value: 'google' },
  { label: 'Authenticator', value: 'authenticator' }
]

const avatarPalette = ['#0f766e', '#1d4ed8', '#6d28d9', '#9f1239', '#c2410c', '#0e7490', '#4338ca']

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const logs = ref([])
const loading = ref(true)
const searchQuery = ref('')
const methodFilter = ref('all')
const activeUserFilter = ref('')

const avatarColor = (name) => {
  const code = [...String(name || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarPalette[code % avatarPalette.length]
}

const filteredLogs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const userFilter = activeUserFilter.value.trim().toLowerCase()

  return logs.value.filter((entry) => {
    if (methodFilter.value !== 'all' && entry.metodo !== methodFilter.value) {
      return false
    }
    if (userFilter && String(entry.usuario || '').toLowerCase() !== userFilter) {
      return false
    }
    if (query && !loginSearchHaystack(entry).includes(query)) {
      return false
    }
    return true
  })
})

const groupedLogs = computed(() => {
  const groups = new Map()

  for (const entry of filteredLogs.value) {
    const key = loginDayKey(entry.logged_at) || 'sin-fecha'
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatLoginDayLabel(entry.logged_at),
        entries: []
      })
    }
    groups.get(key).entries.push(entry)
  }

  return [...groups.values()]
})

const goBack = () => {
  router.back()
}

const clearUserFilter = () => {
  activeUserFilter.value = ''
  if (route.query.usuario) {
    router.replace({ path: '/ingresos', query: {} })
  }
}

const applyRouteFilter = () => {
  activeUserFilter.value = String(route.query.usuario || '').trim()
}

const loadLogs = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('login_logs')
      .select('id, logged_at, usuario, ip_address, metodo, user_agent')
      .order('logged_at', { ascending: false })
      .limit(1000)

    if (error) throw error
    logs.value = data || []
  } catch (error) {
    console.error('Error loading login logs:', error)
    notify({
      color: 'negative',
      message: 'No se pudo cargar el registro de ingresos'
    })
  } finally {
    loading.value = false
  }
}

watch(() => route.query.usuario, applyRouteFilter)

onMounted(() => {
  if (!authStore.isSuperAdmin) {
    notify({
      type: 'negative',
      message: 'Solo SuperAdmin puede ver los ingresos.'
    })
    router.replace('/config')
    return
  }

  applyRouteFilter()
  loadLogs()
})
</script>

<style scoped>
.ingresos-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

.ingresos-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.ingresos-back {
  color: #3f3f46;
}

.ingresos-hero__copy {
  min-width: 0;
  flex: 1;
}

.ingresos-hero__title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: var(--apple-text-primary);
}

.ingresos-hero__subtitle {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: var(--apple-text-secondary);
}

.ingresos-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.ingresos-search {
  width: 100%;
}

.ingresos-search :deep(.q-field__control) {
  border-radius: 14px;
  background: #fff;
}

.ingresos-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ingresos-chip {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--apple-separator);
  background: #fff;
  color: #3f3f46;
  font-size: 0.75rem;
  font-weight: 650;
}

.ingresos-chip.is-active {
  background: #111827;
  border-color: #111827;
  color: #fff;
}

.ingresos-user-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 650;
}

.ingresos-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid var(--apple-separator);
}

.ingresos-empty__mark {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #f5f5f7;
  color: #86868b;
  margin-bottom: 12px;
}

.ingresos-empty__title {
  margin: 0;
  font-weight: 700;
  color: var(--apple-text-primary);
}

.ingresos-empty__copy {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6e6e73;
}

.ingresos-feed {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.ingresos-day__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 0 4px;
}

.ingresos-day__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--apple-text-primary);
}

.ingresos-day__count {
  font-size: 0.72rem;
  font-weight: 700;
  color: #86868b;
}

.ingresos-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingresos-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--apple-separator);
  box-shadow: var(--apple-card-shadow);
}

.ingresos-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ingresos-item__body {
  min-width: 0;
  flex: 1;
}

.ingresos-item__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ingresos-item__name {
  min-width: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--apple-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ingresos-item__time {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
}

.ingresos-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 3px;
  font-size: 0.75rem;
  color: #6e6e73;
}

.ingresos-ip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.ingresos-method {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f5f5f7;
  color: #3f3f46;
  font-weight: 650;
}

@media (min-width: 768px) {
  .ingresos-page {
    padding: 28px 32px 48px;
  }

  .ingresos-hero__title {
    font-size: 1.85rem;
  }
}
</style>
