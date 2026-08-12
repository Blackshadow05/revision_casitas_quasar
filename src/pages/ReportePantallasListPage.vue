<template>
  <q-page class="reporte-list-page q-pa-md">
    <div class="page-header q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Revisión de pantallas</div>
        <div class="text-caption text-grey-6">Reportes, movimientos e inventario por casita</div>
      </div>
      <q-btn
        unelevated
        rounded
        color="primary"
        icon="add"
        label="Nuevo"
        no-caps
        class="nuevo-btn"
        :disable="!authStore.canAdd"
        @click="goToNuevo"
      />
    </div>

    <q-input
      v-model="searchTerm"
      rounded
      outlined
      dense
      clearable
      placeholder="Buscar por casita, movimiento o usuario..."
      class="q-mb-sm"
      bg-color="white"
    >
      <template #prepend>
        <q-icon name="search" color="grey-5" />
      </template>
    </q-input>

    <div class="filters-toolbar q-mb-md">
      <q-btn
        outline
        rounded
        no-caps
        color="primary"
        icon="tune"
        :label="filtrosActivosCount > 0 ? `Filtros (${filtrosActivosCount})` : 'Filtros'"
        @click="filtersOpen = true"
      />
      <div v-if="filtrosResumen.length" class="filters-chips">
        <q-chip
          v-for="chip in filtrosResumen"
          :key="chip"
          dense
          outline
          color="primary"
          size="sm"
        >
          {{ chip }}
        </q-chip>
      </div>
    </div>

    <q-dialog v-model="filtersOpen" position="bottom">
      <q-card class="filters-modal">
        <q-toolbar>
          <q-toolbar-title class="text-weight-bold text-body1">Filtros</q-toolbar-title>
          <q-btn flat dense no-caps color="grey-7" label="Restablecer" @click="resetFilters" />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-toolbar>
        <q-separator />
        <q-card-section>
          <label class="field-label">Orden por fecha</label>
          <q-option-group
            v-model="ordenFecha"
            :options="ordenFechaOptions"
            color="primary"
            dense
            class="q-mb-md"
          />

          <q-toggle
            v-model="ordenarPorCasita"
            dense
            color="primary"
            label="Ordenar por casita (menor → mayor)"
            class="q-mb-md"
          />

          <q-toggle
            v-model="soloDefectuosas"
            dense
            color="negative"
            label="Solo pantallas defectuosas"
            class="q-mb-md"
          />

          <label class="field-label">Tipo de registro</label>
          <q-option-group
            v-model="tipoFiltro"
            :options="tipoFiltroOptions"
            color="primary"
            dense
          />
        </q-card-section>
        <q-card-actions class="q-pa-md">
          <q-btn
            unelevated
            rounded
            color="primary"
            class="full-width"
            label="Aplicar"
            no-caps
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div v-if="!loading && filteredReports.length > 0" class="selection-bar q-mb-md">
      <div class="selection-bar__info">
        <q-checkbox
          :model-value="allFilteredSelected"
          :indeterminate="someFilteredSelected && !allFilteredSelected"
          dense
          label="Seleccionar visibles"
          @update:model-value="toggleSelectAllFiltered"
        />
        <span class="selection-count">{{ selectedIds.length }} seleccionados</span>
      </div>
      <div class="selection-bar__actions">
        <q-btn
          flat
          dense
          no-caps
          color="grey-7"
          label="Limpiar"
          :disable="selectedIds.length === 0"
          @click="clearSelection"
        />
        <q-btn
          unelevated
          rounded
          no-caps
          color="negative"
          icon="picture_as_pdf"
          :label="selectedIds.length > 0 ? `Crear PDF (${selectedIds.length})` : 'Crear PDF'"
          :loading="pdfBulkLoading"
          :disable="selectedIds.length === 0"
          @click="downloadSelectedPdf"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-sm text-grey-6 text-body2">Cargando reportes…</div>
    </div>

    <div v-else-if="errorMsg" class="empty-state q-pa-xl">
      <q-icon name="error_outline" size="48px" color="red-4" />
      <div class="q-mt-sm text-body2 text-grey-7">{{ errorMsg }}</div>
      <q-btn flat dense color="primary" label="Reintentar" class="q-mt-sm" @click="fetchReports" />
    </div>

    <div v-else-if="filteredReports.length === 0" class="empty-state q-pa-xl">
      <q-icon name="tv_off" size="56px" color="grey-4" />
      <div class="q-mt-sm text-body1 text-weight-medium text-grey-7">
        {{ emptyTitle }}
      </div>
      <div class="text-caption text-grey-5">
        {{ emptyCaption }}
      </div>
    </div>

    <div v-else class="reports-list">
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="report-card"
        :class="{ 'report-card--selected': isSelected(report.id) }"
      >
        <div class="report-card-header">
          <q-checkbox
            :model-value="isSelected(report.id)"
            dense
            class="report-checkbox"
            @update:model-value="val => toggleSelection(report.id, val)"
            @click.stop
          />

          <div class="report-main" @click="toggleExpand(report.id)">
            <div class="report-title-row">
              <div
                class="casita-badge"
                :class="isMovimiento(report) ? 'casita-badge--move' : ''"
              >
                {{ cardTitle(report) }}
              </div>
              <div class="report-type-chip" :class="isMovimiento(report) ? 'is-move' : 'is-report'">
                {{ isMovimiento(report) ? 'Movimiento' : 'Reporte' }}
              </div>
            </div>
            <div class="report-meta">
              <span class="meta-item">
                <q-icon name="person_outline" size="14px" />
                {{ report.nombre_usuario }}
              </span>
              <span class="meta-item">
                <q-icon name="schedule" size="14px" />
                {{ formatDate(report.fecha_hora) }}
              </span>
            </div>
            <div v-if="report.notas" class="report-notas">
              {{ report.notas }}
            </div>
          </div>

          <div class="report-actions-inline">
            <q-icon
              :name="expandedId === report.id ? 'expand_less' : 'expand_more'"
              color="grey-6"
              size="22px"
              class="cursor-pointer"
              @click.stop="toggleExpand(report.id)"
            />
          </div>
        </div>

        <div v-if="getFotos(report).length" class="thumbs-row">
          <div
            v-for="(foto, idx) in getFotos(report)"
            :key="`${report.id}_${idx}`"
            class="thumb-wrap"
          >
            <div class="thumb-img-wrap" @click="openViewer(foto.url, report, foto, idx)">
              <q-img
                :src="getCloudinaryUrl(foto.url, 'w_200,h_200,c_fill,q_auto')"
                :ratio="1"
                class="thumb-img"
                spinner-color="primary"
              />
              <div
                class="thumb-estado-bar"
                :class="estadoClass(foto.estado)"
              />
            </div>
            <div class="thumb-label">{{ foto.ubicacion || 'Sin ubicación' }}</div>
            <div
              class="thumb-estado"
              :class="estadoClass(foto.estado)"
            >
              {{ foto.estado || 'defectuosa' }}
            </div>
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              icon="download"
              label="Descargar"
              class="thumb-download-btn"
              :loading="downloadingKey === `${report.id}_${idx}`"
              @click.stop="downloadImage(foto, report, idx)"
            />
          </div>
        </div>

        <div v-show="expandedId === report.id" class="report-expanded">
          <div v-if="isMovimiento(report)" class="movement-panel q-mb-md">
            <div class="expanded-title">Trayecto de la pantalla</div>
            <div class="movement-path">
              <div class="movement-stop">
                <div class="movement-stop-label">Salió de</div>
                <div class="movement-stop-value">{{ formatUbicacion(report.origen_ubicacion) }}</div>
                <div v-if="report.origen_habitacion" class="movement-stop-room">{{ report.origen_habitacion }}</div>
              </div>
              <q-icon name="arrow_forward" color="primary" size="22px" />
              <div class="movement-stop">
                <div class="movement-stop-label">Llegó a</div>
                <div class="movement-stop-value">{{ formatUbicacion(report.destino_ubicacion) }}</div>
                <div v-if="report.destino_habitacion" class="movement-stop-room">{{ report.destino_habitacion }}</div>
              </div>
            </div>
          </div>

          <div v-if="getInventarios(report).length" class="inventory-panel q-mb-md">
            <div class="expanded-title">Inventario actual</div>
            <div
              v-for="inv in getInventarios(report)"
              :key="`${report.id}_${inv.key}`"
              class="inventory-card"
            >
              <div class="inventory-location">{{ inv.label }}</div>
              <div class="inventory-rooms">
                <div
                  v-for="room in inv.rooms"
                  :key="`${inv.key}_${room.habitacion}`"
                  class="inventory-room"
                  :class="{ 'has-screen': room.cantidad > 0 }"
                >
                  <span>{{ room.habitacion }}</span>
                  <strong>{{ room.cantidad }} {{ room.cantidad === 1 ? 'pantalla' : 'pantallas' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div v-if="getRelatedMovements(report).length" class="related-panel q-mb-md">
            <div class="expanded-title">Movimientos de esta casita</div>
            <div
              v-for="move in getRelatedMovements(report)"
              :key="`rel_${report.id}_${move.id}`"
              class="related-move"
            >
              <div class="related-move-path">{{ formatMovimientoResumen(move) }}</div>
              <div class="related-move-meta">
                {{ move.nombre_usuario }} · {{ formatDate(move.fecha_hora) }}
              </div>
            </div>
          </div>

          <div v-if="getFotos(report).length" class="expanded-grid">
            <div
              v-for="(foto, idx) in getFotos(report)"
              :key="`exp_${report.id}_${idx}`"
              class="expanded-photo"
            >
              <q-img
                :src="getCloudinaryUrl(foto.url, 'w_900,q_auto')"
                class="expanded-img"
                spinner-color="primary"
                @click="openViewer(foto.url, report, foto, idx)"
              />
              <div class="expanded-caption row items-center justify-between no-wrap">
                <span>{{ foto.ubicacion || 'Sin ubicación' }} · {{ foto.estado || 'defectuosa' }}</span>
                <q-btn
                  flat
                  dense
                  round
                  icon="download"
                  color="primary"
                  :loading="downloadingKey === `exp_${report.id}_${idx}`"
                  @click="downloadImage(foto, report, idx, `exp_${report.id}_${idx}`)"
                >
                  <q-tooltip>Descargar imagen</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="viewerOpen" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black viewer-card">
        <div class="viewer-toolbar">
          <q-btn
            flat
            round
            icon="download"
            color="white"
            :loading="downloadingKey === 'viewer'"
            @click="downloadViewerImage"
          >
            <q-tooltip>Descargar imagen</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="close"
            color="white"
            @click="viewerOpen = false"
          />
        </div>
        <div class="viewer-body">
          <q-img
            v-if="viewerUrl"
            :src="viewerUrl"
            fit="contain"
            class="viewer-img"
            spinner-color="white"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '../utils/notify'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import { generateReportePantallasPdf, getCloudinaryUrl } from '../utils/reportePantallasPdf'
import {
  formatMovimientoResumen,
  formatUbicacion,
  inventoryForUbicacion,
  isMovimiento,
  relatedMovements,
  reportInvolvesUbicacion
} from '../utils/pantallasInventario'

export default defineComponent({
  name: 'ReportePantallasListPage',
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()

    const loading = ref(true)
    const errorMsg = ref('')
    const reports = ref([])
    const searchTerm = ref('')
    const filtersOpen = ref(false)
    const ordenFecha = ref('reciente')
    const ordenarPorCasita = ref(false)
    const soloDefectuosas = ref(false)
    const tipoFiltro = ref('todos')
    const expandedId = ref(null)
    const selectedIds = ref([])
    const pdfBulkLoading = ref(false)
    const downloadingKey = ref(null)
    const viewerOpen = ref(false)
    const viewerUrl = ref('')
    const viewerSourceUrl = ref('')
    const viewerMeta = ref({ casita: null, ubicacion: null, index: 0 })
    const inventarioRows = ref([])

    const ordenFechaOptions = [
      { label: 'Más reciente → más antigua', value: 'reciente' },
      { label: 'Más antigua → más reciente', value: 'antigua' }
    ]

    const tipoFiltroOptions = [
      { label: 'Todos', value: 'todos' },
      { label: 'Solo reportes', value: 'reporte' },
      { label: 'Solo movimientos', value: 'movimiento' }
    ]

    function cardTitle (report) {
      if (isMovimiento(report)) return formatMovimientoResumen(report)
      return `Casita ${report.numero_casita}`
    }

    function involvedUbicaciones (report) {
      if (isMovimiento(report)) {
        return [report.origen_ubicacion, report.destino_ubicacion].filter(Boolean)
      }
      return report?.numero_casita != null ? [String(report.numero_casita)] : []
    }

    function getInventarios (report) {
      const seen = new Set()
      const result = []
      for (const ubicacion of involvedUbicaciones(report)) {
        const key = String(ubicacion)
        if (seen.has(key)) continue
        seen.add(key)
        result.push({
          key,
          label: formatUbicacion(key),
          rooms: inventoryForUbicacion(inventarioRows.value, key, reports.value)
        })
      }
      return result
    }

    function getRelatedMovements (report) {
      const keys = involvedUbicaciones(report)
      const seen = new Set()
      const result = []
      for (const key of keys) {
        for (const move of relatedMovements(reports.value, key, report.id)) {
          if (seen.has(move.id)) continue
          seen.add(move.id)
          result.push(move)
        }
      }
      result.sort((a, b) => getFechaValue(b) - getFechaValue(a))
      return result
    }

    function getFotos (report) {
      return Array.isArray(report?.fotos) ? report.fotos : []
    }

    function isDefectuosa (estado) {
      if (!estado) return true
      return String(estado).trim().toLowerCase() === 'defectuosa'
    }

    function estadoClass (estado) {
      const value = String(estado || '').trim().toLowerCase()
      if (value === 'en buen estado') return 'is-ok'
      if (value === 'no hay pantalla') return 'is-missing'
      return 'is-bad'
    }

    function reportHasDefectuosa (report) {
      return getFotos(report).some(foto => isDefectuosa(foto.estado))
    }

    function getFechaValue (report) {
      const d = new Date(report?.fecha_hora)
      return Number.isNaN(d.getTime()) ? 0 : d.getTime()
    }

    function sortByFecha (list) {
      const sorted = list.slice()
      if (ordenFecha.value === 'antigua') {
        sorted.sort((a, b) => getFechaValue(a) - getFechaValue(b) || Number(a.numero_casita || 0) - Number(b.numero_casita || 0))
      } else {
        sorted.sort((a, b) => getFechaValue(b) - getFechaValue(a) || Number(a.numero_casita || 0) - Number(b.numero_casita || 0))
      }
      return sorted
    }

    /** Una revisión por casita según orden de fecha, luego casitas 1→50 */
    function uniqueByCasita (list) {
      const byDate = sortByFecha(list.filter(report => !isMovimiento(report)))
      const seen = new Set()
      const unique = []
      for (const report of byDate) {
        const num = Number(report.numero_casita)
        if (seen.has(num)) continue
        seen.add(num)
        unique.push(report)
      }
      unique.sort((a, b) => Number(a.numero_casita || 0) - Number(b.numero_casita || 0))
      return unique
    }

    const filteredReports = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      let list = reports.value.slice()

      if (tipoFiltro.value === 'reporte') {
        list = list.filter(report => !isMovimiento(report))
      } else if (tipoFiltro.value === 'movimiento') {
        list = list.filter(isMovimiento)
      }

      if (term) {
        list = list.filter((r) => {
          const casita = String(r.numero_casita || '')
          const usuario = String(r.nombre_usuario || '').toLowerCase()
          const notas = String(r.notas || '').toLowerCase()
          const movimiento = formatMovimientoResumen(r).toLowerCase()
          const origen = formatUbicacion(r.origen_ubicacion).toLowerCase()
          const destino = formatUbicacion(r.destino_ubicacion).toLowerCase()
          return casita.includes(term)
            || usuario.includes(term)
            || notas.includes(term)
            || movimiento.includes(term)
            || origen.includes(term)
            || destino.includes(term)
            || reportInvolvesUbicacion(r, term)
        })
      }

      if (soloDefectuosas.value) {
        list = list.filter(reportHasDefectuosa)
      }

      if (ordenarPorCasita.value) {
        return uniqueByCasita(list)
      }

      return sortByFecha(list)
    })

    const filtrosActivosCount = computed(() => {
      let count = 0
      if (ordenFecha.value !== 'reciente') count++
      if (ordenarPorCasita.value) count++
      if (soloDefectuosas.value) count++
      if (tipoFiltro.value !== 'todos') count++
      return count
    })

    const filtrosResumen = computed(() => {
      const chips = []
      if (ordenarPorCasita.value) {
        chips.push(ordenFecha.value === 'antigua' ? 'Más antigua por casita' : 'Más reciente por casita')
        chips.push('Casitas 1→50')
      } else if (ordenFecha.value === 'antigua') {
        chips.push('Antigua → reciente')
      }
      if (soloDefectuosas.value) chips.push('Solo defectuosas')
      if (tipoFiltro.value === 'reporte') chips.push('Solo reportes')
      if (tipoFiltro.value === 'movimiento') chips.push('Solo movimientos')
      return chips
    })

    const emptyTitle = computed(() => {
      if (reports.value.length === 0) return 'Aún no hay reportes'
      return 'Sin resultados'
    })

    const emptyCaption = computed(() => {
      if (reports.value.length === 0) return 'Crea el primero con el botón Nuevo'
      if (tipoFiltro.value === 'movimiento') return 'No hay movimientos de pantallas con esos filtros'
      if (soloDefectuosas.value) return 'No hay reportes con pantallas defectuosas'
      if (searchTerm.value.trim()) return 'Prueba otro término de búsqueda o cambia los filtros'
      return 'Ajusta los filtros para ver reportes'
    })

    function resetFilters () {
      ordenFecha.value = 'reciente'
      ordenarPorCasita.value = false
      soloDefectuosas.value = false
      tipoFiltro.value = 'todos'
    }

    const allFilteredSelected = computed(() => {
      if (filteredReports.value.length === 0) return false
      return filteredReports.value.every(r => selectedIds.value.includes(r.id))
    })

    const someFilteredSelected = computed(() => {
      return filteredReports.value.some(r => selectedIds.value.includes(r.id))
    })

    function isSelected (id) {
      return selectedIds.value.includes(id)
    }

    function toggleSelection (id, checked) {
      if (checked) {
        if (!selectedIds.value.includes(id)) {
          selectedIds.value = [...selectedIds.value, id]
        }
      } else {
        selectedIds.value = selectedIds.value.filter(item => item !== id)
      }
    }

    function toggleSelectAllFiltered (checked) {
      const visibleIds = filteredReports.value.map(r => r.id)
      if (checked) {
        selectedIds.value = [...new Set([...selectedIds.value, ...visibleIds])]
      } else {
        selectedIds.value = selectedIds.value.filter(id => !visibleIds.includes(id))
      }
    }

    function clearSelection () {
      selectedIds.value = []
    }

    function formatDate (value) {
      if (!value) return '—'
      try {
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return String(value)
        return new Intl.DateTimeFormat('es-CR', {
          timeZone: 'America/Costa_Rica',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(d)
      } catch {
        return String(value)
      }
    }

    async function fetchReports () {
      loading.value = true
      errorMsg.value = ''
      try {
        const { data, error } = await supabase
          .from('reporte_pantallas')
          .select('*')
          .order('fecha_hora', { ascending: false })

        if (error) throw error
        reports.value = data || []
        selectedIds.value = selectedIds.value.filter(id => reports.value.some(r => r.id === id))

        const inventarioRes = await supabase
          .from('inventario_pantallas')
          .select('*')
        inventarioRows.value = inventarioRes.error ? [] : (inventarioRes.data || [])
      } catch (err) {
        console.error('Error fetching reporte_pantallas:', err)
        errorMsg.value = 'No se pudieron cargar los reportes'
      } finally {
        loading.value = false
      }
    }

    function toggleExpand (id) {
      expandedId.value = expandedId.value === id ? null : id
    }

    function openViewer (url, report = null, foto = null, idx = 0) {
      viewerSourceUrl.value = url
      viewerUrl.value = getCloudinaryUrl(url, 'w_1600,q_auto')
      viewerMeta.value = {
        casita: report?.numero_casita || null,
        ubicacion: foto?.ubicacion || null,
        index: idx
      }
      viewerOpen.value = true
    }

    function buildImageFilename (foto, report, idx) {
      const casita = report?.numero_casita || 'x'
      const ubicacion = String(foto?.ubicacion || 'foto')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
      return `casita_${casita}_${ubicacion || 'foto'}_${idx + 1}.jpg`
    }

    async function downloadImage (foto, report, idx, loadingKey = null) {
      if (!foto?.url) return
      const key = loadingKey || `${report.id}_${idx}`
      downloadingKey.value = key
      try {
        const sourceUrl = getCloudinaryUrl(foto.url, 'q_auto:best,f_jpg')
        const response = await fetch(sourceUrl, { mode: 'cors' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = buildImageFilename(foto, report, idx)
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(objectUrl)
        notify({ type: 'positive', message: 'Imagen descargada', icon: 'download' })
      } catch (err) {
        console.error('Image download failed:', err)
        // Fallback: abrir URL de descarga forzada de Cloudinary
        const fallbackUrl = getCloudinaryUrl(foto.url, 'fl_attachment,q_auto:best,f_jpg')
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
        notify({ type: 'info', message: 'Abriendo imagen para descargar' })
      } finally {
        downloadingKey.value = null
      }
    }

    async function downloadViewerImage () {
      if (!viewerSourceUrl.value) return
      downloadingKey.value = 'viewer'
      try {
        const sourceUrl = getCloudinaryUrl(viewerSourceUrl.value, 'q_auto:best,f_jpg')
        const response = await fetch(sourceUrl, { mode: 'cors' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = buildImageFilename(
          { ubicacion: viewerMeta.value.ubicacion },
          { numero_casita: viewerMeta.value.casita },
          viewerMeta.value.index
        )
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(objectUrl)
        notify({ type: 'positive', message: 'Imagen descargada', icon: 'download' })
      } catch (err) {
        console.error('Viewer image download failed:', err)
        const fallbackUrl = getCloudinaryUrl(viewerSourceUrl.value, 'fl_attachment,q_auto:best,f_jpg')
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
        notify({ type: 'info', message: 'Abriendo imagen para descargar' })
      } finally {
        downloadingKey.value = null
      }
    }

    async function downloadSelectedPdf () {
      const selectedReports = reports.value.filter(r => selectedIds.value.includes(r.id) && !isMovimiento(r) && getFotos(r).length > 0)
      if (selectedReports.length === 0) {
        notify({ type: 'warning', message: 'Selecciona al menos un reporte con fotos. Los movimientos no se incluyen en el PDF.' })
        return
      }

      pdfBulkLoading.value = true
      try {
        await generateReportePantallasPdf(selectedReports)
        notify({
          type: 'positive',
          message: `PDF generado (${selectedReports.length} casitas)`,
          caption: '5 casitas por página, ordenadas de menor a mayor',
          icon: 'picture_as_pdf'
        })
      } catch (err) {
        console.error('Bulk PDF generation failed:', err)
        notify({
          type: 'negative',
          message: 'No se pudo generar el PDF',
          caption: err.message
        })
      } finally {
        pdfBulkLoading.value = false
      }
    }

    function goToNuevo () {
      router.push('/reporte-pantallas/nuevo')
    }

    onMounted(fetchReports)

    return {
      authStore,
      loading,
      errorMsg,
      reports,
      searchTerm,
      filtersOpen,
      ordenFecha,
      ordenFechaOptions,
      ordenarPorCasita,
      soloDefectuosas,
      tipoFiltro,
      tipoFiltroOptions,
      filtrosActivosCount,
      filtrosResumen,
      filteredReports,
      emptyTitle,
      emptyCaption,
      resetFilters,
      expandedId,
      selectedIds,
      allFilteredSelected,
      someFilteredSelected,
      pdfBulkLoading,
      downloadingKey,
      viewerOpen,
      viewerUrl,
      getFotos,
      isDefectuosa,
      estadoClass,
      isMovimiento,
      cardTitle,
      formatUbicacion,
      formatMovimientoResumen,
      getInventarios,
      getRelatedMovements,
      isSelected,
      toggleSelection,
      toggleSelectAllFiltered,
      clearSelection,
      formatDate,
      getCloudinaryUrl,
      fetchReports,
      toggleExpand,
      openViewer,
      downloadImage,
      downloadViewerImage,
      downloadSelectedPdf,
      goToNuevo
    }
  }
})
</script>

<style scoped>
.reporte-list-page {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-top: 4px;
}

.filters-toolbar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.filters-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filters-modal {
  width: 100%;
  max-width: 600px;
  border-radius: 16px 16px 0 0;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #424242;
  margin-bottom: 8px;
}

.nuevo-btn {
  flex-shrink: 0;
  font-weight: 600;
}

.selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: white;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.selection-bar__info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.selection-count {
  font-size: 12px;
  font-weight: 600;
  color: #616161;
}

.selection-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  text-align: center;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-card {
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.report-card--selected {
  border-color: rgba(211, 47, 47, 0.35);
  box-shadow: 0 0 0 1px rgba(211, 47, 47, 0.12);
}

.report-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px 8px 8px;
}

.report-checkbox {
  flex-shrink: 0;
}

.report-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.casita-badge {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #b71c1c;
  background: #ffebee;
  border-radius: 999px;
  padding: 4px 10px;
  max-width: 100%;
  word-break: break-word;
}

.report-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.casita-badge--move {
  color: #0d47a1;
  background: #e3f2fd;
}

.report-type-chip {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.report-type-chip.is-report {
  color: #c62828;
}

.report-type-chip.is-move {
  color: #1565c0;
}

.expanded-title {
  font-size: 12px;
  font-weight: 700;
  color: #424242;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.movement-path {
  display: flex;
  align-items: center;
  gap: 10px;
}

.movement-stop {
  flex: 1;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 10px 12px;
}

.movement-stop-label {
  font-size: 11px;
  color: #757575;
  margin-bottom: 2px;
}

.movement-stop-value {
  font-size: 14px;
  font-weight: 700;
  color: #212121;
}

.movement-stop-room {
  font-size: 12px;
  color: #616161;
  margin-top: 2px;
}

.inventory-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.inventory-location {
  font-size: 13px;
  font-weight: 700;
  color: #212121;
  margin-bottom: 6px;
}

.inventory-rooms {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inventory-room {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #757575;
}

.inventory-room.has-screen {
  color: #2e7d32;
}

.related-move {
  padding: 8px 0;
}

.related-move + .related-move {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.related-move-path {
  font-size: 13px;
  font-weight: 600;
  color: #1565c0;
}

.related-move-meta {
  font-size: 11px;
  color: #757575;
  margin-top: 2px;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #757575;
}

.report-notas {
  margin-top: 6px;
  font-size: 12px;
  color: #616161;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-actions-inline {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.thumbs-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 0 14px 12px;
}

.thumb-wrap {
  position: relative;
}

.thumb-img-wrap {
  cursor: pointer;
  position: relative;
}

.thumb-img {
  border-radius: 10px;
  overflow: hidden;
  background: #f5f5f5;
}

.thumb-download-btn {
  width: 100%;
  margin-top: 2px;
  font-size: 11px;
}

.thumb-estado-bar {
  height: 4px;
  border-radius: 0 0 8px 8px;
  margin-top: -4px;
  position: relative;
  z-index: 1;
}

.thumb-estado-bar.is-bad {
  background: #c62828;
}

.thumb-estado-bar.is-ok {
  background: #2e7d32;
}

.thumb-estado-bar.is-missing {
  background: #fbc02d;
}

.thumb-label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #616161;
  text-align: center;
  line-height: 1.2;
}

.thumb-estado {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  text-transform: capitalize;
}

.thumb-estado.is-bad {
  color: #c62828;
}

.thumb-estado.is-ok {
  color: #2e7d32;
}

.thumb-estado.is-missing {
  color: #f9a825;
}

.report-expanded {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 14px 16px;
}

.expanded-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.expanded-img {
  border-radius: 12px;
  overflow: hidden;
  background: #111;
  max-height: 320px;
  cursor: pointer;
}

.expanded-caption {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #424242;
}

.viewer-card {
  min-height: 100vh;
}

.viewer-toolbar {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  display: flex;
  gap: 4px;
  padding: 12px;
}

.viewer-body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 16px 16px;
}

.viewer-img {
  width: 100%;
  max-height: calc(100vh - 80px);
}

.body--dark .report-card,
.body--dark .selection-bar {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .field-label {
  color: #e0e0e0;
}

.body--dark .casita-badge {
  background: rgba(183, 28, 28, 0.25);
}

.body--dark .casita-badge--move {
  background: rgba(13, 71, 161, 0.28);
}

.body--dark .expanded-title,
.body--dark .movement-stop-value,
.body--dark .inventory-location,
.body--dark .related-move-path {
  color: #e0e0e0;
}

.body--dark .movement-stop,
.body--dark .inventory-card {
  background: #2a2a2a;
}

.body--dark .expanded-caption,
.body--dark .thumb-label,
.body--dark .selection-count {
  color: #e0e0e0;
}
</style>
