const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL
const GOOGLE_APPS_SCRIPT_URL_PUESTO01 = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL_PUESTO01

function buildRequestUrl(baseUrl) {
  const url = new URL(baseUrl)
  url.searchParams.set('_ts', Date.now().toString())
  return url.toString()
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeCellValue(value) {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return ''
  }

  return trimmedValue
}

function readField(source, keys) {
  if (!source || typeof source !== 'object') {
    return ''
  }

  for (const key of keys) {
    const normalizedValue = normalizeCellValue(source[key])

    if (normalizedValue !== '') {
      return normalizedValue
    }
  }

  return ''
}

function hasFieldValue(source, keys) {
  if (!source || typeof source !== 'object') {
    return false
  }

  return keys.some((key) => normalizeCellValue(source[key]) !== '')
}

function isTimeValue(value) {
  if (typeof value !== 'string') {
    return false
  }

  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return false
  }

  return /^\d{1,2}:\d{2}(:\d{2})?(\s?[ap]m)?$/i.test(normalizedValue)
}

function normalizeCasitaValue(source, keys) {
  const value = readField(source, keys)
  return /\d/.test(value) ? value : ''
}

function getPayloadSource(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload
}

function hasExpectedCollections(payload) {
  return ['checkouts', 'checkins', 'experiencias'].some((key) => key in payload)
}

function normalizePayload(payload) {
  return {
    checkouts: ensureArray(payload?.checkouts),
    checkins: ensureArray(payload?.checkins),
    experiencias: ensureArray(payload?.experiencias),
    fecha: payload?.fecha || null
  }
}

function buildPuesto01Status({ ingresoValor, salidaValor, ingresoValido, salidaValida }) {
  if (!ingresoValor || !salidaValor) {
    return {
      key: 'pending',
      label: 'Pendiente',
      color: 'warning'
    }
  }

  if (ingresoValido && salidaValida) {
    return {
      key: 'completed',
      label: 'Completado',
      color: 'positive'
    }
  }

  if (ingresoValido && !salidaValida) {
    return {
      key: 'checkin',
      label: 'Check in',
      color: 'positive'
    }
  }

  if (!ingresoValido && salidaValida) {
    return {
      key: 'checkout',
      label: 'Check out',
      color: 'negative'
    }
  }

  return {
    key: 'pending',
    label: 'Pendiente',
    color: 'warning'
  }
}

function normalizePuesto01Row(item, index) {
  const ingreso = item?.ingreso || item?.entrada || item?.Ingreso || {}
  const salida = item?.salida || item?.egreso || item?.Salida || {}
  const ingresoValor = hasFieldValue(ingreso, ['hora', 'Hora', 'Hora ingreso', 'Hora Ingreso', 'hora ingreso', 'horaIngreso', 'hora_ingreso'])
  const salidaValor = hasFieldValue(salida, ['hora', 'Hora', 'Hora salida', 'Hora Salida', 'hora salida', 'horaSalida', 'hora_salida'])
  const horaIngreso = readField(ingreso, ['hora', 'Hora', 'Hora ingreso', 'Hora Ingreso', 'hora ingreso', 'horaIngreso', 'hora_ingreso'])
  const horaSalida = readField(salida, ['hora', 'Hora', 'Hora salida', 'Hora Salida', 'hora salida', 'horaSalida', 'hora_salida'])

  return {
    id: item?.id || item?.rowId || item?.fila || index,
    ingreso: {
      nombre: readField(ingreso, ['Nombre', 'nombre']),
      casita: normalizeCasitaValue(ingreso, ['Casita', 'casita']),
      placa: readField(ingreso, ['Placa', 'placa']),
      hora: horaIngreso,
      oficial: readField(ingreso, ['oficial', 'Oficial'])
    },
    salida: {
      nombre: readField(salida, ['Nombre', 'nombre']),
      casita: normalizeCasitaValue(salida, ['Casita', 'casita']),
      colaborador: readField(salida, ['Colaborador', 'colaborador']),
      motivo: readField(salida, ['Motivo', 'motivo']),
      placa: readField(salida, ['Placa', 'placa']),
      hora: horaSalida,
      oficial: readField(salida, ['oficial', 'Oficial'])
    },
    status: buildPuesto01Status({
      ingresoValor,
      salidaValor,
      ingresoValido: isTimeValue(horaIngreso),
      salidaValida: isTimeValue(horaSalida)
    })
  }
}

function getPuesto01Rows(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload?.ingreso || payload?.salida || payload?.entrada || payload?.egreso) {
    return [payload]
  }

  return ensureArray(
    payload?.datos ??
    payload?.registros ??
    payload?.rows ??
    payload?.filas ??
    payload?.items ??
    payload?.data
  )
}

function normalizePuesto01Payload(payload) {
  return {
    registros: getPuesto01Rows(payload).map(normalizePuesto01Row),
    fecha: payload?.fecha || payload?.hoja || null
  }
}

export async function fetchGoogleSheetsDashboard() {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    throw new Error('Falta configurar VITE_GOOGLE_APPS_SCRIPT_URL')
  }

  const response = await fetch(buildRequestUrl(GOOGLE_APPS_SCRIPT_URL), {
    method: 'GET',
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`La solicitud falló con código ${response.status}`)
  }

  const payload = await response.json()
  const sourcePayload = getPayloadSource(payload)

  if (payload?.error) {
    throw new Error(payload.error)
  }

  if (!sourcePayload || !hasExpectedCollections(sourcePayload)) {
    throw new Error(`El Apps Script respondió JSON, pero no incluye checkouts, checkins o experiencias. Claves recibidas: ${Object.keys(payload || {}).join(', ') || 'ninguna'}`)
  }

  return normalizePayload(sourcePayload)
}

export async function fetchPuesto01Dashboard() {
  if (!GOOGLE_APPS_SCRIPT_URL_PUESTO01) {
    throw new Error('Falta configurar VITE_GOOGLE_APPS_SCRIPT_URL_PUESTO01')
  }

  const response = await fetch(buildRequestUrl(GOOGLE_APPS_SCRIPT_URL_PUESTO01), {
    method: 'GET',
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`La solicitud falló con código ${response.status}`)
  }

  const payload = await response.json()
  const sourcePayload = getPayloadSource(payload)

  if (payload?.error) {
    throw new Error(payload.error)
  }

  const hasPuesto01Collections = Array.isArray(sourcePayload)
    || ['datos', 'registros', 'rows', 'filas', 'items', 'ingreso', 'salida'].some((key) => key in sourcePayload)

  if (!sourcePayload || !hasPuesto01Collections) {
    throw new Error(`El Apps Script respondió JSON, pero no incluye filas de Puesto 01. Claves recibidas: ${Object.keys(payload || {}).join(', ') || 'ninguna'}`)
  }

  return normalizePuesto01Payload(sourcePayload)
}