const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'details', component: () => import('pages/DetailsPage.vue') },
      { path: 'new-revision', component: () => import('pages/NewRevisionPage.vue') },
      { path: 'menus', component: () => import('pages/MenusPage.vue') },
      { path: 'menus/scan', component: () => import('pages/ScanMenuPage.vue') }
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
