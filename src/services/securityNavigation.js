const securityNavigationItems = [
  {
    path: '/google-sheets',
    icon: 'analytics',
    label: 'Operación',
    description: 'Consulta operativa y seguimiento general',
    gradient: 'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)',
    countKey: null
  },
  {
    path: '/google-sheets/puesto-01',
    icon: 'store',
    label: 'Puesto 01',
    description: 'Acceso directo a registros de Puesto 01',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    countKey: null
  },
  {
    path: '/seguridad/bitacora',
    icon: 'menu_book',
    label: 'Bitácora Diaria',
    description: 'Registro de turnos, rondas y actividades',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    countKey: 'dailyLogs'
  },
  {
    path: '/seguridad/incidentes',
    icon: 'report_problem',
    label: 'Incidentes',
    description: 'Robos, accidentes, daños a propiedad',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    countKey: 'incidents'
  },
  {
    path: '/seguridad/objetos-perdidos',
    icon: 'inventory_2',
    label: 'Objetos Perdidos',
    description: 'Lost & Found - registro y devolucion',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    countKey: 'lostFound'
  },
  {
    path: '/seguridad/activos',
    icon: 'vpn_key',
    label: 'Control de Activos',
    description: 'Llaves, radios, equipos - quien tiene que',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    countKey: 'assetLogs'
  },
  {
    path: '/seguridad/tabla-puesto-01',
    icon: 'table_chart',
    label: 'Tabla Puesto 01',
    description: 'Consulta de registros de Puesto_01',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    countKey: 'puesto01'
  }
]

export const desktopSecurityLinks = securityNavigationItems
  .filter(item => !item.path.startsWith('/seguridad'))
  .map(({ path, icon, label }) => ({
    path,
    icon,
    label
  }))

export const buildSecurityMenuItems = (counts) => securityNavigationItems.map((item) => ({
  ...item,
  showCount: Boolean(item.countKey),
  get count () {
    return item.countKey ? counts[item.countKey] || 0 : 0
  }
}))