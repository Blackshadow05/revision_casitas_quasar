const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'details', component: () => import('pages/DetailsPage.vue') },
      {
        path: 'new-revision',
        component: () => import('pages/NewRevisionPage.vue'),
        meta: { requiresAuth: true }
      },
      { path: 'menus', component: () => import('pages/MenusPage.vue') },
      { path: 'menus/scan', component: () => import('pages/ScanMenuPage.vue') },
      { path: 'config', component: () => import('pages/ConfigPage.vue') },
      { path: 'caja-fuerte', component: () => import('pages/CajaFuerteListPage.vue') },
      { path: 'caja-fuerte/todos', component: () => import('pages/CajaFuerteDetailPage.vue') },
      { path: 'caja-fuerte/:numero', component: () => import('pages/CajaFuerteDetailPage.vue') },
      {
        path: 'admin-users',
        component: () => import('pages/AdminUsersPage.vue'),
        meta: { requiresAuth: true, requiresUserManager: true }
      },
      {
        path: 'ingresos',
        component: () => import('pages/LoginLogsPage.vue'),
        meta: { requiresAuth: true, requiresUserManager: true }
      },
      { path: 'forms', component: () => import('pages/FormsPage.vue') },
      { path: 'reportes', component: () => import('pages/ReportesPage.vue') },
      { path: 'danos-casitas', component: () => import('pages/DanosCasitasListPage.vue') },
      { path: 'danos-casitas/:numero', component: () => import('pages/DanosCasitasDetailPage.vue') },
      {
        path: 'reporte-pantallas',
        component: () => import('pages/ReportePantallasListPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'reporte-pantallas/nuevo',
        component: () => import('pages/ReportePantallasPage.vue'),
        meta: { requiresAuth: true }
      },
      { path: 'dashboard-horario', component: () => import('pages/DashboardHorarioPage.vue') },
      { path: 'puesto-01', component: () => import('pages/Puesto01Page.vue') },
      { path: 'snippets', component: () => import('pages/SnippetsPage.vue') },
      { path: 'seguridad', component: () => import('pages/SecurityMenuPage.vue') },
      { path: 'seguridad/bitacora', component: () => import('pages/DailyLogsPage.vue') },
      { path: 'seguridad/incidentes', component: () => import('pages/IncidentsListPage.vue') },
      { path: 'seguridad/incidentes/nuevo', component: () => import('pages/IncidentDetailPage.vue') },
      { path: 'seguridad/incidentes/:id', component: () => import('pages/IncidentDetailPage.vue') },
      { path: 'seguridad/objetos-perdidos', component: () => import('pages/LostFoundListPage.vue') },
      { path: 'seguridad/objetos-perdidos/nuevo', component: () => import('pages/LostFoundDetailPage.vue') },
      { path: 'seguridad/objetos-perdidos/:id', component: () => import('pages/LostFoundDetailPage.vue') },
      { path: 'seguridad/activos', component: () => import('pages/AssetLogsPage.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
