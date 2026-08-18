export const APP_PAGE_SCROLL_ID = 'app-page-container'

export function getAppScrollTarget () {
  return document.getElementById(APP_PAGE_SCROLL_ID)
}

export function scrollAppToTop ({ smooth = false } = {}) {
  const opts = { top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' }
  const page = getAppScrollTarget()
  if (page) {
    page.scrollTo(opts)
  }
  window.scrollTo(opts)
}
