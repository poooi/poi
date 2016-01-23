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
    nowArea: 0
    nowMap: 0
    nowNode: 0
  handleResponse: (e) ->
    reqPath = e.detail.path
    {body} = e.detail
    switch reqPath
      when '/kcsapi/api_port/port'
        @setState
          battling: __ 'Not in sortie'
          mapHp: [0, 0]
      when '/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'
        if window._eventMapRanks?[mapId]?
          mapRank = @mapRanks[window._eventMapRanks[mapId]]
          mapName = "#{body.api_maparea_id}-#{body.api_mapinfo_no} #{mapRank}"
        else
          mapName = "#{body.api_maparea_id}-#{body.api_mapinfo_no}"
        mapId = "#{body.api_maparea_id}#{body.api_mapinfo_no}"
        hp = [0, 0]
        if body.api_eventmap?.api_now_maphp? and body.api_eventmap?.api_max_maphp?
          hp = [body.api_eventmap.api_now_maphp, body.api_eventmap.api_max_maphp]
        @setState
          battling: "#{__ 'Sortie area'}: #{mapName}"
          mapHp: hp
          nowArea: body.api_maparea_id
          nowMap: body.api_mapinfo_no
          nowNode: body.api_no
      when '/kcsapi/api_req_sortie/battle'
        if window._eventMapRanks?[mapId]?
          mapRank = @mapRanks[window._eventMapRanks[mapId]]
          mapName = mapName = "#{@state.nowArea}-#{@state.nowMap} #{mapRank} (#{@state.nowNode})"
        else
          mapName = mapName = "#{@state.nowArea}-#{@state.nowMap} (#{@state.nowNode})"
        @setState
          battling: "#{__ 'Sortie area'}: #{mapName}"
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
