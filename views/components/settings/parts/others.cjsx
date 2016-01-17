{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT, POI_VERSION, CONST} = window
{Grid, Col, Button, ButtonGroup, Input} = ReactBootstrap
Divider = require './divider'
path = require 'path-extra'
{openExternal} = require 'shell'
__ = i18n.setting.__.bind(i18n.setting)

Others = React.createClass
  openLink: (lnk, e) ->
    openExternal lnk
    e.preventDefault()
  render: ->
    <div id='poi-others'>
      <Grid>
        <Col xs={12}>
          <img src="file://#{ROOT}/assets/img/logo.png" style={width: '100%'} />
          <p>{__ "poi-description %s %s", POI_VERSION, process.versions.electron}</p>
          {
            if window.language is "zh-CN" || window.language is "zh-TW"
              [
                <p>微博: <a onClick={@openLink.bind(@, 'http://weibo.com/letspoi')}> @ 今天 poi 出新版本了吗 </a></p>
                <p>开发讨论与意见交流群: 378320628 </p>
              ]
          }
          <p>{__ "Database"}:<a onClick={@openLink.bind(@, 'http://db.kcwiki.moe')}> http://db.kcwiki.moe </a></p>
          <p>{__ "Wiki"}: <a onClick={@openLink.bind(@, 'https://github.com/poooi/poi/wiki')}> https://github.com/poooi/poi/wiki </a></p>
          <p>GitHub：<a onClick={@openLink.bind(@, 'https://github.com/poooi/poi')}> https://github.com/poooi/poi </a></p>
        </Col>
      </Grid>
      <Divider text="Contributors" />
      <Grid>
      {
        for e, i in CONST.contributors
          <Col xs={2} key={i}>
            <img className="avatar-img" src={e.avatar} onClick={@openLink.bind(@, e.link)} title={e.name} />
          </Col>
      }
      </Grid>
    </div>

module.exports = Others
