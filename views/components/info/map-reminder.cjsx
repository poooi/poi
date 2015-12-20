{React, ReactBootstrap} = window
{Alert} = ReactBootstrap
__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

# Map Reminder
PoiMapReminder = React.createClass
  getInitialState: ->
    battling: __ 'Not in sortie'
  mapRanks: ['', '丙', '乙', '甲']
  handleResponse: (e) ->
    reqPath = e.detail.path
    {body} = e.detail
    switch reqPath
      when '/kcsapi/api_port/port'
        @setState
          battling: __ 'Not in sortie'
      when '/kcsapi/api_req_map/start'
        txt = "#{__ 'Sortie area'}: #{body.api_maparea_id}-#{body.api_mapinfo_no}"
        mapId = "#{body.api_maparea_id}#{body.api_mapinfo_no}"
        if window._eventMapRanks?[mapId]?
          txt += " " + @mapRanks[window._eventMapRanks[mapId]]
        @setState
          battling: txt
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <Alert className={"alert-default"}  bsStyle={null}
        style={if !window.isDarkTheme then color: 'black' else color: 'white'}>
      {@state.battling}
    </Alert>

module.exports = 
  PoiMapReminder: PoiMapReminder
