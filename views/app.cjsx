fs = require 'fs-extra'
path = require 'path-extra'
{ROOT, EXROOT, _, $, $$, React, ReactDOM} = window
{config, toggleModal} = window

__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

# Set zoom level
document.getElementById('poi-app-container').style.transformOrigin = '0 0'
document.getElementById('poi-app-container').style.WebkitTransform = "scale(#{window.zoomLevel})"
document.getElementById('poi-app-container').style.width = "#{Math.floor(100 / window.zoomLevel)}%"

# Hackable panels
window.hack = {}

# Module path
require('module').globalPaths.push(path.join(ROOT, "node_modules"))

# poi menu
if process.platform == 'darwin'
  require './components/etc/mac-menu'

# Main tabbed area
ControlledTabArea =
  if config.get('poi.tabarea.double', false)
    require './double-tabareas'
  else
    require './single-tabarea'

{PoiAlert} = require './components/info/alert'
{PoiMapReminder} = require './components/info/map-reminder'
{PoiControl} = require './components/info/control'
{ModalTrigger} = require './components/etc/modal'

# Custom css injector
CustomCssInjector = React.createClass
  render: ->
    cssPath = path.join window.EXROOT, 'hack', 'custom.css'
    fs.ensureFileSync cssPath
    <link rel='stylesheet' id='custom-css' href={cssPath} />

ReactDOM.render <PoiAlert id='poi-alert' />, $('poi-alert')
ReactDOM.render <PoiMapReminder id='poi-map-reminder'/>, $('poi-map-reminder')
ReactDOM.render <PoiControl />, $('poi-control')
ReactDOM.render <ModalTrigger />, $('poi-modal-trigger')
ReactDOM.render <ControlledTabArea />, $('poi-nav-tabs')
ReactDOM.render <CustomCssInjector />, $('poi-css-injector')

# Readme contents
dontShowAgain = ->
  config.set('poi.first', POI_VERSION)
if config.get('poi.first', '0.0.0') != POI_VERSION
  title = 'README'
  content =
    <div>
      <p>诶嘿！欢迎使用 poi v{POI_VERSION}！使用之前看看下面！</p>
      <p style={color: '#FFCCFF', fontWeight: 'bold', fontSize: 'large'}>poi 不会修改任何游戏内的发包与收包，但是请使用可信的 poi 版本和可信的插件！</p>
      <p>poi 默认不使用代理。更改代理的设置在设置面板中可以找到。
      <ul>
        <li>使用岛风go的选择HTTP代理，地址是127.0.0.1，端口8099。（默认情况下）</li>
        <li>使用自己本地的Shadowsocks或者Socks5代理的选择Socks5代理。</li>
        <li>使用VPN的选择不使用代理就好了。</li>
      </ul></p>
      <p>poi 如果有显示错误，可以手动调整一下内容大小，布局会自动适配。</p>
      <p>如果 poi 的运行不流畅，可以在设置中关闭一部分插件，对插件的操作重启后生效。</p>
      <p>更多帮助参考 poi wiki - https://github.com/poooi/poi/wiki </p>
      <p>poi 交流群：378320628</p>
      <p>为 poi 贡献代码和编写插件 - GitHub: https://github.com/poooi/poi </p>
    </div>
  footer = [
    name: __ 'I know'
    func: dontShowAgain
    style: 'success'
  ]
  window.toggleModal title, content, footer

refreshFlash = ->
  $('kan-game webview').executeJavaScript """
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
# F5 & Ctrl+F5 & Alt+F5
window.addEventListener 'keydown', (e) ->
  if process.platform == 'darwin' and e.keyCode is 82 and e.metaKey
    if e.shiftKey # cmd + shift + r
      $('kan-game webview').reloadIgnoringCache()
    else if e.altKey # cmd + alt + r
      refreshFlash()
    else # cmd + r
      # Catched by menu
      # $('kan-game webview').reload()
      false
  else if e.keyCode is 116
    if e.ctrlKey # ctrl + f5
      $('kan-game webview').reloadIgnoringCache()
    else if e.altKey # alt + f5
      refreshFlash()
    else if !e.metaKey # f5
      $('kan-game webview').reload()

# Confirm before quit
confirmExit = false
exitPoi = ->
  confirmExit = true
  window.close()
window.onbeforeunload = (e) ->
  if confirmExit || !config.get('poi.confirm.quit', false)
    e.returnValue = true
  else
    toggleModal __('Exit'), __('Confirm?'), [
      name: __ 'Confirm'
      func: exitPoi
      style: 'warning'
    ]
    e.returnValue = false
