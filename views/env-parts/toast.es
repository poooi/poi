import { toastr } from 'react-redux-toastr'

export function triggleToast(msg, options={}) {
  if (!msg) {
    return
  }
  const type = options.type || 'info'
  const title = options.title || 'poi'
  toastr[type](title, msg, options)
}
