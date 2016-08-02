const __ = window.i18n.others.__.bind(window.i18n.others)

function onResponse(e) {
  if (e.detail.path == '/kcsapi/api_req_hokyu/charge') {
    if (window.config.get('feature.resupply-bauxite.enable', true)) {
      const {api_use_bou} = e.detail.body
      if (api_use_bou != 0)
        window.success(__('Resupply cost %d bauxite', api_use_bou))
    }
  }
}

window.addEventListener('game.response', onResponse)

