<template>
  <q-page class="logs-page q-pa-md">
    <div class="logs-shell">
      <section class="logs-hero q-mb-lg">
        <div class="logs-hero__topbar">
          <q-btn flat round dense icon="arrow_back" class="logs-back-btn" @click="router.push('/seguridad')" />
          <div class="logs-hero__eyebrow">Security Desk</div>
          <div class="logs-hero__count">{{ filteredLogs.length }}</div>
        </div>

        <div class="logs-hero__content">
          <div class="logs-hero__copy">
            <div class="logs-hero__kicker">Registro operativo</div>
            <h1 class="logs-hero__title">Bitácora diaria</h1>
            <p class="logs-hero__description">
              Reportes rondas, entregas y novedades de la operación.
            </p>

            <div class="logs-hero__actions gt-sm">
              <q-btn
                no-caps
                unelevated
                rounded
                icon="add"
                label="Nueva entrada"
                class="logs-primary-btn"
                @click="showAddDialog = true"
                :disable="!isLoggedIn"
              />
              <q-btn
                v-if="hasActiveFilters"
                no-caps
                flat
                rounded
                icon="filter_list_off"
                label="Limpiar filtros"
                class="logs-secondary-btn"
                @click="clearFilters"
              />
            </div>
          </div>

          <div class="logs-hero__stats">
            <article v-for="stat in heroStats" :key="stat.label" class="logs-stat-card">
              <div class="logs-stat-card__label">{{ stat.label }}</div>
              <div class="logs-stat-card__value">{{ stat.value }}</div>
              <div class="logs-stat-card__meta">{{ stat.meta }}</div>
            </article>
          </div>
        </div>
      </section>

      <section class="filter-card q-mb-md q-pa-md">
        <div class="filter-card__header">
          <div>
            <div class="filter-card__eyebrow">Command Filters</div>
            <div class="filter-card__title">Busca por oficial, bitácora, fecha o tipo de evento.</div>
          </div>
          <div class="logs-panel-tag">{{ hasActiveFilters ? 'Activos' : 'Sin filtros' }}</div>
        </div>

        <div class="row q-col-gutter-sm items-center q-mt-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchTerm"
              outlined
              dense
              placeholder="Buscar por fecha, oficial, evento o detalle..."
              class="logs-search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="searchTerm" name="clear" class="cursor-pointer" @click="searchTerm = ''" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-6 row items-center justify-between no-wrap">
            <div class="quick-filter-row col">
              <q-chip
                v-for="f in quickFilters"
                :key="f.value"
                clickable
                :class="['quick-filter-chip', { 'quick-filter-chip--active': quickFilter === f.value }]"
                @click="quickFilter = (quickFilter === f.value ? 'all' : f.value)"
              >
                <q-icon :name="f.icon" size="16px" class="q-mr-xs" />
                {{ f.label }}
              </q-chip>
            </div>
          </div>
        </div>

        <div class="q-mt-md filter-card__advanced q-pt-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="filter-card__label">Tipo de evento</div>
              <div class="quick-filter-row">
                <q-chip
                  clickable
                  dense
                  :class="['quick-filter-chip', { 'quick-filter-chip--active': eventFilter === 'all' }]"
                  @click="eventFilter = 'all'"
                >
                  <q-icon name="apps" size="14px" class="q-mr-xs" />
                  Todos
                </q-chip>
                <q-chip
                  v-for="et in eventTypes"
                  :key="et"
                  clickable
                  dense
                  :class="['quick-filter-chip', { 'quick-filter-chip--active': eventFilter === et }]"
                  @click="eventFilter = eventFilter === et ? 'all' : et"
                >
                  {{ et }}
                </q-chip>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row items-center justify-between q-mb-xs">
                <div class="filter-card__label">Bitácora</div>
                <q-btn
                  v-if="hasActiveFilters"
                  no-caps
                  flat
                  rounded
                  icon="filter_list_off"
                  label="Limpiar"
                  class="logs-clear-inline"
                  @click="clearFilters"
                />
              </div>
              <div class="quick-filter-row">
                <q-chip
                  v-for="opt in bitacoraOptions"
                  :key="opt"
                  clickable
                  dense
                  :class="['quick-filter-chip', { 'quick-filter-chip--active': bitacoraFilter === opt }]"
                  @click="bitacoraFilter = bitacoraFilter === opt ? '' : opt"
                >
                  {{ opt }}
                </q-chip>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner color="primary" size="36px" />
        <div style="margin-top: 12px; color: rgba(0,0,0,0.48); font-size: 14px;">Cargando bitácora...</div>
      </div>

      <div v-else-if="filteredLogs.length > 0" class="q-px-sm q-pb-xl timeline-container">
        <q-timeline color="primary" layout="dense">
          <q-timeline-entry heading class="logs-timeline-heading q-mb-none q-pb-md">
            
          </q-timeline-entry>

          <q-timeline-entry
            v-for="log in filteredLogs"
            :key="log.id"
            :icon="getEventIcon(log.event_type)"
            :color="getEventColor(log.event_type).replace('-7', '')"
            class="cursor-pointer log-timeline-entry"
            @click="openDetail(log)"
          >
            <template v-slot:title>
              <div class="log-entry-title row items-center no-wrap">
                <span class="log-entry-event">{{ log.event_type }}</span>
                <q-chip
                  v-if="log.event_type === 'Entrega de turno'"
                  :class="['log-entry-status', { 'log-entry-status--ok': log.firma, 'log-entry-status--warning': !log.firma }]"
                  dense
                  rounded
                  size="10px"
                  class="q-ml-sm q-my-none text-weight-bold"
                >
                  <q-icon :name="log.firma ? 'check_circle' : 'pending'" size="12px" class="q-mr-xs" />
                  {{ log.firma ? 'Firmado' : 'Pendiente' }}
                </q-chip>
              </div>
            </template>
            
            <template v-slot:subtitle>
              <div class="log-entry-time">
                {{ formatDateTime(log.created_at) }}
              </div>
            </template>

            <div class="timeline-content-card q-mt-xs" :style="{ '--log-accent': `var(--q-${getEventColor(log.event_type).replace('-7', '')})` }">
              <div class="timeline-content-card__top">
                <div>
                  <div class="timeline-content-card__guard">{{ log.colaborador || log.guard_id || 'Sin oficial' }}</div>
                  <div v-if="log.oficial_recibe" class="timeline-content-card__receiver">Recibe {{ log.oficial_recibe }}</div>
                </div>
                <div class="timeline-content-card__bitacora">{{ log.nombre_bitacora || 'Sin bitácora' }}</div>
              </div>

              <div class="timeline-content-card__body">
                {{ log.description || 'Sin novedad reportada.' }}
              </div>
            </div>
          </q-timeline-entry>
        </q-timeline>
      </div>

      <div v-else class="empty-state">
        <q-icon :name="hasActiveFilters ? 'search_off' : 'menu_book'" size="52px" color="grey-4" />
        <div class="text-body1 text-grey-5 q-mt-sm">{{ hasActiveFilters ? 'Sin resultados' : 'Sin registros' }}</div>
        <div class="text-caption text-grey-4">{{ hasActiveFilters ? 'Intenta con otros filtros' : 'No hay entradas en la bitácora' }}</div>
        <q-btn v-if="hasActiveFilters" flat rounded no-caps color="primary" label="Limpiar filtros" class="q-mt-sm" @click="clearFilters" />
      </div>

      <!-- FAB -->
      <q-page-sticky position="bottom-right" :offset="[20, 20]" class="lt-md">
        <q-btn fab icon="add" class="logs-fab" @click="showAddDialog = true" :disable="!isLoggedIn" />
      </q-page-sticky>

      <!-- Dialog para nueva entrada -->
      <q-dialog v-model="showAddDialog" persistent>
        <q-card class="logs-dialog" style="min-width: 340px; max-width: 500px;">
          <q-card-section class="row items-center q-pb-none">
            <div class="logs-dialog__title">Nueva entrada</div>
            <q-space />
            <q-btn flat round dense icon="close" @click="closeDialog" />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <!-- Nombre de bitácora -->
            <q-select
              v-model="newLog.nombre_bitacora"
              :options="bitacoraOptions"
              label="Nombre de bitácora"
              outlined
              rounded
              class="q-mb-md"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="menu_book" />
              </template>
            </q-select>

            <!-- Tipo de evento -->
            <q-select
              v-model="newLog.event_type"
              :options="eventTypes"
              label="Tipo de evento"
              outlined
              rounded
              class="q-mb-md"
              emit-value
              map-options
              @update:model-value="onEventTypeChange"
            >
              <template v-slot:prepend>
                <q-icon name="event_note" />
              </template>
            </q-select>

            <!-- Campo Oficial que Recibe (solo si es Entrega de turno) -->
            <q-select
              v-if="showOficialRecibe"
              v-model="newLog.oficial_recibe"
              :options="userOptions"
              label="Oficial que recibe"
              outlined
              rounded
              class="q-mb-md"
              emit-value
              map-options
              use-input
              input-debounce="300"
              @filter="filterUsers"
            >
              <template v-slot:prepend>
                <q-icon name="badge" />
              </template>
            </q-select>

            <!-- Campo Colaboradores en turno (solo si es Entrega de turno Y es Admin/SuperAdmin) -->
            <q-select
              v-if="showColaboradoresTurno"
              ref="colaboradoresSelect"
              v-model="newLog.colaboradores_turno"
              :options="userOptions"
              label="Colaboradores en turno"
              outlined
              rounded
              multiple
              use-chips
              clearable
              class="q-mb-md"
              emit-value
              map-options
              use-input
              input-debounce="300"
              @filter="filterUsers"
            >
              <template v-slot:prepend>
                <q-icon name="group" />
              </template>
              <template v-slot:before-options>
                <q-item
                  v-if="newLog.colaboradores_turno && newLog.colaboradores_turno.length > 0"
                  v-close-popup
                  clickable
                  class="text-primary bg-grey-2"
                  @click="closeColaboradoresDropdown"
                >
                  <q-item-section class="text-center">
                    <q-item-label class="text-weight-bold">✓ Listo</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps">
                  <q-item-section side>
                    <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Activos Entregados (solo si es Entrega de turno) -->
            <div v-if="showActivosEntregados" class="q-mb-md">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Activos entregados</div>

              <!-- Cantidad de llaves -->
              <q-input
                v-model="newLog.activos.cantidad_llaves"
                label="Cantidad de llaves"
                outlined
                rounded
                dense
                class="q-mb-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="key" />
                </template>
              </q-input>

              <!-- Radio dropdown -->
              <q-select
                v-model="newLog.activos.radio"
                :options="radioOptions"
                label="Radio"
                outlined
                rounded
                dense
                class="q-mb-sm"
                emit-value
                map-options
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="radio" />
                </template>
              </q-select>

              <!-- Otros activos dropdown múltiple -->
              <q-select
                v-model="newLog.activos.otros_activos"
                :options="otrosActivosOptions"
                label="Otros activos"
                outlined
                rounded
                dense
                multiple
                use-chips
                clearable
                class="q-mb-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="inventory" />
                </template>
                <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section side>
                      <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ opt }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <!-- Campo de texto cuando se selecciona "Otros" -->
              <q-input
                v-if="newLog.activos.otros_activos && newLog.activos.otros_activos.includes('Otros')"
                v-model="newLog.activos.otros_activos_detalle"
                label="Especifique otros activos"
                outlined
                rounded
                dense
                class="q-mb-sm"
                placeholder="Describa los otros activos..."
              >
                <template v-slot:prepend>
                  <q-icon name="edit" />
                </template>
              </q-input>
            </div>

            <!-- Detalle del reporte -->
            <q-input
              v-model="newLog.description"
              label="Detalle su reporte"
              type="textarea"
              outlined
              rounded
              autogrow
              class="q-mb-md"
              placeholder="Escriba el detalle de su reporte..."
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
              :disable="!newLog.nombre_bitacora || !newLog.event_type"
              @click="saveLog"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

    <!-- Dialog de detalle del registro -->
      <q-dialog v-model="showDetailDialog" persistent>
        <q-card class="logs-dialog" style="min-width: 340px; max-width: 520px; width: 100%;">
          <q-card-section class="row items-center q-pb-none">
            <div class="logs-dialog__title">Detalle del registro</div>
            <q-space />
            <q-btn flat round dense icon="close" @click="closeDetail" />
          </q-card-section>

          <q-card-section v-if="selectedLog" class="q-pt-sm">
            <!-- Nombre de bitácora -->
            <div v-if="selectedLog.nombre_bitacora" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Nombre de bitácora</div>
              <q-chip color="deep-purple-7" text-color="white" dense rounded>
                <q-icon name="menu_book" size="14px" class="q-mr-xs" />
                {{ selectedLog.nombre_bitacora }}
              </q-chip>
            </div>

            <!-- Fecha y hora -->
            <div class="text-caption text-grey-6 q-mb-xs">Fecha y hora</div>
            <div class="text-body1 text-weight-medium q-mb-md">{{ formatDateTime(selectedLog.created_at) }}</div>

            <!-- Tipo de evento -->
            <div class="text-caption text-grey-6 q-mb-xs">Tipo de evento</div>
            <q-chip :color="getEventColor(selectedLog.event_type)" text-color="white" dense rounded class="q-mb-md">
              <q-icon :name="getEventIcon(selectedLog.event_type)" size="14px" class="q-mr-xs" />
              {{ selectedLog.event_type }}
            </q-chip>

            <!-- Colaborador -->
            <div class="text-caption text-grey-6 q-mb-xs">Colaborador</div>
            <div class="text-body1 text-weight-medium q-mb-md">{{ selectedLog.colaborador || 'Sin dato' }}</div>

            <!-- Oficial que recibe (solo si aplica) -->
            <div v-if="selectedLog.oficial_recibe" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Oficial que recibe</div>
              <div class="text-body1 text-weight-medium">{{ selectedLog.oficial_recibe }}</div>
            </div>

            <!-- Colaboradores en turno (solo si aplica) -->
            <div v-if="selectedLog.colaboradores_turno && selectedLog.colaboradores_turno.length > 0" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Colaboradores en turno</div>
              <div class="q-gutter-xs q-mt-xs">
                <q-chip v-for="col in selectedLog.colaboradores_turno" :key="col" dense color="blue-1" text-color="blue-9">
                  <q-icon name="person" size="12px" class="q-mr-xs" />
                  {{ col }}
                </q-chip>
              </div>
            </div>

            <!-- Activos entregados (solo si aplica) -->
            <div v-if="selectedLog.activos" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Activos entregados</div>
              <q-card flat bordered class="q-pa-sm q-mt-xs">
                <div v-if="selectedLog.activos.cantidad_llaves" class="text-body2 q-mb-xs">
                  <q-icon name="key" size="14px" color="amber" class="q-mr-xs" />
                  <strong>Llaves:</strong> {{ selectedLog.activos.cantidad_llaves }}
                </div>
                <div v-if="selectedLog.activos.radio" class="text-body2 q-mb-xs">
                  <q-icon name="radio" size="14px" color="purple" class="q-mr-xs" />
                  <strong>Radio:</strong> {{ selectedLog.activos.radio }}
                </div>
                <div v-if="selectedLog.activos.otros_activos && selectedLog.activos.otros_activos.length > 0" class="q-mt-xs">
                  <div class="text-body2">
                    <q-icon name="inventory" size="14px" color="teal" class="q-mr-xs" />
                    <strong>Otros activos:</strong>
                  </div>
                  <div class="q-gutter-xs q-mt-xs">
                    <q-chip v-for="activo in selectedLog.activos.otros_activos" :key="activo" dense color="teal-1" text-color="teal-9">
                      {{ activo }}
                    </q-chip>
                  </div>
                  <!-- Mostrar detalle de "Otros" si existe -->
                  <div v-if="selectedLog.activos.otros_activos.includes('Otros') && selectedLog.activos.otros_activos_detalle" class="text-body2 q-mt-xs q-ml-sm">
                    <q-icon name="edit" size="14px" color="teal" class="q-mr-xs" />
                    <strong>Especifique:</strong> {{ selectedLog.activos.otros_activos_detalle }}
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Descripción -->
            <div v-if="selectedLog.description" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Detalle del reporte</div>
              <div class="text-body2">{{ selectedLog.description }}</div>
            </div>

            <!-- Ubicación -->
            <div v-if="selectedLog.location_area" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Ubicación</div>
              <div class="text-body2">{{ selectedLog.location_area }}</div>
            </div>

            <!-- Firma -->
            <div v-if="selectedLog.event_type === 'Entrega de turno'" class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs">Firma de Recibido</div>
              <q-chip
                :color="selectedLog.firma ? 'green-7' : 'red-7'"
                :text-color="selectedLog.firma ? 'white' : 'white'"
                dense
                rounded
                class="q-mb-sm"
              >
                <q-icon :name="selectedLog.firma ? 'check_circle' : 'pending'" size="16px" class="q-mr-xs" />
                {{ selectedLog.firma ? 'Firmado' : 'Pendiente de firmar' }}
              </q-chip>
              <div v-if="selectedLog.firma" class="q-mt-sm">
                <q-img :src="selectedLog.firma" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;" />
              </div>
              <div v-else-if="canSignReceipt" class="q-mt-sm column items-center">
                <div class="text-body2 text-grey-7 q-mb-sm">Por favor, firme aquí para confirmar recepción:</div>
                <canvas ref="signatureCanvas" class="bg-grey-2 shadow-2" style="border: 1px solid #ccc; width: 100%; max-width: 400px; height: 200px; border-radius: 8px;"></canvas>
                <div class="q-mt-md row q-gutter-sm justify-center">
                  <q-btn label="Limpiar" color="negative" flat @click="clearSignature" />
                  <q-btn label="Firmar recibo de puesto" color="primary" @click="saveSignature" :loading="savingSignature" />
                </div>
              </div>
              <div v-else class="text-body2 text-grey-5 italic q-mt-xs">Pendiente de firma</div>
            </div>

          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { useQuasar } from 'quasar'
import SignaturePad from 'signature_pad'

export default defineComponent({
  name: 'DailyLogsPage',
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()
    const $q = useQuasar()
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const isSuperAdminOrAdmin = computed(() => {
      const rol = authStore.user?.Rol
      return rol === 'SuperAdmin' || rol === 'Admin'
    })
    const userId = computed(() => authStore.user?.id || null)

    const loading = ref(true)
    const saving = ref(false)
    const logs = ref([])
    const searchTerm = ref('')
    const quickFilter = ref('all')
    const eventFilter = ref('all')
    const bitacoraFilter = ref('')
    const showFilters = ref($q.screen.gt.sm)
    const showAddDialog = ref(false)
    const showDetailDialog = ref(false)
    const selectedLog = ref(null)
    const users = ref([])
    const userOptions = ref([])
    const colaboradoresSelect = ref(null)

    // Nuevos tipos de evento según requerimientos
    const eventTypes = [
      'Revisión',
      'Recorrido',
      'Entrega de turno',
      'Reporte Novedad'
    ]

    // Opciones de radio
    const radioOptions = [
      'Radio 6400',
      'Radio 6627',
      'Radio 6620',
      'Radio 6405',
      'Radio 6406',
      'Radio 6623',
      'Radio 8497',
      'Radio 8705',
      'Radio 8706',
      'Radio 6853'
    ]

    // Opciones de otros activos
    const otrosActivosOptions = [
      'Bitacora de incidencias',
      'Batería portátil',
      'Celular supervisor',
      'Otros'
    ]

    // Opciones de nombre de bitácora
    const bitacoraOptions = computed(() => {
      const user = authStore.user?.Usuario
      const rol = authStore.user?.Rol

      // Admins y usuarios específicos que ven todo
      if (rol === 'SuperAdmin' || rol === 'Admin' || user === 'JosephR' || user === 'Ramiro Q') {
        return [
          'Bitacora Puesto 7',
          'Bitacora Puesto 1',
          'Supervisores General',
          'Bitacora Ramiro',
          'Bitacora Michael',
          'Bitacora Juan',
          'Bitacora Cristofer',
          'Bitacora Jefferson'
        ]
      }

      // Reglas para usuarios específicos
      if (user === 'Jefferson V') return ['Bitacora Jefferson', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1']
      if (user === 'Juan M') return ['Bitacora Juan', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1']
      if (user === 'Cristhfer G' || user === 'Cristhofer G') return ['Bitacora Cristofer', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1']
      if (user === 'Michael J') return ['Bitacora Michael', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1']

      // Por defecto para Rol User (excluye las restringidas)
      return [
        'Bitacora Puesto 7',
        'Bitacora Puesto 1'
      ]
    })

    const newLog = ref({
      nombre_bitacora: '',
      event_type: '',
      description: '',
      oficial_recibe: '',
      colaboradores_turno: [],
      activos: {
        cantidad_llaves: '',
        radio: '',
        otros_activos: [],
        otros_activos_detalle: ''
      }
    })

    // Mostrar campo Oficial que Recibe solo si es "Entrega de turno"
    const showOficialRecibe = computed(() => newLog.value.event_type === 'Entrega de turno')

    // Mostrar Colaboradores en turno solo si es "Entrega de turno" Y es Admin/SuperAdmin
    const showColaboradoresTurno = computed(() =>
      newLog.value.event_type === 'Entrega de turno' && isSuperAdminOrAdmin.value
    )

    // Mostrar Activos Entregados solo si es "Entrega de turno"
    const showActivosEntregados = computed(() => newLog.value.event_type === 'Entrega de turno')

    const signatureCanvas = ref(null)
    const signaturePad = ref(null)
    const savingSignature = ref(false)

    const quickFilters = computed(() => {
      const filters = [
        { label: 'Todos', value: 'all', icon: 'apps' },
        { label: 'Hoy', value: 'today', icon: 'today' }
      ]
      if (isLoggedIn.value) {
        filters.splice(1, 0, { label: 'Míos', value: 'mine', icon: 'person' })
      }
      return filters
    })

    const canSignReceipt = computed(() => {
      return (
        selectedLog.value &&
        selectedLog.value.event_type === 'Entrega de turno' &&
        !selectedLog.value.firma &&
        selectedLog.value.oficial_recibe &&
        selectedLog.value.oficial_recibe === authStore.user?.Usuario
      )
    })

    const initSignaturePad = () => {
      if (signatureCanvas.value) {
        // Adjust canvas resolution for high DPI displays
        const canvas = signatureCanvas.value
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        canvas.getContext('2d').scale(ratio, ratio)

        signaturePad.value = new SignaturePad(canvas)
      }
    }

    const clearSignature = () => {
      if (signaturePad.value) {
        signaturePad.value.clear()
      }
    }

    const saveSignature = async () => {
      if (!signaturePad.value || signaturePad.value.isEmpty()) {
        $q.notify({ type: 'warning', message: 'Debe firmar antes de guardar' })
        return
      }

      savingSignature.value = true
      try {
        const dataUrl = signaturePad.value.toDataURL('image/png')
        const blob = await (await fetch(dataUrl)).blob()
        const fileName = `firma_${selectedLog.value.id}_${Date.now()}.png`
        const storagePath = `firmas/${fileName}`
        const file = new File([blob], fileName, { type: 'image/png' })

        // 1. Upload
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Imagenes')
          .upload(storagePath, file, { upsert: false })

        if (uploadError) throw uploadError

        // 2. Get Public URL
        const { data: urlData } = supabase.storage
          .from('Imagenes')
          .getPublicUrl(storagePath)
        
        const fileUrl = urlData.publicUrl

        // 3. Update Record
        const { error: updateError } = await supabase
          .from('daily_logs')
          .update({ firma: fileUrl })
          .eq('id', selectedLog.value.id)

        if (updateError) throw updateError

        selectedLog.value.firma = fileUrl
        $q.notify({ type: 'positive', message: 'Firma guardada correctamente' })
      } catch (err) {
        console.error('Error saving signature:', err)
        $q.notify({ type: 'negative', message: 'Error al guardar la firma' })
      } finally {
        savingSignature.value = false
      }
    }

    const getEventIcon = (type) => {
      const icons = {
        'Revisión': 'assignment',
        'Recorrido': 'directions_walk',
        'Entrega de turno': 'swap_horiz',
        'Reporte Novedad': 'flag'
      }
      return icons[type] || 'note'
    }

    const getEventColor = (type) => {
      const colors = {
        'Revisión': 'blue-7',
        'Recorrido': 'green-7',
        'Entrega de turno': 'purple-7',
        'Reporte Novedad': 'orange-7'
      }
      return colors[type] || 'grey-7'
    }

    const parseDateValue = (dateString) => {
      if (!dateString) return null
      const d = new Date(dateString)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const isSameCalendarDay = (a, b) => {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    }

    const formatTime = (dateString) => {
      const date = parseDateValue(dateString)
      if (!date) return ''
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    const formatDateTime = (dateString) => {
      const date = parseDateValue(dateString)
      if (!date) return 'Sin fecha'
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} · ${hours}:${minutes}`
    }

    const formatCompactDateTime = (dateString) => {
      const date = parseDateValue(dateString)
      if (!date) return 'Sin fecha'
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }

    const buildDesktopLogText = (log) => {
      const baseDate = formatCompactDateTime(log.created_at)
      const collaborator = log.colaborador || log.guard_id || 'Sin oficial'
      const eventType = log.event_type || 'sin evento'
      const description = (log.description || '').trim() || 'sin detalle'

      if (eventType === 'Recorrido') {
        return `${baseDate} Reporta ${collaborator} en ${eventType} ${description}`
      }

      if (eventType === 'Revisión') {
        return `${baseDate} Reporta con ${collaborator} en ${eventType} reporta ${description}`
      }

      if (eventType === 'Entrega de turno') {
        let assetsText = ''
        if (log.activos) {
          const a = typeof log.activos === 'string' ? JSON.parse(log.activos) : log.activos
          const parts = []
          if (a.cantidad_llaves) parts.push(`Llaves: ${a.cantidad_llaves}`)
          if (a.radio) parts.push(`Radio: ${a.radio}`)
          if (a.otros_activos && a.otros_activos.length > 0) parts.push(`Otros: ${a.otros_activos.join(', ')}`)
          assetsText = parts.length > 0 ? ` y con los siguientes activos ${parts.join(', ')}` : ''
        }
        return `${baseDate} ${collaborator} en ${eventType} reporta ${description}${assetsText}`
      }

      return `${baseDate} ${collaborator} en ${eventType} reporta ${description}`
    }

    const filteredLogs = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      const userName = authStore.user?.Usuario
      const userRole = authStore.user?.Rol

      return logs.value.filter(log => {
        const bitName = log.nombre_bitacora

        // Reglas de visibilidad por Usuario/Rol
        if (userName === 'JosephR' || userName === 'Ramiro Q') {
          // Ven todo
        } else if (userName === 'Jefferson V') {
          if (!['Bitacora Jefferson', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1'].includes(bitName)) return false
        } else if (userName === 'Juan M') {
          if (!['Bitacora Juan', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1'].includes(bitName)) return false
        } else if (userName === 'Cristhfer G' || userName === 'Cristhofer G') {
          if (!['Bitacora Cristofer', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1'].includes(bitName)) return false
        } else if (userName === 'Michael J') {
          if (!['Bitacora Michael', 'Supervisores General', 'Bitacora Puesto 7', 'Bitacora Puesto 1'].includes(bitName)) return false
        } else if (userRole === 'User') {
          const forbiddenForUser = [
            'Supervisores General',
            'Bitacora Ramiro',
            'Bitacora Jefferson',
            'Bitacora Cristofer',
            'Bitacora Juan',
            'Bitacora Michael'
          ]
          if (forbiddenForUser.includes(bitName)) return false
        }

        // Filtros rápidos y búsqueda
        if (quickFilter.value === 'mine') {
          const isMine = log.colaborador === userName || 
                         log.guard_id === userName || 
                         log.oficial_recibe === userName ||
                         (log.colaboradores_turno && log.colaboradores_turno.includes(userName))
          if (!isMine) return false
        }
        
        if (quickFilter.value === 'today') {
          const d = parseDateValue(log.created_at)
          if (!d || !isSameCalendarDay(d, new Date())) return false
        }

        // Filtro por bitácora específica (nuevo)
        if (bitacoraFilter.value && bitName !== bitacoraFilter.value) return false

        // Filtro por tipo de evento
        if (eventFilter.value && eventFilter.value !== 'all' && log.event_type !== eventFilter.value) return false

        if (!term) return true
        return (
          (log.event_type || '').toLowerCase().includes(term) ||
          (log.nombre_bitacora || '').toLowerCase().includes(term) ||
          (log.colaborador || log.guard_id || '').toLowerCase().includes(term) ||
          (log.oficial_recibe || '').toLowerCase().includes(term) ||
          (log.description || '').toLowerCase().includes(term) ||
          formatDateTime(log.created_at).toLowerCase().includes(term)
        )
      })
    })

    const todayLogCount = computed(() => {
      return logs.value.filter((log) => {
        const parsed = parseDateValue(log.created_at)
        return parsed && isSameCalendarDay(parsed, new Date())
      }).length
    })

    const pendingSignatureCount = computed(() => {
      return logs.value.filter((log) => log.event_type === 'Entrega de turno' && !log.firma).length
    })

    const heroStats = computed(() => ([
      {
        label: 'Visibles',
        value: filteredLogs.value.length,
        meta: hasActiveFilters.value ? 'Según filtros' : 'Vista completa'
      },
      {
        label: 'Hoy',
        value: todayLogCount.value,
        meta: 'Actividad del día'
      },
      {
        label: 'Pendientes',
        value: pendingSignatureCount.value,
        meta: 'Firmas por cerrar'
      }
    ]))

    const hasActiveFilters = computed(() => {
      const defaultFilter = 'all'
      return Boolean(searchTerm.value.trim()) ||
             quickFilter.value !== defaultFilter ||
             eventFilter.value !== 'all' ||
             Boolean(bitacoraFilter.value)
    })

    const clearFilters = () => {
      searchTerm.value = ''
      quickFilter.value = 'all'
      eventFilter.value = 'all'
      bitacoraFilter.value = ''
    }

    const filterUsers = (val, update) => {
      update(() => {
        const needle = val.toLowerCase()
        userOptions.value = users.value
          .filter(user => user.toLowerCase().includes(needle))
          .map(user => ({ label: user, value: user }))
      })
    }

    const closeColaboradoresDropdown = () => {
      if (colaboradoresSelect.value) {
        colaboradoresSelect.value.hidePopup()
      }
    }

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('Usuarios')
        .select('Usuario')
        .order('Usuario', { ascending: true })

      if (error) throw error

      users.value = (data || []).map(row => row.Usuario).filter(Boolean)
      userOptions.value = users.value.map(user => ({ label: user, value: user }))
    }

    const fetchLogs = async () => {
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (error) throw error
        
        // Parse JSONB fields
        const parsedData = (data || []).map(log => {
          if (log.activos && typeof log.activos === 'string') {
            try {
              log.activos = JSON.parse(log.activos)
            } catch {
              log.activos = null
            }
          }
          if (log.colaboradores_turno && typeof log.colaboradores_turno === 'string') {
            try {
              log.colaboradores_turno = JSON.parse(log.colaboradores_turno)
            } catch {
              log.colaboradores_turno = []
            }
          }
          return log
        })
        
        logs.value = parsedData
      } catch (err) {
        console.error('Error fetching daily logs:', err)
        $q.notify({ type: 'negative', message: 'Error al cargar la bitácora' })
      } finally {
        loading.value = false
      }
    }

    const closeDialog = () => {
      showAddDialog.value = false
      newLog.value = {
        nombre_bitacora: '',
        event_type: '',
        description: '',
        oficial_recibe: '',
        colaboradores_turno: [],
        activos: {
          cantidad_llaves: '',
          radio: '',
          otros_activos: []
        }
      }
    }

    const openDetail = (log) => {
      selectedLog.value = log
      showDetailDialog.value = true

      if (log.event_type === 'Entrega de turno' && !log.firma && canSignReceipt.value) {
        nextTick(() => {
          setTimeout(() => {
            initSignaturePad()
          }, 100)
        })
      }
    }

    const closeDetail = () => {
      showDetailDialog.value = false
      selectedLog.value = null
    }

    const tableColumns = [
      { name: 'created_at', align: 'left', label: 'Fecha y Hora', field: 'created_at', sortable: true, format: val => formatDateTime(val) },
      { name: 'nombre_bitacora', align: 'left', label: 'Bitácora', field: 'nombre_bitacora', sortable: true },
      { name: 'event_type', align: 'left', label: 'Tipo de Evento', field: 'event_type', sortable: true },
      { name: 'colaborador', align: 'left', label: 'Oficial en Turno', field: row => row.colaborador || row.guard_id || 'Sin oficial', sortable: true },
      { name: 'oficial_recibe', align: 'left', label: 'Recibe', field: row => row.oficial_recibe || '-', sortable: true },
      { name: 'firma', align: 'center', label: 'Firma', field: 'firma', sortable: true },
      { name: 'acciones', align: 'center', label: 'Acciones', field: 'id' }
    ]

    const onEventTypeChange = (value) => {
      // Limpiar campos condicionales al cambiar tipo de evento
      if (value !== 'Entrega de turno') {
        newLog.value.oficial_recibe = ''
        newLog.value.colaboradores_turno = []
        newLog.value.activos = {
          cantidad_llaves: '',
          radio: '',
          otros_activos: [],
          otros_activos_detalle: ''
        }
      }
    }

    const saveLog = async () => {
      if (!newLog.value.nombre_bitacora || !newLog.value.event_type) {
        $q.notify({ type: 'warning', message: 'Complete los campos obligatorios' })
        return
      }
      saving.value = true
      try {
        // Obtener fecha y hora del dispositivo sin zona horaria
        const now = new Date()
        const localDateTime = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0') + ':' +
          String(now.getSeconds()).padStart(2, '0')

        const record = {
          // Campos automáticos (no visibles en formulario)
          created_at: localDateTime,
          guard_id: userId.value,
          colaborador: authStore.user?.Usuario || 'Desconocido',

          // Campos del formulario
          nombre_bitacora: newLog.value.nombre_bitacora,
          event_type: newLog.value.event_type,
          description: newLog.value.description?.trim() || null,

          // Campos condicionales para "Entrega de turno"
          oficial_recibe: showOficialRecibe.value ? (newLog.value.oficial_recibe || null) : null,
          colaboradores_turno: showColaboradoresTurno.value && newLog.value.colaboradores_turno.length > 0
            ? JSON.stringify(newLog.value.colaboradores_turno)
            : null,
          activos: showActivosEntregados.value
            ? JSON.stringify(newLog.value.activos)
            : null
        }

        const { error } = await supabase.from('daily_logs').insert(record)
        if (error) throw error
        $q.notify({ type: 'positive', message: 'Entrada registrada', icon: 'check_circle' })
        closeDialog()
        await fetchLogs()
      } catch (err) {
        console.error('Error saving log:', err)
        $q.notify({ type: 'negative', message: 'Error al guardar', caption: err.message })
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      try {
        await loadUsers()
      } catch (err) {
        console.error('Error loading users:', err)
      }
      await fetchLogs()
    })

    return {
      router,
      isLoggedIn,
      loading,
      saving,
      logs,
      filteredLogs,
      heroStats,
      searchTerm,
      quickFilter,
      quickFilters,
      eventFilter,
      eventTypes,
      bitacoraFilter,
      bitacoraOptions,
      radioOptions,
      otrosActivosOptions,
      tableColumns,
      showFilters,
      showAddDialog,
      showDetailDialog,
      selectedLog,
      newLog,
      userOptions,
      colaboradoresSelect,
      showOficialRecibe,
      showColaboradoresTurno,
      showActivosEntregados,
      signatureCanvas,
      savingSignature,
      canSignReceipt,
      clearSignature,
      saveSignature,
      hasActiveFilters,
      clearFilters,
      getEventIcon,
      getEventColor,
      formatTime,
      formatDateTime,
      formatCompactDateTime,
      buildDesktopLogText,
      filterUsers,
      closeColaboradoresDropdown,
      openDetail,
      closeDetail,
      closeDialog,
      saveLog,
      onEventTypeChange
    }
  }
})
</script>

<style scoped>
.logs-page {
  background:
    radial-gradient(circle at top left, rgba(0, 0, 0, 0.08), transparent 30%),
    linear-gradient(180deg, #f1f0eb 0%, #ffffff 24%, #f6f5f1 100%);
  color: var(--uber-black);
  font-family: var(--uber-font-body);
}

.logs-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.logs-hero {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0)),
    #0b0b0b;
  color: var(--uber-white);
  border-radius: 32px;
  padding: 20px;
  box-shadow: var(--uber-shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.logs-hero__topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.logs-back-btn,
.logs-filter-toggle {
  background: rgba(255, 255, 255, 0.1);
  color: var(--uber-white);
}

.logs-hero__eyebrow,
.logs-hero__kicker,
.filter-card__eyebrow,
.timeline-content-card__receiver,
.logs-stat-card__label,
.filter-card__label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
}

.logs-hero__eyebrow,
.logs-hero__kicker {
  color: rgba(255, 255, 255, 0.62);
}

.logs-hero__count {
  margin-left: auto;
  min-width: 54px;
  padding: 8px 14px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-white);
  color: var(--uber-black);
  font-family: var(--uber-font-display);
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.logs-hero__content {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.95fr);
  gap: 24px;
}

.logs-hero__title,
.logs-timeline-heading,
.filter-card__title,
.logs-dialog__title {
  font-family: var(--uber-font-display);
}

.logs-hero__title {
  margin: 12px 0 0;
  font-size: clamp(2.3rem, 4vw, 3.9rem);
  line-height: 0.96;
}

.logs-hero__description {
  max-width: 50ch;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.65;
}

.logs-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.logs-primary-btn,
.logs-fab {
  background: var(--uber-white) !important;
  color: var(--uber-black) !important;
  font-weight: 700;
}

.logs-secondary-btn,
.logs-clear-inline {
  background: rgba(255, 255, 255, 0.08);
  color: var(--uber-white);
  font-weight: 700;
}

.logs-hero__stats {
  display: grid;
  gap: 12px;
}

.logs-stat-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 18px;
}

.logs-stat-card__label {
  color: rgba(255, 255, 255, 0.58);
}

.logs-stat-card__value {
  margin-top: 10px;
  font-family: var(--uber-font-display);
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  line-height: 1;
}

.logs-stat-card__meta {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.filter-card {
  background: var(--uber-surface);
  border: 1px solid rgba(15, 15, 15, 0.08);
  border-radius: 28px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(14px);
}

.filter-card__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.filter-card__eyebrow {
  color: #717171;
  margin-bottom: 8px;
}

.filter-card__title {
  font-size: 1.35rem;
  line-height: 1.08;
}

.logs-panel-tag {
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-black);
  color: var(--uber-white);
  font-size: 13px;
  font-weight: 700;
}

.logs-search-input :deep(.q-field__control) {
  border-radius: 18px;
  min-height: 56px;
  background: var(--uber-white);
}

.logs-search-input :deep(.q-field__native),
.logs-search-input :deep(.q-field__marginal) {
  color: #141414;
}

.filter-card__advanced {
  border-top: 1px solid rgba(15, 15, 15, 0.08);
}

.quick-filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px;
  scrollbar-width: none;
}

.quick-filter-row::-webkit-scrollbar {
  display: none;
}

.quick-filter-chip {
  margin: 0;
  border-radius: var(--uber-radius-pill);
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #dedede;
  background: var(--uber-chip-gray);
  color: #101010;
  font-weight: 700;
}

.quick-filter-chip--active {
  background: var(--uber-black) !important;
  color: var(--uber-white) !important;
  border-color: var(--uber-black) !important;
  box-shadow: none !important;
}

.timeline-container {
  padding-bottom: 96px;
}

.logs-timeline-heading {
  font-size: 1.8rem;
  color: var(--uber-black);
}

.log-timeline-entry {
  transition: transform 0.18s ease;
}

.log-timeline-entry:hover {
  transform: translateY(-2px);
}

.log-entry-title {
  gap: 8px;
}

.log-entry-event {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.log-entry-status {
  border: 1px solid transparent;
  font-weight: 700;
}

.log-entry-status--ok {
  background: #ebf7ef;
  color: #19663f;
  border-color: rgba(25, 102, 63, 0.15);
}

.log-entry-status--warning {
  background: #fff1d8;
  color: #8a5b00;
  border-color: rgba(138, 91, 0, 0.12);
}

.log-entry-time {
  color: #6c6c6c;
  font-size: 13px;
  font-weight: 600;
}

.timeline-content-card {
  border-radius: 20px;
  padding: 16px;
  background: var(--uber-white);
  border: 1px solid rgba(15, 15, 15, 0.08);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
  border-left: 4px solid var(--log-accent);
}

.timeline-content-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.timeline-content-card__guard {
  font-size: 1rem;
  font-weight: 800;
  color: var(--uber-black);
}

.timeline-content-card__receiver {
  margin-top: 6px;
  color: #6a6a6a;
}

.timeline-content-card__bitacora {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: var(--uber-radius-pill);
  background: #f2f2ef;
  color: #222222;
  font-size: 12px;
  font-weight: 700;
}

.timeline-content-card__body {
  margin-top: 14px;
  color: #3f3f3f;
  line-height: 1.65;
}

.logs-dialog {
  border-radius: 24px;
  border: 1px solid rgba(15, 15, 15, 0.08);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
}

.logs-dialog__title {
  font-size: 1.2rem;
  font-weight: 800;
}

.logs-fab {
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
}

.empty-state {
  text-align: center;
  padding: 64px 16px;
}

:deep(.q-timeline__dot) {
  box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.05);
}

@media (max-width: 1023px) {
  .logs-hero__content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .logs-page {
    padding-bottom: 100px;
  }

  .logs-hero,
  .filter-card,
  .logs-dialog {
    border-radius: 24px;
  }

  .logs-hero {
    padding: 16px;
  }

  .logs-hero__title {
    font-size: 2.5rem;
  }

  .logs-hero__stats {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .logs-hero__stats::-webkit-scrollbar {
    display: none;
  }

  .logs-stat-card {
    min-width: 160px;
  }

  .filter-card__header,
  .timeline-content-card__top {
    flex-direction: column;
  }

  .timeline-content-card__bitacora {
    align-self: flex-start;
  }
}
</style>
