import path from 'path-extra'
import semver from 'semver'
import os from 'os'
import { remote } from 'electron'
import { throttle } from 'lodash'

const {config, appIcon, ROOT} = window

const NOTIFY_DEFAULT_ICON = path.join(ROOT, 'assets', 'icons', 'icon.png')
let NOTIFY_NOTIFICATION_API = true
if (process.platform === 'win32' && semver.lt(os.release(), '6.2.0')) {
  NOTIFY_NOTIFICATION_API = false
}

const playAudio = (sound) => {
  sound.play()
}

const playAudioDedupedByType = {
  construction: throttle(playAudio, 1000, { leading: true, trailing: false }),
  expedition: throttle(playAudio, 1000, { leading: true, trailing: false }),
  repair: throttle(playAudio, 1000, { leading: true, trailing: false }),
  morale: throttle(playAudio, 1000, { leading: true, trailing: false }),
  others: throttle(playAudio, 1000, { leading: true, trailing: false }),
}

window.notify = (msg, options) => {
  // Notification config
  let enabled = config.get('poi.notify.enabled', true)
  const volume = config.get('poi.notify.volume', 0.8)
  let title = 'poi'
  let icon = NOTIFY_DEFAULT_ICON
  let audio = config.get('poi.notify.audio', `file://${ROOT}/assets/audio/poi.mp3`)
  const type = (options || {}).type || "others"

  if (['construction', 'expedition', 'repair', 'morale'].includes(type)) {
    if (enabled) {
      enabled = config.get(`poi.notify.${type}.enabled`, enabled)
    }
    audio = config.get(`poi.notify.${type}.audio`, audio)
  } else {
    if (enabled) {
      enabled = config.get("poi.notify.others.enabled", enabled)
    }
  }
  // Overwrite by options
  if (typeof options === 'object') {
    if (options.title) {
      title = options.title
    }
    if (options.icon) {
      icon = options.icon
    }
    if (options.audio) {
      audio = options.audio
    }
  }
  // Send desktop notification
  //   According to MDN Notification API docs: https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
  //   Parameter `sound` is not supported in any browser yet, so we play sound manually.
  if (!enabled) {
    return
  }
  if (msg){
    if (NOTIFY_NOTIFICATION_API) {
      new Notification (title, {
        icon: `file://${icon}`,
        body: msg,
        silent: true,
      })
    } else{
      try {
        appIcon.displayBalloon({
          title: title,
          icon: icon,
          content: msg,
        })
        appIcon.on('balloon-click', remote.getGlobal('mainWindow').focus)
      } catch (e) {
        console.error(e.stack)
      }
    }
  }
  if (volume > 0.0001) {
    const sound = new Audio(audio)
    sound.volume = volume
    playAudioDedupedByType[type](sound)
  }
}

const modals = []
window.modalLocked = false
window.toggleModal = (title, content, footer) =>{
  modals.push({
    title: title,
    content: content,
    footer: footer,
  })
  if (!window.modalLocked) {
    window.showModal()
  }
}
window.showModal = () => {
  if (modals.length === 0) {
    return
  }
  const {title, content, footer} = modals.shift()
  event = new CustomEvent('poi.modal', {
    bubbles: true,
    cancelable: true,
    detail: {
      title: title,
      content: content,
      footer: footer,
    },
  })
  window.dispatchEvent(event)
}
