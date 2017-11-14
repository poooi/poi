/*
 * Options:
 *   title: string. message title.
 *   timeOut: int. How long the toast will display without user interaction
 *   extendedTimeOut: int. How long the toast will display after a user hovers over it
 *   closeButton: bool.
 *   preventDuplicates: bool.
 *   showAnimation, hideAnimation: string. available options can be found in views/components/info/assets/toast-animate.css
 */

let toastTrigger = null
const toastList = []

export function toastInitializer(target) {
  toastTrigger = target
  for (const [msg, options] of toastList) {
    window.toast(msg, options)
  }
}

export function triggleToast(msg, options={}) {
  if (!msg) {
    return
  }
  if (!toastTrigger) {
    toastList.push([msg, options])
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
