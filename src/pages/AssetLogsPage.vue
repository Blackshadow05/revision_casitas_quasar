<template>
  <q-page style="background: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;" class="q-pa-md">
    <div class="assets-shell">
      <!-- Header -->
      <div class="assets-header q-mb-md">
        <q-btn flat round dense icon="arrow_back" style="color: #1d1d1f; background: rgba(0,0,0,0.05); border-radius: 50%;" @click="router.push('/seguridad')" />
        <div class="col">
          <div style="font-size: 22px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.4px;">Control de Activos</div>
          <div style="font-size: 13px; color: rgba(0,0,0,0.48); margin-top: 2px;">Llaves, radios y equipos</div>
        </div>
        <div class="result-pill">{{ filteredLogs.length }}</div>
      </div>

      <!-- Search -->
      <q-input
        v-model="searchTerm"
        rounded
        outlined
        dense
        placeholder="Buscar por activo, guarda o condición..."
        bg-color="white"
        class="q-mb-sm apple-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-5" />
        </template>
        <template v-slot:append>
          <q-icon v-if="searchTerm" name="clear" class="cursor-pointer" color="grey-5" @click="searchTerm = ''" />
        </template>
      </q-input>

      <!-- Quick filters -->
      <div class="quick-filter-row q-mb-md">
        <q-chip
          v-for="f in quickFilters"
          :key="f.value"
          clickable
          :class="['quick-filter-chip', { 'quick-filter-chip--active': quickFilter === f.value }]"
          @click="quickFilter = f.value"
        >
          <q-icon :name="f.icon" size="16px" class="q-mr-xs" />
          {{ f.label }}
        </q-chip>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner color="primary" size="36px" />
        <div style="margin-top: 12px; color: rgba(0,0,0,0.48); font-size: 14px;">Cargando activos...</div>
      </div>

      <!-- List -->
      <div v-else-if="filteredLogs.length > 0" class="assets-list">
        <div v-for="log in filteredLogs" :key="log.id" class="movement-card">
          <div class="movement-card-inner q-pa-md">
            <div class="movement-card-top">
              <div
                class="movement-icon-wrap"
                :style="{ background: log.action === 'Retiro' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)' }"
              >
                <q-icon :name="log.action === 'Retiro' ? 'arrow_upward' : 'arrow_downward'" :style="{ color: log.action === 'Retiro' ? '#ff3b30' : '#34c759' }" size="18px" />
              </div>
              <div class="col">
                <div class="movement-topline">
                  <span class="movement-date-badge">{{ formatRelativeDate(log.timestamp) }}</span>
                  <span class="movement-time">{{ formatTime(log.timestamp) }}</span>
                </div>
                <div class="text-weight-bold movement-title">{{ log.asset_name }}</div>
              </div>
              <span class="action-badge" :style="{ background: log.action === 'Retiro' ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)', color: log.action === 'Retiro' ? '#ff3b30' : '#34c759' }">{{ log.action }}</span>
            </div>

            <div class="movement-meta-grid q-mt-md">
              <div class="movement-meta-item">
                <q-icon name="person_outline" color="grey-7" size="18px" />
                <div>
                  <div class="movement-meta-label">Guarda</div>
                  <div class="movement-meta-value">{{ log.guard_id || 'Sin usuario' }}</div>
                </div>
              </div>
              <div class="movement-meta-item">
                <q-icon name="info_outline" color="grey-7" size="18px" />
                <div>
                  <div class="movement-meta-label">Condición</div>
                  <div class="movement-meta-value">{{ log.condition || 'Sin especificar' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <q-icon :name="hasActiveFilters ? 'search_off' : 'vpn_key'" size="52px" color="grey-4" />
        <div class="text-body1 text-grey-5 q-mt-sm">{{ hasActiveFilters ? 'Sin resultados' : 'Sin registros' }}</div>
        <div class="text-caption text-grey-4">{{ hasActiveFilters ? 'Intenta con otros filtros' : 'No hay movimientos de activos' }}</div>
        <q-btn v-if="hasActiveFilters" flat rounded no-caps color="primary" label="Limpiar filtros" class="q-mt-sm" @click="clearFilters" />
      </div>

      <!-- FAB -->
      <q-page-sticky position="bottom-right" :offset="[20, 20]">
        <q-btn fab icon="add" style="background: #0071e3 !important; color: white !important; box-shadow: 0 4px 14px rgba(0,113,227,0.35);" @click="showAddDialog = true" :disable="!isLoggedIn" />
      </q-page-sticky>

      <!-- Add Dialog -->
      <q-dialog v-model="showAddDialog" persistent>
        <q-card style="min-width: 340px; border-radius: 18px; background: #ffffff;">
          <q-card-section class="q-pb-none">
            <div style="font-size: 18px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.3px;">Nuevo registro de activo</div>
          </q-card-section>

          <q-card-section>
            <q-select
              v-model="newLog.asset_name"
              :options="filteredAssetOptions"
              label="Activo *"
              outlined
              rounded
              class="q-mb-md"
              use-input
              new-value-mode="add-unique"
              @filter="filterAssets"
              placeholder="Selecciona o escribe..."
            />

            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs text-weight-medium">Acción *</div>
              <q-btn-toggle
                v-model="newLog.action"
                toggle-color="primary"
                rounded
                unelevated
                spread
                :options="[
                  { label: 'Retiro', value: 'Retiro' },
                  { label: 'Devolución', value: 'Devolución' }
                ]"
              />
            </div>

            <q-input
              v-model="newLog.condition"
              label="Condición del activo"
              outlined
              rounded
              placeholder="Ej: Buen estado, Antena floja..."
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md q-gutter-sm">
            <q-btn flat rounded label="Cancelar" style="text-transform:none; color: rgba(0,0,0,0.48); border-radius: 980px;" @click="closeDialog" />
            <q-btn
              unelevated
              rounded
              label="Guardar"
              style="text-transform:none; font-weight:600; background: #0071e3; color: white; border-radius: 980px; padding: 6px 20px;"
              :loading="saving"
              :disable="!newLog.asset_name || !newLog.action"
              @click="saveLog"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
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
  name: 'AssetLogsPage',
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()
    const $q = useQuasar()
    const isLoggedIn = computed(() => authStore.isLoggedIn)

    const loading = ref(true)
    const saving = ref(false)
    const assetLogs = ref([])
    const searchTerm = ref('')
    const quickFilter = ref('all')
    const showAddDialog = ref(false)

    const predefinedAssets = [
      'Llave Maestra',
      'Llave de Bodega',
      'Llave de Piscina',
      'Llave de Oficina',
      'Radio #1',
      'Radio #2',
      'Radio #3',
      'Radio #4',
      'Botiquín',
      'Linterna',
      'Extintor Portátil',
      'Candado de Seguridad'
    ]
    const filteredAssetOptions = ref([...predefinedAssets])

    const newLog = ref({
      asset_name: '',
      action: 'Retiro',
      condition: ''
    })

    const quickFilters = [
      { label: 'Todos', value: 'all', icon: 'apps' },
      { label: 'Retiros', value: 'Retiro', icon: 'arrow_upward' },
      { label: 'Devoluciones', value: 'Devolución', icon: 'arrow_downward' },
      { label: 'Hoy', value: 'today', icon: 'today' }
    ]

    const parseDateValue = (dateString) => {
      if (!dateString) return null
      const d = new Date(dateString)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const isSameCalendarDay = (a, b) => {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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

    const formatTime = (dateString) => {
      const date = parseDateValue(dateString)
      if (!date) return ''
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    const filteredLogs = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      return assetLogs.value.filter(log => {
        if (quickFilter.value === 'Retiro' && log.action !== 'Retiro') return false
        if (quickFilter.value === 'Devolución' && log.action !== 'Devolución') return false
        if (quickFilter.value === 'today') {
          const d = parseDateValue(log.timestamp)
          if (!d || !isSameCalendarDay(d, new Date())) return false
        }
        if (!term) return true
        return (
          (log.asset_name || '').toLowerCase().includes(term) ||
          (log.guard_id || '').toLowerCase().includes(term) ||
          (log.condition || '').toLowerCase().includes(term)
        )
      })
    })

    const hasActiveFilters = computed(() => {
      return Boolean(searchTerm.value.trim()) || quickFilter.value !== 'all'
    })

    const clearFilters = () => {
      searchTerm.value = ''
      quickFilter.value = 'all'
    }

    const filterAssets = (val, update) => {
      update(() => {
        const needle = val.toLowerCase()
        filteredAssetOptions.value = predefinedAssets.filter(v => v.toLowerCase().includes(needle))
      })
    }

    const fetchLogs = async () => {
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('asset_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500)
        if (error) throw error
        assetLogs.value = data || []
      } catch (err) {
        console.error('Error fetching asset logs:', err)
        $q.notify({ type: 'negative', message: 'Error al cargar activos' })
      } finally {
        loading.value = false
      }
    }

    const closeDialog = () => {
      showAddDialog.value = false
      newLog.value = { asset_name: '', action: 'Retiro', condition: '' }
    }

    const saveLog = async () => {
      if (!newLog.value.asset_name || !newLog.value.action) return
      saving.value = true
      try {
        const record = {
          asset_name: typeof newLog.value.asset_name === 'string' ? newLog.value.asset_name.trim() : newLog.value.asset_name,
          guard_id: authStore.user?.Usuario || 'Desconocido',
          action: newLog.value.action,
          condition: newLog.value.condition?.trim() || null
        }
        const { error } = await supabase.from('asset_logs').insert(record)
        if (error) throw error
        $q.notify({ type: 'positive', message: 'Registro guardado', icon: 'check_circle' })
        closeDialog()
        await fetchLogs()
      } catch (err) {
        console.error('Error saving asset log:', err)
        $q.notify({ type: 'negative', message: 'Error al guardar', caption: err.message })
      } finally {
        saving.value = false
      }
    }

    onMounted(fetchLogs)

    return {
      router,
      isLoggedIn,
      loading,
      saving,
      assetLogs,
      filteredLogs,
      searchTerm,
      quickFilter,
      quickFilters,
      showAddDialog,
      newLog,
      filteredAssetOptions,
      hasActiveFilters,
      clearFilters,
      filterAssets,
      formatRelativeDate,
      formatTime,
      closeDialog,
      saveLog
    }
  }
})
</script>

<style scoped>
.assets-shell {
  max-width: 600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.assets-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-pill {
  background: rgba(0, 113, 227, 0.08);
  color: #0071e3;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 13px;
  border-radius: 980px;
  letter-spacing: -0.1px;
}

/* Search Input */
.apple-search :deep(.q-field__control) {
  background: #ffffff !important;
  border-radius: 12px !important;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08) !important;
}

/* Quick Filter Chips */
.quick-filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px;
  scrollbar-width: none;
}
.quick-filter-row::-webkit-scrollbar { display: none; }

.quick-filter-chip {
  background: #ffffff;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
  border-radius: 980px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  transition: all 0.15s ease;
  font-size: 13.5px;
}

.quick-filter-chip--active {
  background: #0071e3 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.28) !important;
}

.quick-filter-chip:hover:not(.quick-filter-chip--active) {
  background: #f5f5f7;
}

/* Movement Cards */
.assets-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 80px;
}

.movement-card {
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.movement-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.09), 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}

.movement-card-inner {}

.movement-card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.movement-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.movement-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.movement-date-badge {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.48);
  letter-spacing: -0.1px;
}

.movement-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.36);
}

.movement-title {
  font-size: 15px;
  color: #1d1d1f;
  letter-spacing: -0.2px;
}

.action-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 980px;
  white-space: nowrap;
}

.movement-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 10px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}

.movement-meta-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.movement-meta-label {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
  letter-spacing: 0.2px;
  text-transform: uppercase;
}

.movement-meta-value {
  font-size: 13.5px;
  font-weight: 500;
  color: #1d1d1f;
  margin-top: 1px;
}

.empty-state {
  text-align: center;
  padding: 60px 16px;
}
</style>
