<template>
  <q-page class="incidents-list-page q-pa-md">
    <div class="incidents-shell">
      <!-- Header -->
      <div class="incidents-header q-mb-md">
        <div class="row items-center justify-between" style="width:100%">
          <div class="row items-center">
            <q-btn flat round dense icon="arrow_back" color="grey-7" @click="router.push('/seguridad')" />
            <div class="col q-ml-sm">
              <div class="text-h5 text-weight-bold">Incidentes</div>
              <div class="text-caption text-grey-6">Reportes de seguridad</div>
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <div class="result-pill">{{ filteredIncidents.length }}</div>
            <q-btn dense flat icon="filter_list" @click="$q.fullscreen.toggle()" label="Filtrar" />
            <q-btn
              unelevated
              rounded
              padding="8px 20px"
              color="primary"
              icon="add"
              class="gt-sm text-weight-bold"
              label="Reportar incidente"
              @click="router.push('/seguridad/incidentes/nuevo')"
              :disable="!isLoggedIn"
            />
          </div>
        </div>
      </div>

      <!-- Search + Filters -->
      <div class="controls-row q-mb-md">
        <q-input
          v-model="searchTerm"
          rounded
          outlined
          dense
          placeholder="Buscar título, descripción, guardia..."
          bg-color="white"
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-5" />
          </template>
          <template v-slot:append>
            <q-icon v-if="searchTerm" name="clear" class="cursor-pointer" color="grey-5" @click="searchTerm = ''" />
          </template>
        </q-input>

        <div class="filters-row">
          <div class="quick-filter-row">
            <q-chip
              v-for="s in statusOptions"
              :key="s"
              clickable
              dense
              :class="['quick-filter-chip', { 'quick-filter-chip--active': statusFilter === s }]"
              @click="statusFilter = statusFilter === s ? '' : s"
            >
              {{ s }}
            </q-chip>
          </div>

          <div class="quick-filter-row">
            <q-chip
              v-for="p in priorityOptions"
              :key="p"
              clickable
              dense
              :class="['quick-filter-chip', { 'quick-filter-chip--active': priorityFilter === p }]"
              @click="priorityFilter = priorityFilter === p ? '' : p"
            >
              <q-icon :name="getPriorityIcon(p)" size="14px" :color="getPriorityColor(p)" class="q-mr-xs" />
              {{ p }}
            </q-chip>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-md text-grey-6 text-body2">Cargando incidentes...</div>
      </div>

      <!-- List -->
      <div v-else-if="filteredIncidents.length > 0" class="incidents-list">
        <div
          v-for="incident in filteredIncidents"
          :key="incident.id"
          class="incident-card native-card"
          @click="router.push(`/seguridad/incidentes/${incident.id}`)"
        >
          <div class="incident-card-inner q-pa-md row items-start">
            <div class="avatar-col">
              <q-avatar size="48px" class="bg-grey-2 text-primary">
                <div class="text-weight-bold">{{ (incident.guard_id || '').toString().substring(0,2).toUpperCase() }}</div>
              </q-avatar>
            </div>

            <div class="content-col col q-pl-sm">
              <div class="row items-start justify-between">
                <div>
                  <div class="text-subtitle2 text-weight-bold">{{ incident.title }}</div>
                  <div class="text-caption text-grey-6 q-mt-xs">{{ incident.guard_id }} · {{ formatRelativeDate(incident.created_at) }}</div>
                </div>
                <div class="right-col">
                  <q-badge :color="getStatusColor(incident.status)" :label="incident.status" rounded />
                </div>
              </div>

              <div class="meta-row q-mt-sm">
                <q-badge outline :color="getCategoryColor(incident.category)" :label="incident.category" />
                <q-badge class="q-ml-xs" :color="getPriorityColor(incident.priority)" text-color="white" :label="incident.priority" />
                <q-badge v-if="incident.evidence_urls && incident.evidence_urls.length > 0" outline color="grey-6" class="q-ml-xs">
                  <q-icon name="photo_camera" size="12px" class="q-mr-xs" />
                  {{ incident.evidence_urls.length }}
                </q-badge>
              </div>

              <div v-if="incident.description" class="text-body2 text-grey-7 incident-description q-mt-sm">
                {{ incident.description.length > 140 ? incident.description.substring(0, 140) + '...' : incident.description }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <q-icon :name="hasActiveFilters ? 'search_off' : 'verified_user'" size="72px" color="grey-4" />
        <div class="text-h6 text-grey-5 q-mt-sm">{{ hasActiveFilters ? 'Sin resultados' : 'Sin incidentes' }}</div>
        <div class="text-caption text-grey-4 q-mt-xs">{{ hasActiveFilters ? 'Intenta con otros filtros' : 'No hay incidentes registrados' }}</div>
        <q-btn v-if="hasActiveFilters" flat rounded no-caps color="primary" label="Limpiar filtros" class="q-mt-sm" @click="clearFilters" />
      </div>

      <!-- FAB -->
      <q-page-sticky position="bottom-right" :offset="[16, 16]" class="lt-md">
        <q-btn fab icon="add" color="primary" @click="router.push('/seguridad/incidentes/nuevo')" :disable="!isLoggedIn" />
      </q-page-sticky>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { notify } from '../utils/notify'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'IncidentsListPage',
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()
    const $q = useQuasar()
    const isLoggedIn = computed(() => authStore.isLoggedIn)

    const loading = ref(true)
    const incidents = ref([])
    const searchTerm = ref('')
    const statusFilter = ref('')
    const priorityFilter = ref('')

    const statusOptions = ['Abierto', 'En Investigación', 'Resuelto']
    const priorityOptions = ['Baja', 'Media', 'Alta']

    const getStatusColor = (status) => {
      const map = { 'Abierto': 'orange', 'En Investigación': 'blue', 'Resuelto': 'green' }
      return map[status] || 'grey'
    }

    const getPriorityColor = (priority) => {
      const map = { 'Baja': 'green', 'Media': 'orange', 'Alta': 'red' }
      return map[priority] || 'grey'
    }

    const getPriorityIcon = (priority) => {
      const map = { 'Baja': 'arrow_downward', 'Media': 'remove', 'Alta': 'arrow_upward' }
      return map[priority] || 'remove'
    }

    const getCategoryColor = (category) => {
      const map = { 'Robo': 'red', 'Médico': 'blue', 'Incendio': 'deep-orange', 'Falla Técnica': 'amber-8', 'Otro': 'grey-7' }
      return map[category] || 'grey'
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

    const filteredIncidents = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      return incidents.value.filter(inc => {
        if (statusFilter.value && inc.status !== statusFilter.value) return false
        if (priorityFilter.value && inc.priority !== priorityFilter.value) return false
        if (!term) return true
        return (
          (inc.title || '').toLowerCase().includes(term) ||
          (inc.description || '').toLowerCase().includes(term) ||
          (inc.guard_id || '').toLowerCase().includes(term)
        )
      })
    })

    const hasActiveFilters = computed(() => {
      return Boolean(searchTerm.value.trim()) || Boolean(statusFilter.value) || Boolean(priorityFilter.value)
    })

    const clearFilters = () => {
      searchTerm.value = ''
      statusFilter.value = ''
      priorityFilter.value = ''
    }

    const fetchIncidents = async () => {
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (error) throw error
        incidents.value = data || []
      } catch (err) {
        console.error('Error fetching incidents:', err)
        notify({ type: 'negative', message: 'Error al cargar incidentes' })
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchIncidents)

    return {
      router,
      isLoggedIn,
      loading,
      incidents,
      filteredIncidents,
      searchTerm,
      statusFilter,
      priorityFilter,
      statusOptions,
      priorityOptions,
      hasActiveFilters,
      clearFilters,
      getStatusColor,
      getPriorityColor,
      getPriorityIcon,
      getCategoryColor,
      formatRelativeDate
    }
  }
})
</script>

<style scoped>
.incidents-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.incidents-header {
  display: block;
}

.controls-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1 1 300px;
}

@media (max-width: 600px) {
  .controls-row {
    gap: 8px;
  }
  .search-input {
    flex: 1 1 100%;
    margin-bottom: 4px;
  }
}

.filters-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.quick-filter-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-filter-chip {
  background: transparent;
  border: 1px solid rgba(0,0,0,0.06);
}

.quick-filter-chip--active {
  background: rgba(63,81,181,0.08);
  border-color: rgba(63,81,181,0.18);
}

.result-pill {
  background: #eef2ff;
  color: #3f51b5;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 999px;
}

.incidents-list {
  padding-bottom: 120px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.incident-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.15s ease, transform 0.12s ease;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
}

.incident-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(16,24,40,0.08);
}

.incident-card-inner { display: flex; align-items:flex-start; }
.avatar-col { width:56px; display:flex; align-items:center; justify-content:center; }
.content-col { min-width:0; }
.meta-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.right-col { display:flex; align-items:flex-start; }

.incident-description { line-height:1.4; color: rgba(0,0,0,0.72); }

.empty-state { text-align:center; padding:64px 16px; }

@media (max-width: 720px) {
  .incidents-shell { padding: 0 6px; }
  .controls-row { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .incidents-list { grid-template-columns: 1fr; }
}
</style>
