import type { Message } from 'views/components/info/alert'

import { messageInstance } from 'views/components/info/alert'

const DEFAULT_STICKYFOR = 3 * 1000 // Milliseconds

function dispatchAlertEvent(value: Message) {
  messageInstance.emit(value)
}

const mkAlert = (type: string, priority: number) => (msg: string, options?: Message['options']) => {
  const value = {
    content: msg,
    type,
    priority,
    stickyFor: DEFAULT_STICKYFOR,
    options,
  }
  dispatchAlertEvent(value)
}

export const log = mkAlert('default', 0)
export const success = mkAlert('success', 1)
export const warn = mkAlert('warning', 2)
export const error = mkAlert('danger', 4)

declare global {
  interface Window {
    /** @deprecated Use `import { log } from 'views/services/alert'` instead */
    log: typeof log
    /** @deprecated Use `import { success } from 'views/services/alert'` instead */
    success: typeof success
    /** @deprecated Use `import { warn } from 'views/services/alert'` instead */
    warn: typeof warn
    /** @deprecated Use `import { error } from 'views/services/alert'` instead */
    error: typeof error
  }
}

window.log = log
window.success = success
window.warn = warn
window.error = error
