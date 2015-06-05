{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input} = ReactBootstrap
webview = $('kan-game webview')
getIcon = (status) ->
  switch status
    when -1
      <FontAwesome name='arrow-right' />
    when 0
      <FontAwesome name='check' />
    when 1
      <FontAwesome name='spinner' spin />
NavigatorBar = React.createClass
  getInitialState: ->
    # Status
    # -1: Waiting
    # 0: Finish
    # 1: Loading
    navigateStatus: 1
    navigateUrl: webview.getUrl()
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
      navigateUrl: webview.getUrl()
  handleNavigate: ->
    webview.src = @state.navigateUrl
  handleRefresh: ->
    webview.reload()
  componentDidMount: ->
    webview.addEventListener 'did-start-loading', @handleStartLoading
    webview.addEventListener 'did-stop-loading', @handleStopLoading
  componentWillUmount: ->
    webview.removeEventListener 'did-start-loading', @handleStartLoading
    webview.removeEventListener 'did-stop-loading', @handleStopLoading
  render: ->
    <Grid>
      <Col xs={8}>
        <Input type='text' bsSize='small' placeholder='输入网页地址' value={@state.navigateUrl} onChange={@handleSetUrl} />
      </Col>
      <Col xs={4}>
        <ButtonGroup>
          <Button bsSize='small' bsStyle='primary' onClick={@handleNavigate}>{getIcon(@state.navigateStatus)}</Button>
          <Button bsSize='small' bsStyle='warning' onClick={@handleRefresh}><FontAwesome name='refresh' /></Button>
        </ButtonGroup>
      </Col>
    </Grid>
module.exports = NavigatorBar
