{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{config} = window
{Button, ButtonGroup, Input, OverlayTrigger, Tooltip} = ReactBootstrap
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
webview = $('kan-game webview')
getIcon = (status) ->
  switch status
    when -2
      <FontAwesome name='times' />
    when -1
      <FontAwesome name='arrow-right' />
    when 0
      <FontAwesome name='check' />
    when 1
      <FontAwesome name='spinner' spin />
NavigatorBar = React.createClass
  getInitialState: ->
    config.setDefault 'poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/'
    # Status
    # -1: Waiting
    # 0: Finish
    # 1: Loading
    navigateStatus: 1
    navigateUrl: config.get 'poi.homepage'
  handleSetUrl: (e) ->
    @setState
      navigateUrl: e.target.value
      navigateStatus: -1
  handleStartLoading: (e) ->
    @setState
      navigateStatus: 1
  handleStopLoading: ->
    @setState
      navigateStatus: 0
      navigateUrl: webview.getURL()
  handleFailLoad: ->
    @setState
      navigateStatus: -2
  handleNavigate: ->
    if @state.navigateUrl.substr(0,7).toLowerCase()!='http://'
      if @state.navigateUrl.substr(0,8).toLowerCase()!='https://'
        @state.navigateUrl = "http://#{@state.navigateUrl}"
    webview.src = @state.navigateUrl
  handleRefresh: ->
    webview.reload()
  handleRefreshFlash: ->
    webview.executeJavaScript """
      var doc;
      if (document.getElementById('game_frame')) {
        doc = document.getElementById('game_frame').contentDocument;
      } else {
        doc = document;
      }
      var flash = doc.getElementById('flashWrap');
      if(flash) {
        var flashInnerHTML = flash.innerHTML;
        flash.innerHTML = '';
        flash.innerHTML = flashInnerHTML;
      }
    """
  handlePressEnter: (e) ->
    if e.keyCode is 13
      @handleNavigate()
  handleSetHomepage: ->
    config.set 'poi.homepage', @state.navigateUrl
  handleGotoHomepage: ->
    @state.navigateUrl = config.get 'poi.homepage'
    @handleNavigate()
  componentDidMount: ->
    webview.addEventListener 'did-start-loading', @handleStartLoading
    webview.addEventListener 'did-stop-loading', @handleStopLoading
    webview.addEventListener 'did-fail-load', @handleFailLoad
  componentWillUnmount: ->
    webview.removeEventListener 'did-start-loading', @handleStartLoading
    webview.removeEventListener 'did-stop-loading', @handleStopLoading
    webview.removeEventListener 'did-fail-load', @handleFailLoad
  render: ->
    <div style={display: 'flex'}>
      <div style={flex: 1, marginLeft: 15, marginRight: 15}>
        <Input type='text' bsSize='small' placeholder={__ 'Input address'} value={@state.navigateUrl} onChange={@handleSetUrl} onKeyDown={@handlePressEnter}/>
      </div>
      <div style={flex: 'none', width: 110}>
        <ButtonGroup>
          <Button bsSize='small' bsStyle='primary' onClick={@handleNavigate}>{getIcon(@state.navigateStatus)}</Button>
          <Button bsSize='small' bsStyle='warning' onClick={@handleRefresh} onContextMenu={@handleRefreshFlash}><FontAwesome name='refresh' /></Button>
        </ButtonGroup>
        <ButtonGroup style={marginLeft: 5}>
          <OverlayTrigger placement='top' overlay={<Tooltip id='nav-homepage'>{__ 'Set as homepage'}</Tooltip>}>
            <Button bsSize='small' onClick={@handleSetHomepage} onContextMenu={@handleGotoHomepage}><FontAwesome name='bookmark' /></Button>
          </OverlayTrigger>
        </ButtonGroup>
      </div>
    </div>
module.exports = NavigatorBar
