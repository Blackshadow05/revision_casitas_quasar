export function isStandaloneDisplay () {
  if (typeof window === 'undefined') return false

  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches
    || window.navigator.standalone
  )
}

export function isAndroid () {
  return /Android/i.test(navigator.userAgent || '')
}

function toIntentUrl (url) {
  let hostAndPath = url.replace(/^https:\/\//, '')
  try {
    const parsed = new URL(url)
    hostAndPath = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch (_error) {
    // keep fallback hostAndPath
  }

  return `intent://${hostAndPath}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`
}

export function openBlankExternalTab () {
  if (typeof window === 'undefined') return null
  if (isAndroid() && isStandaloneDisplay()) return null

  try {
    return window.open('about:blank', '_blank')
  } catch (_error) {
    return null
  }
}

export function openInExternalBrowser (url, existingTab = null) {
  if (!url || typeof window === 'undefined') return false

  if (isAndroid() && isStandaloneDisplay()) {
    if (existingTab && !existingTab.closed) {
      try { existingTab.close() } catch (_error) { /* ignore */ }
    }

    window.location.href = `googlechrome://navigate?url=${encodeURIComponent(url)}`
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = toIntentUrl(url)
      }
    }, 600)
    return true
  }

  if (existingTab && !existingTab.closed) {
    try {
      existingTab.location.replace(url)
      existingTab.opener = null
      return true
    } catch (_error) {
      try { existingTab.close() } catch (_closeError) { /* ignore */ }
    }
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (opened) return true

  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.referrerPolicy = 'no-referrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return true
}
