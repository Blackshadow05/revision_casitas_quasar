<template>
  <q-page class="puesto01-page">
    <!-- ===================== HERO ===================== -->
    <div class="p01-hero" :style="{ background: filtroActual.grad }">
      <div class="p01-hero__overlay"></div>
      <div class="p01-hero__content">
        <q-btn flat round dense icon="arrow_back" class="text-white" @click="$router.push('/')" />
        <div class="p01-hero__titles">
          <div class="p01-hero__title">
            <q-icon name="local_police" size="26px" class="q-mr-sm" />
            Puesto 01
          </div>
          <div class="p01-hero__subtitle">Reporte de hoy · {{ fechaLabel }}</div>
        </div>
        <q-space />
        <q-btn
          round
          flat
          dense
          icon="refresh"
          class="text-white"
          :loading="loading"
          @click="cargar"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="p01-body">
      <!-- ===================== TABS PENDIENTES / COMPLETADOS ===================== -->
      <q-card flat bordered class="p01-tabs-card">
        <q-tabs
          v-model="estadoTab"
          no-caps
          dense
          class="p01-tabs"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="pendientes" icon="pending_actions" label="Pendientes" />
          <q-tab name="completados" icon="task_alt" label="Completados" />
        </q-tabs>
      </q-card>

      <q-tab-panels v-model="estadoTab" animated class="p01-panels">
        <!-- ============================================================ -->
        <!-- PENDIENTES (datos de operaciones_memo)                       -->
        <!-- ============================================================ -->
        <q-tab-panel name="pendientes" class="q-pa-none q-pt-md">
          <!-- Filtros segmentados -->
          <div class="p01-filtros">
            <button
              v-for="f in filtros"
              :key="f.value"
              type="button"
              class="p01-chip"
              :class="{ 'p01-chip--active': filtro === f.value }"
              :style="filtro === f.value ? { background: f.grad } : {}"
              @click="filtro = f.value"
            >
              <q-icon :name="f.icon" size="18px" class="q-mr-xs" />
              <span>{{ f.label }}</span>
              <span class="p01-chip__count">{{ conteos[f.value] }}</span>
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="p01-state">
            <q-spinner-gears size="48px" :color="filtroActual.color" />
            <div class="q-mt-sm text-grey-7">Cargando reporte…</div>
          </div>

          <!-- Error -->
          <q-banner v-else-if="errorMsg" class="bg-negative text-white q-mt-md" rounded>
            <template #avatar><q-icon name="error" /></template>
            {{ errorMsg }}
          </q-banner>

          <template v-else>
            <!-- ---------- VISTA ESCRITORIO: TABLA EDITABLE ---------- -->
            <q-table
              v-if="$q.screen.gt.sm"
              :rows="filasActivas"
              :columns="columnasActivas"
              row-key="id"
              flat
              bordered
              :pagination="{ rowsPerPage: 0 }"
              hide-pagination
              class="p01-table"
              :class="'p01-table--' + filtro"
            >
              <template #body="props">
                <q-tr :props="props" class="p01-row">
                  <q-td
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="p01-td"
                  >
                    <!-- CASITA: varias casitas agrupadas, cada chip editable -->
                    <template v-if="col.name === 'casita'">
                      <div class="p01-casitas">
                        <q-chip
                          v-for="item in props.row.items"
                          :key="item.id"
                          dense
                          square
                          :color="filtroActual.chipBg"
                          :text-color="filtroActual.chipText"
                          class="text-weight-bold p01-casita-chip"
                        >
                          {{ valor(item.casita) }}
                          <q-popup-edit
                            v-model="item.casita"
                            title="Editar Casita"
                            buttons
                            label-set="Guardar"
                            label-cancel="Cancelar"
                            v-slot="scope"
                            @save="(val) => guardarCampo(item, 'casita', val)"
                          >
                            <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set()" />
                          </q-popup-edit>
                        </q-chip>
                      </div>
                    </template>

                    <!-- HORA -->
                    <template v-else-if="col.isHora">
                      <span class="p01-hora-pill" :style="{ color: filtroActual.hex }">
                        <q-icon name="schedule" size="14px" class="q-mr-xs" />
                        {{ valorFormateado(col, props.row.ref) }}
                      </span>
                      <q-popup-edit
                        v-model="props.row.ref[col.field]"
                        :title="'Editar ' + col.label"
                        buttons
                        label-set="Guardar"
                        label-cancel="Cancelar"
                        v-slot="scope"
                        @save="(val) => guardarCampoGrupo(props.row, col.field, val)"
                      >
                        <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set()" />
                      </q-popup-edit>
                    </template>

                    <!-- RESTO -->
                    <template v-else>
                      <div :class="{ 'p01-preline': col.multiline }">{{ valorFormateado(col, props.row.ref) }}</div>
                      <q-popup-edit
                        v-model="props.row.ref[col.field]"
                        :title="'Editar ' + col.label"
                        buttons
                        label-set="Guardar"
                        label-cancel="Cancelar"
                        v-slot="scope"
                        @save="(val) => guardarCampoGrupo(props.row, col.field, val)"
                      >
                        <q-input
                          v-model="scope.value"
                          dense
                          autofocus
                          :type="col.multiline ? 'textarea' : 'text'"
                          :autogrow="col.multiline"
                          @keyup.enter="!col.multiline && scope.set()"
                        />
                      </q-popup-edit>
                    </template>
                  </q-td>
                </q-tr>
              </template>

              <template #no-data>
                <div class="p01-state full-width">
                  <q-icon :name="filtroActual.icon" size="42px" color="grey-4" />
                  <div class="q-mt-sm text-grey-6">Sin registros de {{ filtroActual.label }} para hoy.</div>
                </div>
              </template>
            </q-table>

            <!-- ---------- VISTA MÓVIL: CARDS ---------- -->
            <div v-else class="p01-cards">
              <div
                v-if="filasActivas.length === 0"
                class="p01-state"
              >
                <q-icon :name="filtroActual.icon" size="42px" color="grey-4" />
                <div class="q-mt-sm text-grey-6">Sin registros de {{ filtroActual.label }} para hoy.</div>
              </div>

              <div
                v-for="grupo in filasActivas"
                :key="grupo.id"
                class="p01-card"
                :style="{ '--accent': filtroActual.hex }"
              >
                <div class="p01-card__bar"></div>
                <div class="p01-card__main">
                  <!-- Encabezado: campo principal (o casitas agrupadas) + hora -->
                  <div class="p01-card__head">
                    <q-icon :name="filtroActual.icon" size="20px" :style="{ color: filtroActual.hex }" />

                    <!-- Casitas agrupadas (check in / check out) -->
                    <template v-if="tieneCasita">
                      <div class="p01-card__casitas">
                        <q-chip
                          v-for="item in grupo.items"
                          :key="item.id"
                          dense
                          square
                          :color="filtroActual.chipBg"
                          :text-color="filtroActual.chipText"
                          class="text-weight-bold p01-casita-chip"
                        >
                          {{ valor(item.casita) }}
                          <q-popup-edit
                            v-model="item.casita"
                            title="Editar Casita"
                            buttons
                            v-slot="scope"
                            @save="(val) => guardarCampo(item, 'casita', val)"
                          >
                            <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set()" />
                          </q-popup-edit>
                        </q-chip>
                      </div>
                    </template>

                    <!-- Campo principal de texto (tour) -->
                    <template v-else>
                      <div class="p01-card__primary">
                        {{ valorFormateado(primaryCol, grupo.ref) }}
                        <q-popup-edit
                          v-model="grupo.ref[primaryCol.field]"
                          :title="'Editar ' + primaryCol.label"
                          buttons
                          v-slot="scope"
                          @save="(val) => guardarCampoGrupo(grupo, primaryCol.field, val)"
                        >
                          <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set()" />
                        </q-popup-edit>
                      </div>
                    </template>

                    <span v-if="horaCol" class="p01-hora-pill p01-hora-pill--solid" :style="{ background: filtroActual.hex }">
                      <q-icon name="schedule" size="14px" class="q-mr-xs" />
                      {{ valorFormateado(horaCol, grupo.ref) }}
                      <q-popup-edit
                        v-model="grupo.ref[horaCol.field]"
                        :title="'Editar ' + horaCol.label"
                        buttons
                        v-slot="scope"
                        @save="(val) => guardarCampoGrupo(grupo, horaCol.field, val)"
                      >
                        <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set()" />
                      </q-popup-edit>
                    </span>
                  </div>

                  <!-- Campos secundarios -->
                  <div
                    v-for="col in secondaryCols"
                    :key="col.name"
                    class="p01-card__field"
                  >
                    <div class="p01-card__label">{{ col.label }}</div>
                    <div class="p01-card__value" :class="{ 'p01-preline': col.multiline }">
                      {{ valorFormateado(col, grupo.ref) }}
                      <q-popup-edit
                        v-model="grupo.ref[col.field]"
                        :title="'Editar ' + col.label"
                        buttons
                        v-slot="scope"
                        @save="(val) => guardarCampoGrupo(grupo, col.field, val)"
                      >
                        <q-input
                          v-model="scope.value"
                          dense
                          autofocus
                          :type="col.multiline ? 'textarea' : 'text'"
                          :autogrow="col.multiline"
                        />
                      </q-popup-edit>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </q-tab-panel>

        <!-- ============================================================ -->
        <!-- COMPLETADOS (Fase 2 — tabla Puesto_01)                       -->
        <!-- ============================================================ -->
        <q-tab-panel name="completados" class="q-pa-none q-pt-md">
          <div class="p01-fase2">
            <q-icon name="construction" size="56px" color="grey-4" />
            <div class="text-h6 text-grey-7 q-mt-md">Próximamente · Fase 2</div>
            <div class="text-body2 text-grey-6 q-mt-xs">
              Aquí se mostrarán los registros completados desde la tabla <b>Puesto_01</b>.
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from '../supabase'

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
}

// Normaliza texto: minúsculas, sin apóstrofes (', ´, `), espacios colapsados.
function norm (v) {
  return String(v == null ? '' : v)
    .toLowerCase()
    .replace(/[''´`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extrae { month, day } de un texto como "Friday, June 05th".
function parseFecha (str) {
  const s = String(str == null ? '' : str).toLowerCase()
  let month = null
  for (const name in MONTHS) {
    if (s.includes(name)) { month = MONTHS[name]; break }
  }
  const m = s.match(/\d+/)
  const day = m ? parseInt(m[0], 10) : null
  return { month, day }
}

// "07:30:00" / "11:30hrs" / "9:00 hrs" -> "07:30". Devuelve "—" si vacío.
function formatHora (v) {
  const s = String(v == null ? '' : v).trim()
  if (s === '') return '—'
  const m = s.match(/(\d{1,2}):(\d{2})/)
  if (!m) return s
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

function valor (v) {
  const s = v == null ? '' : String(v).trim()
  return s === '' ? '—' : s
}

// Definición de columnas por filtro. El orden importa para la vista móvil:
// [0] = campo principal, último = hora, intermedios = secundarios.
const COLUMNAS = {
  tour: [
    { name: 'tipo_tour', label: 'Proveedor', field: 'tipo_tour', align: 'left', format: valor },
    { name: 'detalle_tour', label: 'Detalle Tour', field: 'detalle_tour', align: 'left', format: valor, multiline: true },
    { name: 'hora_salida', label: 'Hora Salida', field: 'hora_salida', align: 'left', format: formatHora, isHora: true }
  ],
  checkin: [
    { name: 'casita', label: 'Casita', field: 'casita', align: 'left', format: valor },
    { name: 'method', label: 'Método', field: 'method', align: 'left', format: valor, multiline: true },
    { name: 'hora_llegada_real', label: 'Hora llegada', field: 'hora_llegada_real', align: 'left', format: formatHora, isHora: true }
  ],
  checkout: [
    { name: 'casita', label: 'Casita', field: 'casita', align: 'left', format: valor },
    { name: 'method', label: 'Método', field: 'method', align: 'left', format: valor, multiline: true },
    { name: 'hora_salida_real', label: 'Hora Salida', field: 'hora_salida_real', align: 'left', format: formatHora, isHora: true }
  ]
}

const FILTROS = [
  { value: 'tour', label: 'Tour', icon: 'tour', color: 'teal-7', hex: '#0f9b8e', chipBg: 'teal-1', chipText: 'teal-9', grad: 'linear-gradient(135deg, #0f9b8e 0%, #16c2a3 100%)' },
  { value: 'checkin', label: 'Check in', icon: 'login', color: 'green-7', hex: '#2e9e4f', chipBg: 'green-1', chipText: 'green-9', grad: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)' },
  { value: 'checkout', label: 'Check out', icon: 'logout', color: 'red-6', hex: '#e53935', chipBg: 'red-1', chipText: 'red-9', grad: 'linear-gradient(135deg, #e53935 0%, #ef5350 100%)' }
]

// Predicado de pertenencia al filtro según el campo `tipo`.
function matchFiltro (tipo, filtro) {
  const t = norm(tipo)
  if (filtro === 'tour') return t.includes('tour')
  if (filtro === 'checkin') return t.includes('arrival')   // Today's Arrivals
  if (filtro === 'checkout') return t.includes('departure') // Today´s Departure
  return false
}

export default defineComponent({
  name: 'Puesto01Page',
  setup () {
    const $q = useQuasar()
    const rows = ref([])
    const loading = ref(true)
    const errorMsg = ref('')
    const estadoTab = ref('pendientes')
    const filtro = ref('tour')

    const filtros = FILTROS
    const filtroActual = computed(() => FILTROS.find((f) => f.value === filtro.value) || FILTROS[0])

    // Fecha de hoy (dispositivo)
    const hoy = new Date()
    const fechaLabel = computed(() => {
      const dd = String(hoy.getDate()).padStart(2, '0')
      const mm = String(hoy.getMonth() + 1).padStart(2, '0')
      return `${dd}/${mm}/${hoy.getFullYear()}`
    })
    const targetParts = { month: hoy.getMonth() + 1, day: hoy.getDate() }

    // Solo registros de hoy (la tabla contiene varios días).
    const rowsHoy = computed(() =>
      rows.value.filter((r) => {
        const p = parseFecha(r.fecha)
        return p.month === targetParts.month && p.day === targetParts.day
      })
    )

    const conteos = computed(() => ({
      tour: rowsHoy.value.filter((r) => matchFiltro(r.tipo, 'tour')).length,
      checkin: rowsHoy.value.filter((r) => matchFiltro(r.tipo, 'checkin')).length,
      checkout: rowsHoy.value.filter((r) => matchFiltro(r.tipo, 'checkout')).length
    }))

    const columnasActivas = computed(() => COLUMNAS[filtro.value])
    const primaryCol = computed(() => columnasActivas.value[0])
    const horaCol = computed(() => columnasActivas.value.find((c) => c.isHora) || null)
    const secondaryCols = computed(() =>
      columnasActivas.value.filter((c) => c !== primaryCol.value && !c.isHora)
    )
    // Los filtros con columna "casita" (check in / check out) se agrupan.
    const tieneCasita = computed(() => columnasActivas.value.some((c) => c.name === 'casita'))

    // Filas a mostrar, normalizadas a { id, ref, items }:
    //  - ref: registro representativo (para campos compartidos: method, hora…).
    //  - items: registros de Supabase incluidos (1 para tour; N agrupados en check in/out).
    // En check in / check out se agrupan en una sola card/fila las casitas que comparten
    // el MISMO method y la MISMA hora (llegada o salida). Tour no se agrupa.
    const filasActivas = computed(() => {
      const base = rowsHoy.value.filter((r) => matchFiltro(r.tipo, filtro.value))
      if (!tieneCasita.value) {
        return base.map((r) => ({ id: r.id, ref: r, items: [r] }))
      }
      const hf = horaCol.value ? horaCol.value.field : null
      const map = new Map()
      for (const r of base) {
        const key = norm(r.method) + '|' + (hf ? norm(r[hf]) : '')
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(r)
      }
      return [...map.values()].map((items) => ({
        id: items.map((i) => i.id).join('_'),
        ref: items[0],
        items
      }))
    })

    function valorFormateado (col, row) {
      if (!col) return '—'
      const raw = row[col.field]
      return col.format ? col.format(raw) : valor(raw)
    }

    async function cargar () {
      loading.value = true
      errorMsg.value = ''
      try {
        const { data, error } = await supabase.from('operaciones_memo').select('*')
        if (error) throw error
        rows.value = data || []
      } catch (e) {
        errorMsg.value = e.message || 'Error al cargar los datos'
      } finally {
        loading.value = false
      }
    }

    // Persiste un campo editado en Supabase.
    // Nota: el Google Apps Script refresca operaciones_memo con DELETE+INSERT,
    // por lo que estas ediciones directas pueden ser sobreescritas en el próximo
    // refresh. La edición se deja cableada para uso futuro (según requerimiento).
    async function guardarCampo (row, field, val) {
      const valorLimpio = val === '' ? null : val
      try {
        const { error } = await supabase
          .from('operaciones_memo')
          .update({ [field]: valorLimpio })
          .eq('id', row.id)
        if (error) throw error
        row[field] = valorLimpio
        $q.notify({ type: 'positive', message: 'Cambio guardado', position: 'top', timeout: 1500 })
      } catch (e) {
        $q.notify({ type: 'negative', message: 'No se pudo guardar: ' + (e.message || e), position: 'top' })
        cargar()
      }
    }

    // Guarda un campo compartido (method, hora…) en TODOS los registros del grupo.
    async function guardarCampoGrupo (grupo, field, val) {
      const valorLimpio = val === '' ? null : val
      const ids = grupo.items.map((i) => i.id)
      try {
        const { error } = await supabase
          .from('operaciones_memo')
          .update({ [field]: valorLimpio })
          .in('id', ids)
        if (error) throw error
        grupo.items.forEach((i) => { i[field] = valorLimpio })
        $q.notify({ type: 'positive', message: 'Cambio guardado', position: 'top', timeout: 1500 })
      } catch (e) {
        $q.notify({ type: 'negative', message: 'No se pudo guardar: ' + (e.message || e), position: 'top' })
        cargar()
      }
    }

    onMounted(cargar)

    return {
      loading,
      errorMsg,
      estadoTab,
      filtro,
      filtros,
      filtroActual,
      fechaLabel,
      conteos,
      filasActivas,
      columnasActivas,
      primaryCol,
      horaCol,
      secondaryCols,
      tieneCasita,
      valor,
      valorFormateado,
      cargar,
      guardarCampo,
      guardarCampoGrupo
    }
  }
})
</script>

<style scoped>
.puesto01-page {
  background: #f4f6f8;
  min-height: 100vh;
}

/* ===================== HERO ===================== */
.p01-hero {
  position: relative;
  padding: 14px 16px 22px;
  border-bottom-left-radius: 22px;
  border-bottom-right-radius: 22px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transition: background 0.4s ease;
  overflow: hidden;
}

.p01-hero__overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 85% -20%, rgba(255, 255, 255, 0.25), transparent 45%),
    radial-gradient(circle at 0% 120%, rgba(0, 0, 0, 0.12), transparent 40%);
  pointer-events: none;
}

.p01-hero__content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
}

.p01-hero__titles {
  line-height: 1.15;
}

.p01-hero__title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.p01-hero__subtitle {
  font-size: 13px;
  opacity: 0.92;
  margin-top: 2px;
  padding-left: 2px;
}

/* ===================== BODY ===================== */
.p01-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

.p01-tabs-card {
  border-radius: 14px;
  overflow: hidden;
}

.p01-tabs {
  font-weight: 600;
}

.p01-panels {
  background: transparent;
}

/* ===================== FILTROS ===================== */
.p01-filtros {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.p01-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1 1 auto;
  justify-content: center;
}

.p01-chip:hover {
  border-color: #bdbdbd;
  transform: translateY(-1px);
}

.p01-chip--active {
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.p01-chip__count {
  margin-left: 8px;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  padding: 0 6px;
}

.p01-chip--active .p01-chip__count {
  background: rgba(255, 255, 255, 0.28);
}

/* ===================== TABLA (ESCRITORIO) ===================== */
.p01-table {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.p01-table :deep(thead th) {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.p01-table--tour :deep(thead th) { background: #0f9b8e; }
.p01-table--checkin :deep(thead th) { background: #2e9e4f; }
.p01-table--checkout :deep(thead th) { background: #e53935; }

.p01-table :deep(tbody tr:nth-child(even)) {
  background: #fafafa;
}

.p01-row :deep(.q-td) {
  cursor: pointer;
}

.p01-td {
  font-size: 14px;
  color: #1a1a1a;
  vertical-align: top;
  padding-top: 12px;
  padding-bottom: 12px;
}

.p01-preline {
  white-space: pre-line;
  line-height: 1.4;
}

.p01-casitas {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.p01-casita-chip {
  cursor: pointer;
}

.p01-hora-pill {
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  font-size: 14px;
}

.p01-hora-pill--solid {
  color: #fff !important;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
}

/* ===================== CARDS (MÓVIL) ===================== */
.p01-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.p01-card {
  display: flex;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.07);
}

.p01-card__bar {
  width: 6px;
  background: var(--accent);
  flex: 0 0 auto;
}

.p01-card__main {
  padding: 14px 16px;
  flex: 1 1 auto;
  min-width: 0;
}

.p01-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.p01-card__primary {
  font-size: 17px;
  font-weight: 800;
  color: #1a1a1a;
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-word;
  cursor: pointer;
}

.p01-card__casitas {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1 1 auto;
  min-width: 0;
}

.p01-card__field {
  margin-top: 8px;
}

.p01-card__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #9e9e9e;
}

.p01-card__value {
  font-size: 14px;
  color: #2a2a2a;
  word-break: break-word;
  cursor: pointer;
}

/* ===================== ESTADOS ===================== */
.p01-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
}

.p01-fase2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
}
</style>
