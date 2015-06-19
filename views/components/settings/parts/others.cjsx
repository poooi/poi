{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input} = ReactBootstrap
Divider = require './divider'
path = require 'path-extra'
{openExternal} = require 'shell'

Others = React.createClass
  render: ->
    <div id='poi-others'>
      <Grid>
        <Col xs={12}>
          <img src="file://#{ROOT}/assets/img/logo.png" style={width: '100%'} />
          <p>poi 基于 Electron 和 React.js 开发，是一个开源的跨平台舰队 Collection 浏览器。poi 的游戏行为与 Chrome 一致，原则上不提供任何影响收发包的功能。poi 仅提供基本浏览器功能，扩展功能请等待插件开发。</p>
          <p>开发讨论与意见交流群: 378320628 </p>
          <p>GitHub：<a onClick={openExternal.bind(@, 'https://github.com/yudachi/poi')}> https://github.com/yudachi/poi </a></p>
        </Col>
      </Grid>
      <Divider text="Contributors" />
      <Grid>
        <Col xs={12}>
          <ul>
            <li><a onClick={openExternal.bind(@, 'http://www.pixiv.net/member.php?id=3991162')}> Season千 </a></li>
            <li><a onClick={openExternal.bind(@, 'http://weibo.com/maginya')}> Magica </a></li>
            <li><a onClick={openExternal.bind(@, 'http://weibo.com/myzwillmake')}> Yunze </a></li>
            <li><a onClick={openExternal.bind(@, 'http://weibo.com/chibaheit')}> Chibaheit </a></li>
            <li><a onClick={openExternal.bind(@, 'http://www.kochiyaocean.org')}> KochiyaOcean </a></li>
            <li><a onClick={openExternal.bind(@, 'http://www.weibo.com/1791427467')}> 马里酱 </a></li>
          </ul>
        </Col>
      </Grid>
    </div>

module.exports = Others
