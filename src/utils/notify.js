import { toast } from 'vue-sonner'

const POSITION_MAP = {
  top: 'top-center',
  bottom: 'bottom-center',
  center: 'bottom-center',
  'top-left': 'top-left',
  'top-right': 'top-right',
  'bottom-left': 'bottom-left',
  'bottom-right': 'bottom-right'
}

const TYPE_MAP = {
  positive: 'success',
  negative: 'error',
  warning: 'warning',
  info: 'info',
  ongoing: 'loading',
  '': 'message',
  primary: 'message',
  secondary: 'message',
  accent: 'message',
  dark: 'message'
}

function resolveType (opts) {
  if (opts.type && TYPE_MAP[opts.type]) return TYPE_MAP[opts.type]
  if (opts.color && TYPE_MAP[opts.color]) return TYPE_MAP[opts.color]
  return 'message'
}

export function notify (opts = {}) {
  const {
    type,
    color,
    message,
    caption,
    description,
    timeout = 5000,
    position,
    actions,
    multiLine,
    icon,
    ...rest
  } = opts

  const method = resolveType({ type, color })
  const text = (message !== undefined && message !== null) ? String(message) : ''
  const desc = description || caption
  const sonnerOpts = {}

  if (desc) sonnerOpts.description = String(desc)
  if (timeout === 0 || timeout === false) {
    sonnerOpts.duration = Infinity
  } else if (typeof timeout === 'number') {
    sonnerOpts.duration = timeout
  }
  if (position && POSITION_MAP[position]) {
    sonnerOpts.position = POSITION_MAP[position]
  }
  if (Array.isArray(actions) && actions.length) {
    const a = actions[0]
    sonnerOpts.action = {
      label: a.label || 'Acción',
      onClick: (e) => { if (typeof a.handler === 'function') a.handler(e) }
    }
  }
  Object.assign(sonnerOpts, rest)

  if (method === 'success') return toast.success(text, sonnerOpts)
  if (method === 'error') return toast.error(text, sonnerOpts)
  if (method === 'warning') return toast.warning(text, sonnerOpts)
  if (method === 'info') return toast.info(text, sonnerOpts)
  if (method === 'loading') return toast.loading(text, sonnerOpts)
  return toast(text, sonnerOpts)
}

export { toast }
export default notify
