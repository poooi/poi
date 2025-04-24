import { Message, messageInstance } from 'views/components/info/alert'

const DEFAULT_STICKYFOR = 3 * 1000 // Milliseconds

function dispatchAlertEvent(value: Message) {
  messageInstance.emit(value)
}

const mkAlert = (type: string, priority: number) => (msg: string, options: Message['options']) => {
  const value = {
    content: msg,
    type,
    priority,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatchAlertEvent(value)
}

const log = mkAlert('default', 0)
const success = mkAlert('success', 1)
const warn = mkAlert('warning', 2)
const error = mkAlert('danger', 4)

// @ts-expect-error backward compatibility
window.log = log
// @ts-expect-error backward compatibility
window.success = success
// @ts-expect-error backward compatibility
window.warn = warn
// @ts-expect-error backward compatibility
window.error = error
