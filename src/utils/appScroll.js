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

const NON_TEXT_INPUT = new Set([
  'button', 'checkbox', 'radio', 'file', 'submit', 'hidden', 'range', 'color', 'image'
])

export function isTextControl (el) {
  if (!el || el === document.body) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag !== 'INPUT') return false
  return !NON_TEXT_INPUT.has(String(el.type || 'text').toLowerCase())
}

export function getKeyboardInset () {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0))
}

/**
 * Scrolls `el` into the visible slice of #app-page-container, above the
 * on-screen keyboard (visualViewport) and below any sticky header gutter.
 * `behavior: 'auto'` by default: smooth scroll on iOS can blur the input.
 */
export function scrollElementIntoAppView (el, {
  topGutter = 12,
  bottomGutter = 12,
  behavior = 'auto'
} = {}) {
  if (!el) return

  const scroller = getAppScrollTarget()
  const vv = window.visualViewport
  const scrollerRect = scroller
    ? scroller.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight }
  const elRect = el.getBoundingClientRect()

  const viewTop = vv ? vv.offsetTop : 0
  const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight
  const visibleTop = Math.max(scrollerRect.top, viewTop) + topGutter
  const visibleBottom = Math.min(scrollerRect.bottom, viewBottom) - bottomGutter
  const visibleHeight = visibleBottom - visibleTop

  if (visibleHeight <= 0) return

  let delta = 0
  if (elRect.height >= visibleHeight || elRect.top < visibleTop) {
    delta = elRect.top - visibleTop
  } else if (elRect.bottom > visibleBottom) {
    delta = elRect.bottom - visibleBottom
  } else {
    return
  }

  if (Math.abs(delta) < 2) return

  if (scroller) {
    scroller.scrollBy({ top: delta, left: 0, behavior })
    return
  }

  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior })
}
