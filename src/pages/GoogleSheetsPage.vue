<template>
  <q-page class="google-sheets-page q-pa-md">
    <div class="page-shell">
      <div class="page-header row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-h4 text-weight-bold text-grey-10">Operación diaria</div>
          <div v-if="reportDateLabel" class="q-mt-sm">
            <div class="report-date-label text-weight-bold text-primary">
              Reporte del {{ reportDateLabel }}
            </div>
          </div>
          <div v-if="lastSyncLabel" class="q-mt-xs">
            <q-badge color="grey-2" text-color="grey-8" rounded>
              Última sincronización: {{ lastSyncLabel }}
            </q-badge>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row q-gutter-sm justify-end">
            <q-btn
              color="primary"
              icon="sync"
              label="Sincronizar"
              unelevated
              :loading="loading"
              @click="() => loadDashboard(true)"
            />
          </div>
        </div>
      </div>

      <q-banner v-if="!scriptConfigured" class="bg-orange-1 text-orange-10 q-mt-md" rounded>
        Define la variable VITE_GOOGLE_APPS_SCRIPT_URL para conectar esta vista con tu Apps Script publicado.
      </q-banner>

      <q-banner v-else-if="errorMessage" class="bg-negative text-white q-mt-md" rounded>
        <template #avatar>
          <q-icon name="error" />
        </template>
        {{ errorMessage }}
      </q-banner>

      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-checkout">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="red-1" text-color="red-8" icon="logout" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Check-outs</div>
                <div class="text-h5 text-weight-bold">{{ dashboard.checkouts.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-checkin">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="green-1" text-color="green-8" icon="login" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Check-ins</div>
                <div class="text-h5 text-weight-bold">{{ dashboard.checkins.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-experience">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="blue-1" text-color="blue-8" icon="tour" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Experiencias</div>
                <div class="text-h5 text-weight-bold">{{ dashboard.experiencias.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="48px" color="primary" />
      </q-inner-loading>

      <div v-if="hasData" class="q-mt-lg column q-gutter-md">
        <q-card class="data-card">
          <q-card-section class="section-header section-header-checkout">
            <div class="text-subtitle1 text-weight-bold">Check-Outs</div>
            <div class="text-caption">Salidas programadas</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="(item, index) in dashboard.checkouts" :key="`checkout-${index}`">
              <q-item-section avatar>
                <div class="house-pill house-pill-checkout">
                  {{ item.casa || '-' }}
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.huesped || 'Sin nombre' }}</q-item-label>
                <q-item-label caption class="schedule-caption">Hora: {{ item.hora || 'Pendiente' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-card class="data-card">
          <q-card-section class="section-header section-header-checkin">
            <div class="text-subtitle1 text-weight-bold">Check-Ins</div>
            <div class="text-caption">Llegadas esperadas</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="(item, index) in dashboard.checkins" :key="`checkin-${index}`">
              <q-item-section avatar>
                <div class="house-pill house-pill-checkin">
                  {{ item.casa || '-' }}
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.huesped || 'Sin nombre' }}</q-item-label>
                <q-item-label caption class="schedule-caption">ETA: {{ item.hora || 'Pendiente' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-card class="data-card">
          <q-card-section class="section-header section-header-experience">
            <div class="text-subtitle1 text-weight-bold">Experiencias confirmadas</div>
            <div class="text-caption">Actividades con hora y guía asignados</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="(item, index) in dashboard.experiencias" :key="`experience-${index}`">
              <q-item-section>
                <q-item-label class="tour-meta">
                  <span class="tour-time">{{ item.hora || 'Hora pendiente' }}</span>
                  <span class="tour-separator">·</span>
                  <span class="tour-house">Casa {{ item.casita || '-' }}</span>
                </q-item-label>
                <q-item-label class="tour-title">{{ item.tour || 'Experiencia sin nombre' }}</q-item-label>
                <q-item-label caption class="tour-guide">{{ item.guia || 'Guía pendiente' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <q-card v-else-if="scriptConfigured && !loading && !errorMessage" class="empty-state q-mt-lg">
        <q-card-section class="text-center q-py-xl">
          <q-icon name="grid_view" size="72px" color="grey-4" />
          <div class="text-h6 text-grey-7 q-mt-md">No hay registros para mostrar</div>
          <div class="text-body2 text-grey-6 q-mt-sm">
            Revisa que tu Apps Script esté leyendo la hoja correcta y devolviendo los arreglos esperados.
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { fetchGoogleSheetsDashboard } from '../services/googleSheets'

const CACHE_KEY = 'gsheets_dashboard_v1'
const CACHE_TTL_MS = 40 * 60 * 1000

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp || !parsed?.data) return null
    return { data: parsed.data, timestamp: new Date(parsed.timestamp) }
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }))
  } catch {
    // cuota llena o modo privado — ignorar
  }
}

export default defineComponent({
  name: 'GoogleSheetsPage',
  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const errorMessage = ref('')
    const dashboard = ref({
      checkouts: [],
      checkins: [],
      experiencias: [],
      fecha: null
    })
    const lastSync = ref(null)

    const scriptConfigured = computed(() => Boolean(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL))

    const hasData = computed(() => (
      dashboard.value.checkouts.length > 0 ||
      dashboard.value.checkins.length > 0 ||
      dashboard.value.experiencias.length > 0
    ))

    const lastSyncLabel = computed(() => {
      if (!lastSync.value) return ''
      return new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(lastSync.value)
    })

    const reportDateLabel = computed(() => {
      if (!dashboard.value.fecha) return ''

      const parsedDate = new Date(dashboard.value.fecha)
      if (Number.isNaN(parsedDate.getTime())) {
        return String(dashboard.value.fecha)
      }

      return new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(parsedDate)
    })

    const loadDashboard = async (force = false) => {
      if (!scriptConfigured.value) {
        errorMessage.value = 'Falta configurar VITE_GOOGLE_APPS_SCRIPT_URL'
        return
      }

      if (!force) {
        const cached = readCache()
        if (cached && (Date.now() - cached.timestamp.getTime()) < CACHE_TTL_MS) {
          dashboard.value = cached.data
          lastSync.value = cached.timestamp
          return
        }
      }

      loading.value = true
      errorMessage.value = ''

      try {
        const data = await fetchGoogleSheetsDashboard()
        dashboard.value = data
        lastSync.value = new Date()
        writeCache(data)
      } catch (error) {
        errorMessage.value = error.message || 'No se pudieron cargar los datos'
        $q.notify({
          type: 'negative',
          message: errorMessage.value
        })
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadDashboard()
    })

    return {
      dashboard,
      errorMessage,
      hasData,
      loading,
      loadDashboard,
      reportDateLabel,
      lastSyncLabel,
      scriptConfigured
    }
  }
})
</script>

<style scoped>
.google-sheets-page {
  background: linear-gradient(180deg, #f4f8fc 0%, #eef4f8 100%);
  min-height: 100vh;
}

.page-shell {
  max-width: 1080px;
  margin: 0 auto;
}

.page-header {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(24, 71, 120, 0.08);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 12px 32px rgba(22, 61, 107, 0.08);
}

.report-date-label {
  font-size: 1.15rem;
  line-height: 1.3;
  color: #0d47a1;
  background: linear-gradient(90deg, #e3f2fd 0%, #fff3cd 100%);
  display: inline-block;
  padding: 8px 14px;
  border-radius: 14px;
  border: 1px solid rgba(13, 71, 161, 0.14);
  box-shadow: 0 6px 16px rgba(13, 71, 161, 0.12);
}

.summary-card,
.data-card,
.empty-state {
  border-radius: 24px;
  box-shadow: 0 10px 28px rgba(31, 53, 82, 0.08);
}

.house-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(31, 53, 82, 0.18);
}

.house-pill-checkout {
  background: linear-gradient(135deg, #ef5350 0%, #d84315 100%);
}

.house-pill-checkin {
  background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);
}

.schedule-caption {
  font-size: 1rem;
  font-weight: 600;
  color: #455a64;
}

.tour-meta {
  font-size: 1rem;
  line-height: 1.4;
  color: #546e7a;
}

.tour-time,
.tour-house {
  font-weight: 700;
  color: #263238;
}

.tour-separator {
  margin: 0 6px;
  color: #90a4ae;
}

.tour-title {
  font-size: 1.08rem;
  line-height: 1.35;
  font-weight: 600;
}

.tour-guide {
  font-size: 1rem;
  line-height: 1.35;
  color: #546e7a;
}

.summary-card {
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.summary-card-checkout {
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
}

.summary-card-checkin {
  background: linear-gradient(135deg, #f2fff7 0%, #ffffff 100%);
}

.summary-card-experience {
  background: linear-gradient(135deg, #f2f8ff 0%, #ffffff 100%);
}

.section-header {
  color: white;
}

.section-header-checkout {
  background: linear-gradient(135deg, #ef5350 0%, #d84315 100%);
}

.section-header-checkin {
  background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);
}

.section-header-experience {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
}

.data-card {
  overflow: hidden;
}

.body--dark .page-header,
.body--dark .summary-card,
.body--dark .data-card,
.body--dark .empty-state {
  background: #1f1f1f;
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

.body--dark .google-sheets-page {
  background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
}
</style>