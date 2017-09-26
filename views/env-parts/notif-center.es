import path from 'path-extra'
import { remote } from 'electron'
import { get, memoize, throttle, debounce, pickBy } from 'lodash'

const {config, ROOT} = window
const NOTIFY_DEFAULT_ICON = path.join(ROOT, 'assets', 'icons', 'icon.png')

function maybeFunctionString(func, args) {
  if (typeof func === 'function')
    return func(args)
  return func
}

function defaultAs(val, defaultVal, typeofReq) {
  if (val == null)
    return defaultVal
  if (typeofReq && typeof val !== typeofReq)
    return defaultVal
  return val
}

function nonNull(a) {
  return pickBy(a, (v) => v != null)
}

const THROTTLE_TIME = 1000
const VOLUME_ZERO = 0.0001
const defaultNotifOptions = {
  title: 'poi',
  icon: NOTIFY_DEFAULT_ICON,
  audio: `file://${ROOT}/assets/audio/poi.mp3`,
  type: 'others',
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
  constructor() {
  }

  notify = (o) => {
    if (!('groupKey' in o) && ('type' in o))
      o = {...o, groupKey: o.type}
    const notifyFunc = o.groupKey ? this._buildGroupedNotify(o.groupKey) : this._doNotify
    notifyFunc(o)
  }

  _buildGroupedNotify = memoize((groupKey) => {
    const groupInfo = {}
    groupInfo.notify = debounce(this._groupedNotifyRun(groupInfo), THROTTLE_TIME)
    return this._groupedNotify(groupInfo)
  })

  // o: options
  _groupedNotify = (info) => (o) => {
    if (!o)
      return
    info.options = {
      ...info.options,
      ...nonNull(o),
    }
    info.buffer = (info.buffer || []).concat([o.args])
    info.notify()
  }

  _groupedNotifyRun = (info) => () => {
    const {title: titleFunc, message: messageFunc} = info.options
    const title = maybeFunctionString(titleFunc, info.buffer)
    const message = maybeFunctionString(messageFunc, info.buffer)

    const options = info.options
    if (title)
      options.title = title
    if (message)
      options.message = message
    this._doNotify(options)
    info.buffer = []
    info.options = {}
  }

  _doNotify = (o) => {
    const globalConfig = config.get(`poi.notify`, {})
    if (!get(globalConfig, 'enabled', true))
      return
    const type = o.type || 'others'
    const typeConfig = o.type ? defaultAs(globalConfig[type], {}, 'object') : {}
    if (!get(typeConfig, 'enabled', true))
      return
    const mergedConfig = {
      ...defaultNotifOptions,
      ...nonNull(globalConfig),
      ...nonNull(typeConfig),
      ...nonNull(o),
    }
    const volume = get(globalConfig, 'volume', 1) * get(typeConfig, 'volume', 1)
      * (get(mergedConfig, 'silent', false) ? 0 : 1)
    const title = mergedConfig.title
    const message = mergedConfig.message
    if (message){
      const currentNotif = new Notification (title, {
        icon: mergedConfig.icon,
        body: message,
        silent: true,
      })
      currentNotif.onclick = () => remote.getCurrentWindow().focus()
    }
    if (volume > VOLUME_ZERO) {
      const sound = new Audio(mergedConfig.audio)
      sound.volume = volume
      this._throttlePlaySound(type)(sound)
    }
  }

  _throttlePlaySound = memoize((type) =>
    throttle((sound) => sound.play(), THROTTLE_TIME, {leading: true, trailing: false})
  )
}

const notifCenter = new NotificationCenter()

export default notifCenter

// Backward compatibility
window.notify = (msg, options) => {
  options = {
    ...options,
    message: msg,
    volume: config.get('poi.notify.volume', 0.8),
    type: options ? (options.type || "others") : undefined,
  }
  notifCenter.notify(options)
}

