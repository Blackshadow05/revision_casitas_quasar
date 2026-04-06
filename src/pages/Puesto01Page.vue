<template>
  <q-page class="puesto01-page q-pa-md">
    <div class="page-shell">
      <div class="page-header row items-start justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="row items-center q-col-gutter-sm">
            <div class="col-auto">
              <q-btn flat round dense icon="arrow_back" to="/google-sheets" />
            </div>
            <div class="col">
              <div class="text-h4 text-weight-bold text-grey-10">Puesto 01</div>
              <div v-if="reportDateLabel" class="q-mt-sm">
                <div class="report-date-label text-weight-bold text-primary">
                  Reporte del {{ reportDateLabel }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row q-gutter-sm justify-end">
            <q-btn
              color="deep-purple-7"
              icon="sync"
              label="Sincronizar"
              unelevated
              :loading="loading"
              @click="loadDashboard"
            />
          </div>
        </div>
      </div>

      <q-banner v-if="!scriptConfigured" class="bg-orange-1 text-orange-10 q-mt-md" rounded>
        Define la variable VITE_GOOGLE_APPS_SCRIPT_URL_PUESTO01 para conectar esta vista con tu Apps Script publicado.
      </q-banner>

      <q-banner v-else-if="errorMessage" class="bg-negative text-white q-mt-md" rounded>
        <template #avatar>
          <q-icon name="error" />
        </template>
        {{ errorMessage }}
      </q-banner>

      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-info">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="blue-1" text-color="blue-8" icon="assignment" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Registros</div>
                <div class="text-h5 text-weight-bold">{{ dashboard.registros.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-completed">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="green-1" text-color="green-8" icon="login" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Check in</div>
                <div class="text-h5 text-weight-bold">{{ checkinCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-pending">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="red-1" text-color="red-8" icon="logout" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Check out</div>
                <div class="text-h5 text-weight-bold">{{ checkoutCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-pending">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="amber-1" text-color="amber-9" icon="hourglass_empty" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Pendientes</div>
                <div class="text-h5 text-weight-bold">{{ pendingCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-4">
          <q-card class="summary-card summary-card-completed">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="green-1" text-color="green-8" icon="task_alt" />
              <div class="q-ml-md">
                <div class="text-caption text-grey-7">Completados</div>
                <div class="text-h5 text-weight-bold">{{ completedCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="48px" color="deep-purple-7" />
      </q-inner-loading>

      <div v-if="hasData" class="q-mt-lg">
        <q-card class="data-card">
          <q-card-section class="section-header section-header-info">
            <div class="text-subtitle1 text-weight-bold">Registros de Puesto 01</div>
            <div class="text-caption">Cada fila representa un solo registro con ingreso y salida</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="(item, index) in dashboard.registros" :key="`p01-registro-${item.id}-${index}`">
              <q-item-section>
                <div class="row items-center justify-between q-col-gutter-sm">
                  <div class="col">
                    <q-item-label class="text-weight-bold text-subtitle1 text-green-8">
                      {{ item.ingreso.nombre || item.salida.nombre || 'Sin nombre' }}
                    </q-item-label>
                    <q-item-label caption class="puesto01-casita">
                      Casita: {{ item.ingreso.casita || item.salida.casita || '-' }}
                    </q-item-label>
                  </div>
                  <div class="col-auto">
                    <q-badge :color="item.status.color" :label="item.status.label" rounded class="text-weight-bold" />
                  </div>
                </div>

                    <div class="puesto01-data-group puesto01-data-group-ingreso q-mt-sm">
                      <div class="puesto01-data-title text-green-8">Ingreso</div>
                      <div class="puesto01-data-line text-green-7">
                        Hora: {{ item.ingreso.hora || 'Pendiente' }}
                      </div>
                      <div class="puesto01-data-line text-green-7">
                        Placa: {{ item.ingreso.placa || 'Sin placa' }}
                      </div>
                      <div class="puesto01-data-line text-green-7">
                        Oficial: {{ item.ingreso.oficial || 'Pendiente' }}
                      </div>
                    </div>

                    <div class="puesto01-data-group puesto01-data-group-salida q-mt-sm">
                      <div class="puesto01-data-title text-red-8">Salida</div>
                      <div class="puesto01-data-line text-red-7">
                        Hora: {{ item.salida.hora || 'Pendiente' }}
                      </div>
                      <div class="puesto01-data-line text-red-7">
                        Colaborador: {{ item.salida.colaborador || 'Pendiente' }}
                      </div>
                      <div class="puesto01-data-line text-red-7">
                        Motivo: {{ item.salida.motivo || 'Pendiente' }}
                      </div>
                      <div class="puesto01-data-line text-red-7">
                        Oficial salida: {{ item.salida.oficial || 'Pendiente' }}
                      </div>
                      <div class="puesto01-data-line text-red-7">
                        Placa salida: {{ item.salida.placa || 'Sin placa' }}
                      </div>
                    </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <q-card v-else-if="scriptConfigured && !loading && !errorMessage" class="empty-state q-mt-lg">
        <q-card-section class="text-center q-py-xl">
          <q-icon name="store" size="72px" color="grey-4" />
          <div class="text-h6 text-grey-7 q-mt-md">No hay registros para Puesto 01</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { fetchPuesto01Dashboard } from '../services/googleSheets'

export default defineComponent({
  name: 'Puesto01Page',
  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    const errorMessage = ref('')
    const dashboard = ref({ registros: [], fecha: null })

    const scriptConfigured = computed(() => Boolean(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL_PUESTO01))
    const hasData = computed(() => dashboard.value.registros.length > 0)

    const checkinCount = computed(() => (
      dashboard.value.registros.filter((item) => item.status.key === 'checkin').length
    ))

    const pendingCount = computed(() => (
      dashboard.value.registros.filter((item) => item.status.key === 'pending').length
    ))

    const checkoutCount = computed(() => (
      dashboard.value.registros.filter((item) => item.status.key === 'checkout').length
    ))

    const completedCount = computed(() => (
      dashboard.value.registros.filter((item) => item.status.key === 'completed').length
    ))

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

    const loadDashboard = async () => {
      if (!scriptConfigured.value) {
        errorMessage.value = 'Falta configurar VITE_GOOGLE_APPS_SCRIPT_URL_PUESTO01'
        return
      }

      loading.value = true
      errorMessage.value = ''

      try {
        dashboard.value = await fetchPuesto01Dashboard()
      } catch (error) {
        errorMessage.value = error.message || 'No se pudieron cargar los datos de Puesto 01'
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
      completedCount,
      dashboard,
      errorMessage,
      hasData,
      loading,
      loadDashboard,
      checkinCount,
      checkoutCount,
      pendingCount,
      reportDateLabel,
      scriptConfigured
    }
  }
})
</script>

<style scoped>
.puesto01-page {
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
  color: #4527a0;
  background: linear-gradient(90deg, #ede7f6 0%, #fff3cd 100%);
  display: inline-block;
  padding: 8px 14px;
  border-radius: 14px;
  border: 1px solid rgba(69, 39, 160, 0.14);
  box-shadow: 0 6px 16px rgba(69, 39, 160, 0.12);
}

.summary-card,
.data-card,
.empty-state {
  border-radius: 24px;
  box-shadow: 0 10px 28px rgba(31, 53, 82, 0.08);
}

.summary-card {
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.summary-card-info {
  background: linear-gradient(135deg, #f2f8ff 0%, #ffffff 100%);
}

.summary-card-pending {
  background: linear-gradient(135deg, #fff7e8 0%, #ffffff 100%);
}

.summary-card-completed {
  background: linear-gradient(135deg, #f2fff7 0%, #ffffff 100%);
}

.puesto01-casita {
  color: #ef6c00;
  font-size: 1.05rem;
  font-weight: 700;
}

.text-green-7,
.text-green-8 {
  color: #2e7d32 !important;
}

.text-red-7 {
  color: #c62828 !important;
}

.puesto01-data-group {
  padding: 12px 14px;
  border-radius: 16px;
}

.puesto01-data-group-ingreso {
  background: rgba(46, 125, 50, 0.08);
}

.puesto01-data-group-salida {
  background: rgba(198, 40, 40, 0.08);
}

.puesto01-data-title {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.puesto01-data-line {
  font-size: 0.95rem;
  line-height: 1.4;
}

@media (max-width: 599px) {
  .puesto01-page .q-item__label,
  .puesto01-page .q-item__label--caption {
    font-size: 0.98rem;
    line-height: 1.45;
  }

  .puesto01-page .text-subtitle1 {
    font-size: 1.1rem;
    line-height: 1.35;
  }

  .puesto01-page .text-h5 {
    font-size: 1.35rem;
    line-height: 1.25;
  }

  .puesto01-page .puesto01-casita {
    font-size: 1.1rem;
  }
}

.section-header {
  color: white;
}

.section-header-info {
  background: linear-gradient(135deg, #5e35b1 0%, #3949ab 100%);
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

.body--dark .puesto01-page {
  background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
}
</style>