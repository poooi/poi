import type { ConfigValue } from 'lib/config'

import * as remote from '@electron/remote'
import { get, memoize, throttle, debounce, pickBy } from 'lodash-es'
import { join } from 'path'

import { config } from './config'
import { ROOT } from './const'

const NOTIFY_DEFAULT_ICON = join(ROOT, 'assets', 'icons', 'icon.png')

function maybeFunctionString<T>(func: string | ((args: T | T[]) => string), args: T | T[]): string {
  if (typeof func === 'function') return func(args)
  return func
}

function defaultAs<T>(value: T | null | undefined, defaultValue: T, typeofReq?: string): T {
  if (value == null) return defaultValue
  if (typeofReq && typeof value !== typeofReq) return defaultValue
  return value
}

function nonNull<T extends object>(a: T): Partial<T> {
  return pickBy(a, (v) => v != null) as Partial<T>
}

const THROTTLE_TIME = 1000
const VOLUME_ZERO = 0.0001
const defaultNotifOptions = {
  title: 'poi',
  icon: NOTIFY_DEFAULT_ICON,
  audio: `file://${ROOT}/assets/audio/poi.mp3`,
  volume: config.get('poi.notify.volume', 0.8),
  type: 'others',
}

export interface NotifyOptions<T = unknown> {
  type?: keyof ConfigValue<'poi.notify'>
  title?: string | ((args: T | T[]) => string)
  message?: string | ((args: T | T[]) => string)
  args?: T
  groupKey?: unknown
  enabled?: boolean
  volume?: number
  silent?: boolean
  audio?: string
  icon?: string
}

interface GroupInfo<T = unknown> {
  notify?: ReturnType<typeof debounce>
  options?: NotifyOptions<T>
  buffer?: T[]
}

/* Options:
 * [Basic]
 *   type: string. Configs will be fetched from ''
 *   title: string or (([args]) => string)
 *   message: string or (([args]) => string)
 *   args: anything, will be passed to message function and title function
 *   groupKey: anything, when true and ===, will be grouped when called
 *     multiple times in a short time
 * [Read from config, but you can specify]
 *   enabled:
 *   volume: [0.0, 1.0]
 *   silent: Boolean, make volume always 0
 *   audio: file path (with file://)
 *   icon: file path
 */

class NotificationCenter {
  notify = <T = unknown>(o: NotifyOptions<T>) => {
    if (!('groupKey' in o) && 'type' in o) o = { ...o, groupKey: o.type }
    const notifyFunc = o.groupKey ? this._buildGroupedNotify<T>(o.groupKey) : this._doNotify<T>
    notifyFunc(o)
  }

  _buildGroupedNotify = memoize(<T>(_groupKey: unknown) => {
    const groupInfo: GroupInfo<T> = {}
    groupInfo.notify = debounce(this._groupedNotifyRun(groupInfo), THROTTLE_TIME)
    return this._groupedNotify(groupInfo)
  })

  _groupedNotify =
    <T = unknown>(info: GroupInfo<T>) =>
    (o: NotifyOptions<T> | undefined) => {
      if (!o) return
      info.options = {
        ...info.options,
        ...nonNull(o),
      }
      if (o.args != null) {
        info.buffer = (info.buffer || []).concat([o.args])
      }
      info?.notify?.()
    }

  _groupedNotifyRun =
    <T = unknown>(info: GroupInfo<T>) =>
    () => {
      const { title: titleFunc, message: messageFunc } = info.options ?? {}
      const title = titleFunc ? maybeFunctionString(titleFunc, info.buffer ?? []) : undefined
      const message = messageFunc ? maybeFunctionString(messageFunc, info.buffer ?? []) : undefined

      const options = info.options ?? {}
      if (title) options.title = title
      if (message) options.message = message
      this._doNotify(options)
      info.buffer = []
      info.options = {}
    }

  _doNotify = <T = unknown>(o: NotifyOptions<T>) => {
    const globalConfig = config.get('poi.notify')
    if (!get(globalConfig, 'enabled', true)) return
    const type = o.type || 'others'
    const typeConfig = o.type ? defaultAs(globalConfig?.[type], undefined, 'object') : {}
    if (!get(typeConfig, 'enabled', true)) return
    const mergedConfig = {
      ...defaultNotifOptions,
      ...nonNull(globalConfig ?? {}),
      ...nonNull(typeConfig ?? {}),
      ...nonNull(o),
    }
    const volume =
      get(globalConfig, 'volume', 1) *
      get(typeConfig, 'volume', 1) *
      (get(mergedConfig, 'silent', false) ? 0 : 1)
    const title = maybeFunctionString(mergedConfig.title, o.args ?? [])
    const message = mergedConfig.message
      ? maybeFunctionString(mergedConfig.message, o.args ?? [])
      : undefined
    if (message) {
      const currentNotif = new Notification(title, {
        icon: mergedConfig.icon,
        body: message,
        silent: true,
      })
      currentNotif.onclick = () => remote.getCurrentWindow().focus()
    }
    if (volume > VOLUME_ZERO) {
      const sound = new Audio(mergedConfig.audio as string)
      sound.volume = volume
      this._throttlePlaySound(type)(sound)
    }
  }

  _throttlePlaySound = memoize((_type: string) =>
    throttle((sound: HTMLAudioElement) => sound.play(), THROTTLE_TIME, {
      leading: true,
      trailing: false,
    }),
  )
}

const notifCenter = new NotificationCenter()

export default notifCenter

declare global {
  interface Window {
    /** @deprecated Use `import notifCenter from 'views/env-parts/notif-center'` and call `notifCenter.notify(...)` instead */
    notify: (
      msg: string,
      options?: { type?: keyof ConfigValue<'poi.notify'>; volume?: number },
    ) => void
  }
}

// Backward compatibility
window.notify = (
  msg: string,
  options?: { type?: keyof ConfigValue<'poi.notify'>; volume?: number },
) => {
  const opts: NotifyOptions = {
    ...options,
    message: msg,
    volume: config.get('poi.notify.volume', 0.8),
    type: options ? options.type || 'others' : undefined,
  }
  notifCenter.notify(opts)
}
