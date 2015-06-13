{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input} = ReactBootstrap
Divider = require './divider'
path = require 'path-extra'
{openExternal} = require 'shell'

Others = React.createClass
  render: ->
    <div>
      <Grid>
        <Col xs={12}>
          <h1> P O I </h1>
          <p>poi 基于 Electron 和 React.js 开发，是一个开源的跨平台舰队 Collection 浏览器。poi 的游戏行为与 Chrome 一致，原则上不提供任何影响收发包的功能。poi 仅提供基本浏览器功能，扩展功能请等待插件开发。</p>
          <p>开发讨论与意见交流群: 378320628 </p>
          <p>GitHub：<a onClick={openExternal.bind(@, 'https://github.com/yudachi/poi')}> https://github.com/yudachi/poi </a></p>
          <p>插件开发文档：<a onClick={openExternal.bind(@, 'https://github.com/yudachi/poi/blob/master/docs/plugin-cn.md')}> https://github.com/yudachi/poi/blob/master/docs/plugin-cn.md </a></p>
        </Col>
      </Grid>
      <Divider text="代理和缓存" />
      <Grid>
        <Col xs={12}>
          <b>使用岛风 go</b>
          <p>选择 HTTP 代理，地址 127.0.0.1，端口 8099（默认情况下）。使用岛风 go 可以不用配置缓存包和防猫，岛风 go 会完成这个。</p>
          <b>只使用岛风 go 缓存包</b>
          <p>将岛风 go 缓存包放在 {path.join(window.EXROOT, 'cache')} 下。</p>
          <b>使用 Shadowsocks</b>
          <p>使用内置 Shadowsocks 模块或 本地开启 Shadowsocks 后 使用 Socks5 代理设置。</p>
          <b>使用 VPN</b>
          <p>选择不使用代理即可。</p>
        </Col>
      </Grid>
      <Divider text="常用路径" />
      <Grid>
        <Col xs={12}>
          <ul>
            <li>岛风 go 缓存存放目录：{path.join(window.EXROOT, 'cache')}</li>
            <li>浏览器缓存目录：{window.APPDATA_PATH}</li>
            <li>插件存放目录：{path.join(window.EXROOT, 'plugins')} 和 {path.join(window.ROOT, 'plugins')}</li>
            <li>配置文件目录：{path.join(window.EXROOT, 'config.json')}</li>
            <li>poi 源代码目录：{window.ROOT}</li>
          </ul>
        </Col>
      </Grid>
      <Divider text="Contributors" />
      <Grid>
        <Col xs={12}>
          <ul>
            <li><a onClick={openExternal.bind(@, 'http://weibo.com/maginya')}> Magica </a></li>
            <li>myzWILLmake</li>
            <li>Chibaheit</li>
            <li>KochiyaOcean</li>
            <li>malichan</li>
          </ul>
        </Col>
      </Grid>
    </div>

module.exports = Others
