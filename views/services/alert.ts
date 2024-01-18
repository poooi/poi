import { Message, messageInstance } from 'views/components/info/alert'

const DEFAULT_STICKYFOR = 3 * 1000 // Milliseconds

function dispatchAlertEvent(value: Message) {
  messageInstance.emit(value)
}

const log = (msg: string, options: Partial<Message>) => {
  const value = {
    content: msg,
    type: 'default',
    priority: 0,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
const success = (msg: string, options: Partial<Message>) => {
  const value = {
    content: msg,
    type: 'success',
    priority: 1,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
const warn = (msg: string, options: Partial<Message>) => {
  const value = {
    content: msg,
    type: 'warning',
    priority: 2,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}
const error = (msg: string, options: Partial<Message>) => {
  const value = {
    content: msg,
    type: 'danger',
    priority: 4,
    stickyFor: DEFAULT_STICKYFOR,
    ...options,
  }
  dispatchAlertEvent(value)
}

// @ts-expect-error backward compatibility
window.log = log
// @ts-expect-error backward compatibility
window.success = success
// @ts-expect-error backward compatibility
window.warn = warn
// @ts-expect-error backward compatibility
window.error = error
