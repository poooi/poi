{React, ReactBootstrap} = window
{Alert, ProgressBar} = ReactBootstrap
__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

# Map Reminder
PoiMapReminder = React.createClass
  mapRanks: ['', ' 丙', ' 乙', ' 甲']
  getInitialState: ->
    battling: __ 'Not in sortie'
    mapHp: [0, 0]
  handleResponse: (e) ->
    reqPath = e.detail.path
    {body} = e.detail
    switch reqPath
      when '/kcsapi/api_port/port'
        @setState
          battling: __ 'Not in sortie'
          mapHp: [0, 0]
      when '/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'
        mapName = "#{body.api_maparea_id}-#{body.api_mapinfo_no} (#{body.api_no})"
        mapId = "#{body.api_maparea_id}#{body.api_mapinfo_no}"
        if window._eventMapRanks?[mapId]?
          mapName += @mapRanks[window._eventMapRanks[mapId]]
        hp = [0, 0]
        if body.api_eventmap?.api_now_maphp? and body.api_eventmap?.api_max_maphp?
          hp = [body.api_eventmap.api_now_maphp, body.api_eventmap.api_max_maphp]
        @setState
          battling: "#{__ 'Sortie area'}: #{mapName}"
          mapHp: hp
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <div>
      {
        if @state.mapHp[1] > 0
          <ProgressBar bsStyle="info" now={@state.mapHp[0]} max={@state.mapHp[1]} />
      }
      <Alert className={"alert-default"} bsStyle={null} >{@state.battling}</Alert>
    </div>

module.exports =
  PoiMapReminder: PoiMapReminder
