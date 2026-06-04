<template>
  <q-page class="q-pa-md operacion-diaria bg-grey-1">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="$router.push('/')" />
      <div class="text-h5 q-ml-sm text-weight-bold" style="color: #00796b;">Operación Diaria</div>
    </div>

    <!-- Selector Hoy / Mañana -->
    <q-btn-toggle
      v-model="dia"
      spread
      no-caps
      unelevated
      class="q-mb-sm dia-toggle"
      toggle-color="teal-7"
      color="white"
      text-color="grey-8"
      :options="[
        { label: 'Hoy', value: 'hoy', icon: 'today' },
        { label: 'Mañana', value: 'manana', icon: 'event' }
      ]"
    />
    <div class="text-caption text-grey-7 q-mb-md text-center">{{ targetDateLabel }}</div>

    <!-- Selector de secciones -->
    <q-card flat bordered class="q-mb-md secciones-card">
      <q-card-section class="q-py-sm">
        <div class="text-caption text-grey-7 q-mb-xs">¿Qué quieres ver?</div>
        <div class="row q-col-gutter-x-md">
          <q-checkbox v-model="secciones.tours" label="Tours del día" color="teal-7" dense />
          <q-checkbox v-model="secciones.checkin" label="Check in" color="teal-7" dense />
          <q-checkbox v-model="secciones.checkout" label="Check out" color="teal-7" dense />
          <q-checkbox v-model="secciones.ocupacion" label="Ocupación" color="teal-7" dense />
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading -->
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="teal-7" />
    </q-inner-loading>

    <!-- Error -->
    <q-banner v-if="errorMsg" class="bg-negative text-white q-mb-md" rounded>
      <template #avatar><q-icon name="error" /></template>
      {{ errorMsg }}
    </q-banner>

    <template v-if="!loading">
      <!-- ==================== TOURS DEL DÍA ==================== -->
      <div v-if="secciones.tours" class="q-mb-lg">
        <div class="seccion-header row items-center q-mb-sm">
          <q-icon name="tour" size="22px" color="teal-7" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold">Tours del día</span>
          <q-badge color="teal-7" class="q-ml-sm" :label="tours.length" />
        </div>

        <div v-if="tours.length === 0" class="text-grey-6 text-caption q-pa-md text-center">
          Sin tours para {{ diaTexto }}.
        </div>

        <q-card
          v-for="(t, i) in tours"
          :key="'tour-' + i"
          flat
          bordered
          class="op-card q-mb-sm"
        >
          <q-card-section class="q-pa-md">
            <div class="campo">
              <div class="campo-label">Proveedor Experiencia</div>
              <div class="campo-valor text-weight-bold text-teal-9">{{ valor(t.tipo_tour) }}</div>
            </div>
            <div class="campo">
              <div class="campo-label">Detalle del tour</div>
              <div class="campo-valor">{{ valor(t.detalle_tour) }}</div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-6 campo">
                <div class="campo-label">Hora de salida</div>
                <div class="campo-valor">{{ valor(t.hora_salida) }}</div>
              </div>
              <div class="col-6 campo">
                <div class="campo-label">Hora de llegada</div>
                <div class="campo-valor">{{ valor(t.hora_llegada) }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ==================== CHECK OUT ==================== -->
      <div v-if="secciones.checkout" class="q-mb-lg">
        <div class="seccion-header row items-center q-mb-sm">
          <q-icon name="logout" size="22px" color="red-6" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold">Check out</span>
          <q-badge color="red-6" class="q-ml-sm" :label="checkouts.length" />
        </div>

        <div v-if="checkouts.length === 0" class="text-grey-6 text-caption q-pa-md text-center">
          Sin check out para {{ diaTexto }}.
        </div>

        <q-card
          v-for="(c, i) in checkouts"
          :key="'out-' + i"
          flat
          bordered
          class="op-card op-card--out q-mb-sm"
        >
          <q-card-section class="q-pa-md row items-center q-col-gutter-md">
            <div class="col-4 campo">
              <div class="campo-label">Casita</div>
              <div class="campo-valor text-weight-bold text-h6">{{ valor(c.casita) }}</div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">Method</div>
              <div class="campo-valor">{{ valor(c.method) }}</div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">ETD</div>
              <div class="campo-valor">{{ valor(c.etd) }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ==================== CHECK IN ==================== -->
      <div v-if="secciones.checkin" class="q-mb-lg">
        <div class="seccion-header row items-center q-mb-sm">
          <q-icon name="login" size="22px" color="green-7" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold">Check in</span>
          <q-badge color="green-7" class="q-ml-sm" :label="checkins.length" />
        </div>

        <div v-if="checkins.length === 0" class="text-grey-6 text-caption q-pa-md text-center">
          Sin check in para {{ diaTexto }}.
        </div>

        <q-card
          v-for="(c, i) in checkins"
          :key="'in-' + i"
          flat
          bordered
          class="op-card op-card--in q-mb-sm"
        >
          <q-card-section class="q-pa-md row items-center q-col-gutter-md">
            <div class="col-4 campo">
              <div class="campo-label">Casita</div>
              <div class="campo-valor text-weight-bold text-h6">{{ valor(c.casita) }}</div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">Method</div>
              <div class="campo-valor">{{ valor(c.method) }}</div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">ETA</div>
              <div class="campo-valor">{{ valor(c.eta) }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ==================== OCUPACIÓN DEL DÍA ==================== -->
      <div v-if="secciones.ocupacion" class="q-mb-lg">
        <div class="seccion-header row items-center q-mb-sm">
          <q-icon name="hotel" size="22px" color="indigo-6" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold">Ocupación del día</span>
          <q-badge color="indigo-6" class="q-ml-sm" :label="ocupacionNumeros.length" />
        </div>

        <q-card
          v-for="zona in ocupacionZonas"
          :key="zona.nombre"
          flat
          bordered
          class="op-card q-mb-sm"
        >
          <q-card-section class="q-pa-md">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-weight-bold text-indigo-8">{{ zona.nombre }}</div>
              <q-badge v-if="zona.numeros.length" color="indigo-6" :label="zona.numeros.length" />
            </div>
            <div v-if="zona.numeros.length" class="row q-gutter-xs">
              <q-chip
                v-for="n in zona.numeros"
                :key="zona.nombre + '-' + n"
                color="indigo-1"
                text-color="indigo-9"
                class="text-weight-bold"
                dense
              >
                {{ n }}
              </q-chip>
            </div>
            <div v-else class="text-grey-6 text-caption text-italic">
              Esta zona está vacía
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Ninguna sección seleccionada -->
      <div
        v-if="!secciones.tours && !secciones.checkin && !secciones.checkout && !secciones.ocupacion"
        class="text-grey-6 text-center q-pa-xl"
      >
        <q-icon name="check_box_outline_blank" size="48px" color="grey-4" />
        <div class="q-mt-sm">Selecciona al menos una sección para mostrar.</div>
      </div>
    </template>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { supabase } from '../supabase'

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
}

const ZONAS = [
  { nombre: 'Zona A', min: 1, max: 6 },
  { nombre: 'Zona B', min: 7, max: 14 },
  { nombre: 'Zona C', min: 15, max: 22 },
  { nombre: 'Zona D', min: 23, max: 31 },
  { nombre: 'Zona E', min: 32, max: 40 },
  { nombre: 'Zona F', min: 41, max: 50 }
]

const SECCIONES_KEY = 'operacion_diaria_secciones'

// Normaliza texto: minúsculas, sin apóstrofes (', ´, `, '), espacios colapsados.
function norm (v) {
  return String(v == null ? '' : v)
    .toLowerCase()
    .replace(/[''´`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extrae { month, day } de un texto como "Thursday, June 04th".
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

// Prioridad de ordenamiento para tipo_tour.
function tourPrioridad (tipoTour) {
  const t = norm(tipoTour)
  if (t.includes('confirmed')) return 0
  if (t.includes('sapoa')) return 1
  if (t.includes('atv') || t.includes('zipline')) return 2
  return 99
}

export default defineComponent({
  name: 'OperacionDiariaPage',
  setup () {
    const rows = ref([])
    const loading = ref(true)
    const errorMsg = ref('')
    const dia = ref('hoy')

    const secciones = reactive({
      tours: true,
      checkin: true,
      checkout: true,
      ocupacion: true
    })

    // Cargar selección guardada
    try {
      const saved = JSON.parse(localStorage.getItem(SECCIONES_KEY))
      if (saved && typeof saved === 'object') {
        for (const k of ['tours', 'checkin', 'checkout', 'ocupacion']) {
          if (typeof saved[k] === 'boolean') secciones[k] = saved[k]
        }
      }
    } catch (e) { /* ignore */ }

    // Persistir selección
    watch(secciones, (val) => {
      localStorage.setItem(SECCIONES_KEY, JSON.stringify(val))
    }, { deep: true })

    // Fecha objetivo según toggle (hora local del dispositivo)
    const targetDate = computed(() => {
      const d = new Date()
      d.setDate(d.getDate() + (dia.value === 'manana' ? 1 : 0))
      return d
    })
    const targetParts = computed(() => ({
      month: targetDate.value.getMonth() + 1,
      day: targetDate.value.getDate()
    }))
    const targetDateLabel = computed(() => {
      const d = targetDate.value
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      return `${dd}/${mm}/${d.getFullYear()}`
    })
    const diaTexto = computed(() => (dia.value === 'manana' ? 'mañana' : 'hoy'))

    // Registros del día seleccionado
    const rowsDelDia = computed(() => {
      const t = targetParts.value
      return rows.value.filter((r) => {
        const p = parseFecha(r.fecha)
        return p.month === t.month && p.day === t.day
      })
    })

    const tours = computed(() =>
      rowsDelDia.value
        .filter((r) => norm(r.tipo) === 'tour')
        .slice()
        .sort((a, b) => tourPrioridad(a.tipo_tour) - tourPrioridad(b.tipo_tour))
    )

    const checkouts = computed(() =>
      rowsDelDia.value.filter((r) => norm(r.tipo).includes('departure'))
    )

    const checkins = computed(() =>
      rowsDelDia.value.filter((r) => norm(r.tipo).includes('arrival'))
    )

    const ocupacionNumeros = computed(() => {
      const nums = rowsDelDia.value
        .filter((r) => norm(r.tipo).includes('in house'))
        .map((r) => {
          const m = String(r.casita == null ? '' : r.casita).match(/\d+/)
          return m ? parseInt(m[0], 10) : NaN
        })
        .filter((n) => !isNaN(n))
      return [...new Set(nums)].sort((a, b) => a - b)
    })

    const ocupacionZonas = computed(() =>
      ZONAS.map((z) => ({
        nombre: z.nombre,
        numeros: ocupacionNumeros.value.filter((n) => n >= z.min && n <= z.max)
      }))
    )

    function valor (v) {
      const s = v == null ? '' : String(v).trim()
      return s === '' ? '—' : s
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

    onMounted(cargar)

    return {
      loading,
      errorMsg,
      dia,
      secciones,
      targetDateLabel,
      diaTexto,
      tours,
      checkouts,
      checkins,
      ocupacionNumeros,
      ocupacionZonas,
      valor
    }
  }
})
</script>

<style scoped>
.dia-toggle {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.secciones-card {
  border-radius: 14px;
}

.seccion-header {
  border-left: 4px solid currentColor;
}

.op-card {
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.op-card--out {
  border-left: 4px solid #ef5350;
}

.op-card--in {
  border-left: 4px solid #43a047;
}

.campo {
  margin-bottom: 6px;
}

.campo-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #9e9e9e;
}

.campo-valor {
  font-size: 14px;
  color: #1a1a1a;
  word-break: break-word;
}
</style>
