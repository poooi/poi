path = require 'path-extra'
semver = require 'semver'
os = require 'os'

NOTIFY_DEFAULT_ICON = path.join(ROOT, 'assets', 'icons', 'icon.png')
NOTIFY_NOTIFICATION_API = true
if process.platform == 'win32' and semver.lt(os.release(), '6.2.0')
  NOTIFY_NOTIFICATION_API = false
notify_isPlayingAudio = {}
window.notify = (msg, options) ->
  # Notification config
  enabled = config.get('poi.notify.enabled', true)
  volume = config.get('poi.notify.volume', 0.8)
  title = 'poi'
  icon = NOTIFY_DEFAULT_ICON
  audio = config.get('poi.notify.audio', "file://#{ROOT}/assets/audio/poi.mp3")
  type = options?.type || "others"

  if type in ['construction', 'expedition', 'repair', 'morale']
    enabled = config.get("poi.notify.#{type}.enabled", enabled) if enabled
    audio = config.get("poi.notify.#{type}.audio", audio)
  else
    enabled = config.get("poi.notify.others.enabled", enabled) if enabled
  # Overwrite by options
  if options?
    title = options.title if options.title
    icon = options.icon if options.icon
    audio = options.audio if options.audio

  # Send desktop notification
  #   According to MDN Notification API docs: https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
  #   Parameter `sound` is not supported in any browser yet, so we play sound manually.
  return unless enabled
  if msg?
    if NOTIFY_NOTIFICATION_API
      new Notification title,
        icon: "file://#{icon}"
        body: msg
        silent: true
    else
      try
        appIcon.displayBalloon
          title: title
          icon: icon
          content: msg
        appIcon.on 'balloon-click', remote.getGlobal('mainWindow').focus

  if volume > 0.0001
    sound = new Audio(audio)
    sound.volume = volume
    sound.oncanplaythrough = ->
      if !notify_isPlayingAudio[type]
        notify_isPlayingAudio[type] = true
        sound.play()
    sound.onended = ->
      notify_isPlayingAudio[type] = false

modals = []
window.modalLocked = false
window.toggleModal = (title, content, footer) ->
  modals.push
    title: title
    content: content
    footer: footer
  window.showModal() if !window.modalLocked
window.showModal = ->
  return if modals.length == 0
  {title, content, footer} = modals.shift()
  event = new CustomEvent 'poi.modal',
    bubbles: true
    cancelable: true
    detail:
      title: title
      content: content
      footer: footer
  window.dispatchEvent event
