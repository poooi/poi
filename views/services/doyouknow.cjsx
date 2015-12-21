__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

INTERVAL = config.get('poi.doyouknow.interval', 600) # seconds, time for a new tip
STICKY_TIME = 10 # seconds, time that the tip can't be refreshed by a "default"
PREFIX = __ "doyouknow-prefix"

update = (list) ->
  return if !config.get('poi.doyouknow.enabled', true)
  console.log "Another doyouknow"
  # Post a random tip
  window.log PREFIX+list[Math.floor(Math.random() * list.length)],
    priority: 1
    stickyFor: STICKY_TIME*1000
  # Reinvoked after certain interval
  setTimeout update, INTERVAL*1000, list

firstUpdate = ->
  document.removeEventListener 'DOMContentLoaded', firstUpdate
  list = (text for text in __ 'doyouknow-contents' when text)
  if list
    # Delay for a period b/c the alert region may not properly detect its width
    setTimeout update, 1000, list

document.addEventListener 'DOMContentLoaded', firstUpdate
