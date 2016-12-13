{success, warn} = window
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

showItemDevResultDelay = if window.config.get('poi.delayItemDevResult', false) then 6200 else 500

window.addEventListener 'game.response', 
  ({detail: {path, body}}) ->
    if path == '/kcsapi/api_req_kousyou/createitem'
      if body.api_create_flag == 0
        setTimeout warn.bind([], __("The development of %s was failed.",
          "#{window.i18n.resources.__ $slotitems[parseInt(body.api_fdata.split(',')[1])].api_name}")),
          showItemDevResultDelay
      else if body.api_create_flag == 1
        setTimeout success.bind([], __("The development of %s was successful.",
          "#{window.i18n.resources.__ $slotitems[body.api_slot_item.api_slotitem_id].api_name}")),
          showItemDevResultDelay

