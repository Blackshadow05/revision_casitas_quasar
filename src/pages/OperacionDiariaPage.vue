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
          <q-badge color="red-6" class="q-ml-sm" :label="checkoutsRaw.length" />
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
              <div class="campo-valor text-weight-bold text-h6">
                <q-chip v-for="cas in c.casitas" :key="cas" dense color="red-1" text-color="red-9" class="text-weight-bold">
                  {{ cas }}
                </q-chip>
              </div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">Method</div>
              <div class="campo-valor">{{ c.method }}</div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">ETD</div>
              <div class="campo-valor">{{ c.etd }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ==================== CHECK IN ==================== -->
      <div v-if="secciones.checkin" class="q-mb-lg">
        <div class="seccion-header row items-center q-mb-sm">
          <q-icon name="login" size="22px" color="green-7" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold">Check in</span>
          <q-badge color="green-7" class="q-ml-sm" :label="checkinsRaw.length" />
          <q-space />
          <q-toggle
            v-model="filtroPendienteMontaje"
            label="Pendiente montaje"
            color="orange-7"
            dense
            class="q-mr-sm text-caption"
          />
        </div>

        <!-- Botón Confirmar Montaje -->
        <q-btn
          no-caps
          unelevated
          color="orange-7"
          icon="build"
          label="Confirmar Montaje"
          class="q-mb-sm full-width montaje-btn"
          @click="abrirMontajeDialog"
        />

        <div v-if="checkinsFiltrados.length === 0" class="text-grey-6 text-caption q-pa-md text-center">
          {{ filtroPendienteMontaje ? 'Todos los montajes están confirmados.' : 'Sin check in para ' + diaTexto + '.' }}
        </div>

        <q-card
          v-for="(c, i) in checkinsFiltrados"
          :key="'in-' + i"
          flat
          bordered
          class="op-card op-card--in q-mb-sm"
        >
          <q-card-section class="q-pa-md row items-center q-col-gutter-md">
            <div class="col-4 campo">
              <div class="campo-label">Casita</div>
              <div class="campo-valor text-weight-bold text-h6">
                <template v-for="item in c.items" :key="item.id">
                  <div class="casita-montaje-row">
                    <q-chip 
                      dense 
                      color="green-1" 
                      text-color="green-9" 
                      class="text-weight-bold"
                      :class="{'btb-shadow': valor(item.casita).toUpperCase().includes('BTB')}"
                    >
                      {{ valor(item.casita) }}
                      <q-icon
                        v-if="esMontajeHecho(item)"
                        name="check_circle"
                        size="16px"
                        color="green-9"
                        class="q-ml-xs"
                      />
                    </q-chip>
                  </div>
                  <div
                    v-if="dia === 'manana' && casitasOcupadasEnArrivals.has(valor(item.casita))"
                    class="advertencia-ocupada"
                  >
                    <q-icon name="warning" size="14px" class="q-mr-xs" />
                    Esta casa ya se encuentra ocupada
                  </div>
                </template>
              </div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">Method</div>
              <div class="campo-valor">{{ c.method }}</div>
            </div>
            <div class="col-4 campo">
              <div class="campo-label">ETA</div>
              <div class="campo-valor">{{ c.eta }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ==================== DIALOG MONTAJE ==================== -->
      <q-dialog v-model="montajeDialogOpen" persistent>
        <q-card style="min-width: 320px; border-radius: 16px;">
          <q-card-section class="bg-orange-7 text-white">
            <div class="text-h6 row items-center">
              <q-icon name="build" class="q-mr-sm" />
              Confirmar Montaje
            </div>
            <div class="text-caption">Marca las casitas cuyo montaje está listo</div>
          </q-card-section>

          <q-card-section class="q-pt-md">
            <q-list separator>
              <q-item v-for="item in montajeItems" :key="item.id" tag="label">
                <q-item-section side>
                  <q-checkbox
                    v-model="item.checked"
                    color="green-7"
                    @update:model-value="toggleMontaje(item)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">Casita {{ valor(item.casita) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-spinner-dots v-if="item.saving" size="20px" color="orange-7" />
                  <q-icon v-else-if="item.checked" name="check_circle" color="green-7" size="20px" />
                  <q-icon v-else name="radio_button_unchecked" color="grey-5" size="20px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cerrar" color="grey-7" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

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

// Extrae { day, month, year } de formato "DD-MM-YYYY" (ej: "05-06-2026").
function parseFechaIngreso (str) {
  const parts = String(str == null ? '' : str).split('-')
  if (parts.length !== 3) return { day: null, month: null, year: null }
  return {
    day: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    year: parseInt(parts[2], 10)
  }
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

    // Registros del día anterior al seleccionado (para comparar in-house guests)
    const prevDayParts = computed(() => {
      const d = new Date(targetDate.value)
      d.setDate(d.getDate() - 1)
      return { month: d.getMonth() + 1, day: d.getDate() }
    })
    const rowsDelDiaAnterior = computed(() => {
      const t = prevDayParts.value
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

    const checkoutsRaw = computed(() =>
      rowsDelDia.value.filter((r) => norm(r.tipo).includes('departure'))
    )

    const checkinsRaw = computed(() =>
      rowsDelDia.value.filter((r) => norm(r.tipo).includes('arrival'))
    )

    function groupBy (rows, keyFn) {
      const map = new Map()
      for (const r of rows) {
        const key = keyFn(r)
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(r)
      }
      return [...map.entries()].map(([key, items]) => ({ key, items }))
    }

    const checkins = computed(() =>
      groupBy(checkinsRaw.value, (r) => `${norm(r.method)}|${norm(r.eta)}`).map((g) => ({
        items: g.items,
        casitas: g.items.map((r) => valor(r.casita)),
        method: valor(g.items[0].method),
        eta: valor(g.items[0].eta)
      }))
    )

    // Filtro pendiente montaje
    const filtroPendienteMontaje = ref(false)

    const checkinsFiltrados = computed(() => {
      if (!filtroPendienteMontaje.value) return checkins.value
      return checkins.value
        .map((g) => ({
          ...g,
          items: g.items.filter((r) => !esMontajeHecho(r))
        }))
        .filter((g) => g.items.length > 0)
    })

    function esMontajeHecho (row) {
      return norm(row.montaje_hecho).includes('hecho')
    }

    // Dialog montaje
    const montajeDialogOpen = ref(false)
    const montajeItems = ref([])

    function abrirMontajeDialog () {
      montajeItems.value = checkinsRaw.value.map((r) => ({
        id: r.id,
        casita: r.casita,
        checked: esMontajeHecho(r),
        saving: false
      }))
      montajeDialogOpen.value = true
    }

    async function toggleMontaje (item) {
      item.saving = true
      const nuevoValor = item.checked ? 'hecho' : null
      try {
        const { error } = await supabase
          .from('operaciones_memo')
          .update({ montaje_hecho: nuevoValor })
          .eq('id', item.id)
        if (error) throw error
        // Actualizar el row local
        const row = rows.value.find((r) => r.id === item.id)
        if (row) row.montaje_hecho = nuevoValor
      } catch (e) {
        // Revertir en caso de error
        item.checked = !item.checked
        errorMsg.value = 'Error al actualizar montaje: ' + (e.message || e)
      } finally {
        item.saving = false
      }
    }

    const checkouts = computed(() =>
      groupBy(checkoutsRaw.value, (r) => `${norm(r.method)}|${norm(r.etd)}`).map((g) => ({
        casitas: g.items.map((r) => valor(r.casita)),
        method: valor(g.items[0].method),
        etd: valor(g.items[0].etd)
      }))
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

    // Set de casitas que están en arrivals Y también en in-house guests del día ANTERIOR (para advertencia)
    const casitasOcupadasEnArrivals = computed(() => {
      // Extraer casitas de in-house guests del día anterior como strings normalizados
      const inHouseSet = new Set(
        rowsDelDiaAnterior.value
          .filter((r) => norm(r.tipo).includes('in house'))
          .map((r) => valor(r.casita))
          .filter((v) => v !== '—')
      )
      // Extraer casitas de arrivals y ver cuáles coinciden con in-house del día anterior
      const ocupadas = new Set()
      for (const r of checkinsRaw.value) {
        const cas = valor(r.casita)
        if (cas !== '—' && inHouseSet.has(cas)) {
          ocupadas.add(cas)
        }
      }
      return ocupadas
    })

    function valor (v) {
      const s = v == null ? '' : String(v).trim()
      return s === '' ? '—' : s
    }

    // Normaliza el valor de casita para comparación (extrae solo el número)
    function normCasita (v) {
      const s = String(v == null ? '' : v).trim()
      const m = s.match(/\d+/)
      return m ? m[0] : s.toLowerCase()
    }

    // Sincroniza montaje automáticamente comparando revisiones_casitas con operaciones_memo
    async function sincronizarMontaje (revisionesData) {
      console.log('=== SINCRONIZAR MONTAJE ===')
      console.log('Total revisiones recibidas:', revisionesData.length)
      console.log('Primeras 3 revisiones (raw):', revisionesData.slice(0, 3))

      const currentYear = new Date().getFullYear()

      // Filtrar revisiones donde caja_fuerte sea "Check in"
      const revCheckin = revisionesData.filter((r) =>
        norm(r.caja_fuerte).includes('check in')
      )
      console.log('Revisiones con caja_fuerte "Check in":', revCheckin.length)
      if (revCheckin.length === 0) {
        console.log('Valores únicos de caja_fuerte:', [...new Set(revisionesData.map(r => r.caja_fuerte))])
      }

      // Crear un Set de claves "casitaNorm|month|day" desde revisiones_casitas
      const revKeys = new Set()
      for (const rev of revCheckin) {
        const f = parseFechaIngreso(rev.fecha_ingreso_casita)
        console.log(`  Revisión casita="${rev.casita}" fecha="${rev.fecha_ingreso_casita}" → parsed:`, f, '→ normCasita:', normCasita(rev.casita))
        if (f.day && f.month) {
          const key = `${normCasita(rev.casita)}|${f.month}|${f.day}`
          revKeys.add(key)
        }
      }
      console.log('Claves de revisiones (revKeys):', [...revKeys])

      // Buscar arrivals en operaciones_memo que coincidan y no estén ya marcados
      const porActualizar = []
      const arrivals = rows.value.filter(r => norm(r.tipo).includes('arrival'))
      console.log('Total arrivals en operaciones_memo:', arrivals.length)

      for (const row of arrivals) {
        if (norm(row.montaje_hecho).includes('hecho')) {
          console.log(`  Arrival casita="${row.casita}" YA marcado como hecho, skip`)
          continue
        }

        const fecha = parseFecha(row.fecha)
        if (!fecha.month || !fecha.day) {
          console.log(`  Arrival casita="${row.casita}" fecha="${row.fecha}" → NO se pudo parsear, skip`)
          continue
        }

        const key = `${normCasita(row.casita)}|${fecha.month}|${fecha.day}`
        const match = revKeys.has(key)
        console.log(`  Arrival casita="${row.casita}" fecha="${row.fecha}" → key="${key}" → match: ${match}`)
        if (match) {
          porActualizar.push(row)
        }
      }

      console.log('Total por actualizar:', porActualizar.length)

      // Actualizar en lote los que coincidieron
      for (const row of porActualizar) {
        try {
          const { error, data } = await supabase
            .from('operaciones_memo')
            .update({ montaje_hecho: 'hecho' })
            .eq('id', row.id)
            .select()
          if (error) {
            console.error(`  Error actualizando id=${row.id}:`, error)
          } else {
            console.log(`  ✓ Actualizado id=${row.id} casita="${row.casita}"`, data)
            row.montaje_hecho = 'hecho'
          }
        } catch (e) {
          console.error(`  Excepción actualizando id=${row.id}:`, e)
        }
      }
      console.log('=== FIN SINCRONIZAR MONTAJE ===')
    }

    async function cargar () {
      loading.value = true
      errorMsg.value = ''
      try {
        // Cargar ambas tablas en paralelo
        const [opRes, revRes] = await Promise.all([
          supabase.from('operaciones_memo').select('*'),
          supabase.from('revisiones_casitas').select('casita, caja_fuerte, fecha_ingreso_casita')
        ])
        if (opRes.error) throw opRes.error
        rows.value = opRes.data || []
        console.log('operaciones_memo cargadas:', rows.value.length)
        console.log('revisiones_casitas cargadas:', revRes.data ? revRes.data.length : 'ERROR', revRes.error || '')

        // Sincronizar montaje automáticamente si hay datos de revisiones
        if (!revRes.error && revRes.data && revRes.data.length > 0) {
          await sincronizarMontaje(revRes.data)
        }
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
      checkoutsRaw,
      checkins,
      checkinsFiltrados,
      checkinsRaw,
      ocupacionNumeros,
      ocupacionZonas,
      casitasOcupadasEnArrivals,
      filtroPendienteMontaje,
      montajeDialogOpen,
      montajeItems,
      abrirMontajeDialog,
      toggleMontaje,
      esMontajeHecho,
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

.advertencia-ocupada {
  display: flex;
  align-items: center;
  color: #d32f2f;
  font-size: 12px;
  font-weight: 700;
  background: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 8px;
  padding: 4px 8px;
  margin-top: 4px;
  margin-bottom: 2px;
  animation: pulseWarning 1.5s ease-in-out infinite;
}

@keyframes pulseWarning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.btb-shadow {
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.8) !important;
  border: 1px solid #ef5350;
}

.montaje-btn {
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.casita-montaje-row {
  display: inline-flex;
  align-items: center;
}
</style>
