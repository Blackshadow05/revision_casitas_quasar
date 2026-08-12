export const TIPO_REPORTE = 'reporte'
export const TIPO_MOVIMIENTO = 'movimiento'

export const HABITACIONES_PANTALLA = ['Living', 'Cuarto Queen', 'Cuarto King']
export const ESTADO_NO_HAY_PANTALLA = 'no hay pantalla'

export const UBICACIONES_EXTRA = [
  { label: 'Bodega', value: 'bodega' },
  { label: 'Casa Verde', value: 'casa_verde' }
]

export function buildCasitaOptions () {
  return Array.from({ length: 50 }, (_, i) => ({
    label: `Casita ${i + 1}`,
    value: i + 1
  }))
}

export function buildUbicacionOptions () {
  const casitas = Array.from({ length: 50 }, (_, i) => ({
    label: `Casita ${i + 1}`,
    value: String(i + 1)
  }))
  return [...casitas, ...UBICACIONES_EXTRA]
}

export function isCasitaUbicacion (value) {
  return /^\d+$/.test(String(value || '').trim())
}

export function formatUbicacion (value) {
  const key = String(value || '').trim()
  if (!key) return '—'
  if (key === 'bodega') return 'Bodega'
  if (key === 'casa_verde') return 'Casa Verde'
  if (isCasitaUbicacion(key)) return `Casita ${Number(key)}`
  return key
}

export function formatHabitacion (value) {
  const key = String(value || '').trim()
  return key || ''
}

export function formatMovimientoResumen (report) {
  const from = formatUbicacion(report?.origen_ubicacion)
  const to = formatUbicacion(report?.destino_ubicacion)
  const fromRoom = formatHabitacion(report?.origen_habitacion)
  const toRoom = formatHabitacion(report?.destino_habitacion)
  const fromLabel = fromRoom ? `${from} · ${fromRoom}` : from
  const toLabel = toRoom ? `${to} · ${toRoom}` : to
  return `${fromLabel} → ${toLabel}`
}

export function isMovimiento (report) {
  return String(report?.tipo || TIPO_REPORTE) === TIPO_MOVIMIENTO
}

export function isNoHayPantalla (estado) {
  return String(estado || '').trim().toLowerCase() === ESTADO_NO_HAY_PANTALLA
}

function fotoHabitacion (foto) {
  return String(foto?.ubicacion || foto?.habitacion || '').trim()
}

export function casitaKey (value) {
  const key = String(value ?? '').trim()
  return key
}

export function reportInvolvesUbicacion (report, ubicacion) {
  const key = casitaKey(ubicacion)
  if (!key) return false
  if (casitaKey(report?.numero_casita) === key) return true
  if (casitaKey(report?.origen_ubicacion) === key) return true
  if (casitaKey(report?.destino_ubicacion) === key) return true
  return false
}

export function relatedMovements (reports, ubicacion, excludeId = null) {
  const list = Array.isArray(reports) ? reports : []
  return list.filter((report) => {
    if (!isMovimiento(report)) return false
    if (excludeId != null && report.id === excludeId) return false
    return reportInvolvesUbicacion(report, ubicacion)
  })
}

function inventoryHabitacionKey (ubicacion, habitacion) {
  if (isCasitaUbicacion(ubicacion)) return String(habitacion || '').trim()
  return String(habitacion || '').trim()
}

export async function ajustarInventarioPantalla (supabase, ubicacion, habitacion, delta) {
  const ubi = casitaKey(ubicacion)
  const hab = inventoryHabitacionKey(ubi, habitacion)
  if (!ubi || !delta) return

  const { error: rpcError } = await supabase.rpc('ajustar_inventario_pantalla', {
    p_ubicacion: ubi,
    p_habitacion: hab,
    p_delta: delta
  })

  if (!rpcError) return
  if (!isMissingRpc(rpcError)) throw rpcError

  const { data, error: selectError } = await supabase
    .from('inventario_pantallas')
    .select('id, cantidad')
    .eq('ubicacion', ubi)
    .eq('habitacion', hab)
    .maybeSingle()

  if (selectError) throw selectError

  if (!data) {
    const { error: insertError } = await supabase
      .from('inventario_pantallas')
      .insert({
        ubicacion: ubi,
        habitacion: hab,
        cantidad: Math.max(delta, 0)
      })
    if (insertError) throw insertError
    return
  }

  const { error: updateError } = await supabase
    .from('inventario_pantallas')
    .update({
      cantidad: Math.max((Number(data.cantidad) || 0) + delta, 0),
      updated_at: new Date().toISOString()
    })
    .eq('id', data.id)

  if (updateError) throw updateError
}

export async function setInventarioPantalla (supabase, ubicacion, habitacion, cantidad) {
  const ubi = casitaKey(ubicacion)
  const hab = inventoryHabitacionKey(ubi, habitacion)
  if (!ubi) return
  const qty = Math.max(Number(cantidad) || 0, 0)

  const { error: rpcError } = await supabase.rpc('set_inventario_pantalla', {
    p_ubicacion: ubi,
    p_habitacion: hab,
    p_cantidad: qty
  })

  if (!rpcError) return
  if (!isMissingRpc(rpcError)) throw rpcError

  const { data, error: selectError } = await supabase
    .from('inventario_pantallas')
    .select('id')
    .eq('ubicacion', ubi)
    .eq('habitacion', hab)
    .maybeSingle()

  if (selectError) throw selectError

  if (!data) {
    const { error: insertError } = await supabase
      .from('inventario_pantallas')
      .insert({
        ubicacion: ubi,
        habitacion: hab,
        cantidad: qty
      })
    if (insertError) throw insertError
    return
  }

  const { error: updateError } = await supabase
    .from('inventario_pantallas')
    .update({
      cantidad: qty,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.id)

  if (updateError) throw updateError
}

export async function aplicarInventarioDesdeReporte (supabase, numeroCasita, fotos) {
  const casita = casitaKey(numeroCasita)
  if (!casita) return

  const list = Array.isArray(fotos) ? fotos : []
  for (const foto of list) {
    const habitacion = fotoHabitacion(foto)
    if (!habitacion) continue
    const cantidad = isNoHayPantalla(foto?.estado) ? 0 : 1
    await setInventarioPantalla(supabase, casita, habitacion, cantidad)
  }
}

export async function registrarMovimientoPantalla (supabase, payload) {
  const { error, data } = await supabase.rpc('registrar_movimiento_pantalla', {
    p_nombre_usuario: payload.nombre_usuario,
    p_fecha_hora: payload.fecha_hora,
    p_notas: payload.notas,
    p_origen_ubicacion: payload.origen_ubicacion,
    p_origen_habitacion: payload.origen_habitacion,
    p_destino_ubicacion: payload.destino_ubicacion,
    p_destino_habitacion: payload.destino_habitacion
  })

  if (!error) return data

  if (!isMissingRpc(error) && !isMissingColumn(error)) throw error

  const record = {
    nombre_usuario: payload.nombre_usuario,
    fecha_hora: payload.fecha_hora,
    numero_casita: payload.numero_casita,
    fotos: [],
    notas: payload.notas,
    tipo: TIPO_MOVIMIENTO,
    origen_ubicacion: payload.origen_ubicacion,
    origen_habitacion: payload.origen_habitacion,
    destino_ubicacion: payload.destino_ubicacion,
    destino_habitacion: payload.destino_habitacion
  }

  const { error: insertError } = await supabase
    .from('reporte_pantallas')
    .insert(record)

  if (insertError) throw insertError

  try {
    await ajustarInventarioPantalla(
      supabase,
      payload.origen_ubicacion,
      payload.origen_habitacion,
      -1
    )
    await ajustarInventarioPantalla(
      supabase,
      payload.destino_ubicacion,
      payload.destino_habitacion,
      1
    )
  } catch (inventoryError) {
    console.error('Movimiento guardado, pero el inventario no se actualizó', inventoryError)
  }

  return record
}

function roomInventoryKey (ubicacion, habitacion) {
  return `${casitaKey(ubicacion)}|${String(habitacion || '').trim()}`
}

function eventTime (row) {
  const raw = String(row?.fecha_hora || row?.created_at || '').trim()
  if (!raw) return 0
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const time = new Date(normalized).getTime()
  return Number.isNaN(time) ? 0 : time
}

function applyReportToCounts (counts, report) {
  const casita = casitaKey(report?.numero_casita)
  if (!casita) return

  const fotos = Array.isArray(report?.fotos) ? report.fotos : []
  for (const foto of fotos) {
    const habitacion = fotoHabitacion(foto)
    if (!habitacion) continue
    counts.set(
      roomInventoryKey(casita, habitacion),
      isNoHayPantalla(foto?.estado) ? 0 : 1
    )
  }
}

function applyMovementToCounts (counts, move) {
  const originUbi = casitaKey(move?.origen_ubicacion)
  const destUbi = casitaKey(move?.destino_ubicacion)

  if (originUbi) {
    const key = roomInventoryKey(originUbi, move?.origen_habitacion)
    counts.set(key, Math.max((counts.get(key) || 0) - 1, 0))
  }

  if (destUbi) {
    const key = roomInventoryKey(destUbi, move?.destino_habitacion)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
}

export function inventoryCountsFromHistory (reports) {
  const counts = new Map()
  const ordered = [...(Array.isArray(reports) ? reports : [])].sort((a, b) => {
    const delta = eventTime(a) - eventTime(b)
    if (delta !== 0) return delta
    return Number(a?.id || 0) - Number(b?.id || 0)
  })

  for (const row of ordered) {
    if (isMovimiento(row)) applyMovementToCounts(counts, row)
    else applyReportToCounts(counts, row)
  }

  return counts
}

function roomsFromCounts (counts, ubicacion) {
  const key = casitaKey(ubicacion)

  if (isCasitaUbicacion(key)) {
    return HABITACIONES_PANTALLA.map((habitacion) => ({
      habitacion,
      cantidad: counts.get(roomInventoryKey(key, habitacion)) || 0
    }))
  }

  return [{
    habitacion: 'General',
    cantidad: counts.get(roomInventoryKey(key, '')) || 0
  }]
}

export function inventoryFromHistory (reports, ubicacion) {
  return roomsFromCounts(inventoryCountsFromHistory(reports), ubicacion)
}

export function inventoryForUbicacion (rows, ubicacion, reports = []) {
  if (Array.isArray(reports) && reports.length > 0) {
    return inventoryFromHistory(reports, ubicacion)
  }

  const key = casitaKey(ubicacion)
  const list = Array.isArray(rows) ? rows : []
  const matched = list.filter(row => casitaKey(row.ubicacion) === key)

  if (matched.length === 0) {
    return inventoryFromHistory(reports, key)
  }

  if (isCasitaUbicacion(key)) {
    return HABITACIONES_PANTALLA.map((habitacion) => {
      const row = matched.find(item => inventoryHabitacionKey(key, item.habitacion) === habitacion)
      return {
        habitacion,
        cantidad: Number(row?.cantidad) || 0
      }
    })
  }

  return matched.map(row => ({
    habitacion: formatHabitacion(row.habitacion) || 'General',
    cantidad: Number(row.cantidad) || 0
  }))
}

export function inventoryFromMovements (reports, ubicacion) {
  return inventoryFromHistory(reports, ubicacion)
}

export function buildInventarioCasitas (rows, reports = []) {
  const casitas = Array.from({ length: 50 }, (_, i) => {
    const key = String(i + 1)
    const rooms = inventoryForUbicacion(rows, key, reports)
    const total = rooms.reduce((sum, room) => sum + (Number(room.cantidad) || 0), 0)
    return {
      key,
      numero: i + 1,
      label: `Casita ${i + 1}`,
      rooms,
      total,
      extra: false
    }
  })

  const extras = UBICACIONES_EXTRA.map((item) => {
    const rooms = inventoryForUbicacion(rows, item.value, reports)
    const total = rooms.reduce((sum, room) => sum + (Number(room.cantidad) || 0), 0)
    return {
      key: item.value,
      numero: null,
      label: item.label,
      rooms,
      total,
      extra: true
    }
  })

  return [...casitas, ...extras]
}

export function inventarioToCsv (items) {
  const header = ['Ubicación', ...HABITACIONES_PANTALLA, 'Total']
  const lines = [header.join(',')]

  for (const item of items) {
    const roomsByName = new Map((item.rooms || []).map(room => [room.habitacion, Number(room.cantidad) || 0]))
    if (item.extra && roomsByName.has('General') && HABITACIONES_PANTALLA.every(name => !roomsByName.has(name))) {
      lines.push([csvCell(item.label), '', '', '', Number(item.total) || 0].join(','))
      continue
    }

    const roomValues = HABITACIONES_PANTALLA.map(name => roomsByName.get(name) || 0)
    lines.push([csvCell(item.label), ...roomValues, Number(item.total) || 0].join(','))
  }

  return `\uFEFF${lines.join('\n')}`
}

function csvCell (value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function isMissingRpc (error) {
  const code = String(error?.code || '')
  const message = String(error?.message || '').toLowerCase()
  return code === 'PGRST202' || message.includes('could not find the function') || message.includes('does not exist')
}

function isMissingColumn (error) {
  const code = String(error?.code || '')
  const message = String(error?.message || '').toLowerCase()
  return code === 'PGRST204' || message.includes('column') && message.includes('does not exist')
}
