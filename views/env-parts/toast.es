let toastTrigger = null

window.toastInitializer = (target) => {
  toastTrigger = target
}

window.toast = (msg, options={}) => {
  if (!msg|| !toastTrigger) {
    return
  }
  const type = options.type || 'info'
  const title = options.title || 'poi'
  options.showAnimation = options.showAnimation || "animated fadeInLeft"
  options.hideAnimation = options.hideAnimation || "animated fadeOutDown"
  switch (type) {
  case 'success':
    toastTrigger.success(msg, title, options)
    break
  case 'warning':
    toastTrigger.warning(msg, title, options)
    break
  case 'error':
    toastTrigger.error(msg, title, options)
    break
  default:
    toastTrigger.info(msg, title, options)
    break
  }
}
