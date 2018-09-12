import { isValidElement } from 'react'
import { toastr } from 'react-redux-toastr'

export function triggleToast(msg, options={}) {
  if (!msg) {
    return
  }
  if (isValidElement(msg)) {
    options.component = msg
    msg = ''
  }
  const type = options.type || 'info'
  const title = options.title || 'poi'
  toastr[type](title, msg, options)
}
