import type { WebviewTag } from 'electron'
import { camelCase } from 'lodash'
import { useEffect } from 'react'
import type { CamelCase } from 'yargs'

export const webviewEvents = [
  'load-commit',
  'did-attach',
  'did-finish-load',
  'did-fail-load',
  'did-frame-finish-load',
  'did-start-loading',
  'did-stop-loading',
  'dom-ready',
  'console-message',
  'context-menu',
  'devtools-open-url',
  'devtools-opened',
  'devtools-closed',
  'devtools-focused',
  'will-navigate',
  'did-start-navigation',
  'did-redirect-navigation',
  'did-navigate',
  'did-frame-navigate',
  'did-navigate-in-page',
  'close',
  'render-process-gone',
  'plugin-crashed',
  'destroyed',
  'page-title-updated',
  'page-favicon-updated',
  'enter-html-full-screen',
  'leave-html-full-screen',
  'media-started-playing',
  'media-paused',
  'found-in-page',
  'did-change-theme-color',
  'update-target-url',
] as const

type EventName = typeof webviewEvents[number]
type HandlerName<T extends EventName> = CamelCase<`on-${T}`>

export type HandlerFields = {
  [key in HandlerName<EventName>]?: () => void
}

export const useWebviewEventListener = (
  eventName: EventName,
  handlers: HandlerFields,
  view?: WebviewTag,
) => {
  useEffect(() => {
    const handlerName = camelCase(`on-${eventName}`) as HandlerName<typeof eventName>
    const handler = handlers[handlerName]
    if (view && handler) {
      view.addEventListener(eventName, handler)
    }

    return () => {
      if (view && handler) {
        view.removeEventListener(eventName, handler)
      }
    }
  }, [eventName, handlers, view])
}
