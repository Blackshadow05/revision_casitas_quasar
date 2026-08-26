export const LOGIN_LOG_TIMEZONE = 'America/Costa_Rica'

const loginDateTimeOptions = {
  timeZone: LOGIN_LOG_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}

const loginTimeOptions = {
  timeZone: LOGIN_LOG_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit'
}

const loginDayOptions = {
  timeZone: LOGIN_LOG_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatLoginDateTime (value) {
  const date = toDate(value)
  if (!date) return 'Sin accesos'
  return date.toLocaleString('es-CR', loginDateTimeOptions)
}

export function formatLoginTime (value) {
  const date = toDate(value)
  if (!date) return '--:--'
  return date.toLocaleTimeString('es-CR', loginTimeOptions)
}

export function loginDayKey (value) {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LOGIN_LOG_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const shiftDayKey = (key, days) => {
  if (!key) return ''
  const [year, month, day] = key.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

export function formatLoginDayLabel (value) {
  const key = loginDayKey(value)
  if (!key) return 'Sin fecha'

  const todayKey = loginDayKey(new Date())
  if (key === todayKey) return 'Hoy'
  if (key === shiftDayKey(todayKey, -1)) return 'Ayer'

  const date = toDate(value)
  if (!date) return key
  const label = date.toLocaleDateString('es-CR', loginDayOptions)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function loginMethodLabel (metodo) {
  if (metodo === 'google') return 'Google'
  if (metodo === 'authenticator') return 'Authenticator'
  return 'Contraseña'
}

export function loginSearchHaystack (entry) {
  return [
    entry?.usuario,
    entry?.ip_address,
    entry?.metodo,
    loginMethodLabel(entry?.metodo),
    formatLoginDateTime(entry?.logged_at),
    formatLoginDayLabel(entry?.logged_at),
    formatLoginTime(entry?.logged_at),
    entry?.user_agent
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
