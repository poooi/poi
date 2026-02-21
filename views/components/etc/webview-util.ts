import type { WebviewTag } from 'electron'

import { camelCase } from 'lodash'
import { useEffect } from 'react'

// Local CamelCase type to convert kebab-case event names to camelCase handler names
// e.g., 'load-commit' → 'onLoadCommit', 'did-finish-load' → 'onDidFinishLoad'
type CamelCase<S extends string> = S extends `${infer T}-${infer U}${infer V}`
  ? `${T}${Uppercase<U>}${CamelCase<V>}`
  : S
type HandlerName<T extends string> = CamelCase<`on-${T}`>

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

type EventName = (typeof webviewEvents)[number]

// HandlerFields uses CamelCase to map event names to their handler names
// e.g., 'load-commit' → 'onLoadCommit'
export type HandlerFields = {
  [K in EventName as HandlerName<K>]?: () => void
}

export const useWebviewEventListener = (
  eventName: EventName,
  handlers: HandlerFields,
  view?: WebviewTag,
) => {
  // camelCase returns string, but HandlerFields has specific keys
  // We use a type-safe index access pattern
  const handlerName = camelCase(`on-${eventName}`)
  const handler = (handlers as Record<string, (() => void) | undefined>)[handlerName]

  useEffect(() => {
    if (view && handler) {
      view.addEventListener(eventName, handler)
    }

    return () => {
      if (view && handler) {
        view.removeEventListener(eventName, handler)
      }
    }
  }, [eventName, handler, view])
}
