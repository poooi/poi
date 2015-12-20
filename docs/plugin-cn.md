# 插件开发指南

poi 基于 Web 技术开发，所有的 UI 和逻辑都是使用 Web 技术完成的。所以在开发插件之前，应该下列的技术有个大概的了解。

+ 基本的 HTML，CSS 和 JavaScript
+ [React.js](http://facebook.github.io/react/)
+ [Node.js](https://nodejs.org)
+ [Electron](https://github.com/atom/electron)

为了有更好的开发体验，最好对下列技术有个基本的了解。

+ [CoffeeScript](http://coffeescript.org)
+ [CoffeeReact](https://github.com/jsdf/coffee-react)
+ [ReactBootstrap](http://react-bootstrap.github.io/components.html)

## 插件的基本结构
poi 的文件目录大概是以下的样子。
```
appData
  |-- plugins
        |--node_modules
            |-- plugin1
                  |-- index.js
                  |-- ...
                  |-- ...
            |-- plugin2
                  |-- index.cjsx
                  |-- ...
                  |-- ...
            |-- plugin3
                  |-- index.coffee
```
在启动的时候，poi 会寻找 appData/plugins/node_modules 目录下的所有名字以 `poi-plugin-` 开头的文件夹，并尝试以插件的方式将其载入。

一个插件只需要有基本的 index 就可以被载入，index 可以是 index.js，index.coffee 或者 index.cjsx。

## index 的基本属性
index 可以需要以 export 的方式向外暴露以下属性，下面列出的所有属性以及对应的类型。类型为 `String | ReactElement` 表示如果是 String 类型则直接显示，ReactElement 会被 React 渲染。
```javascript
module.exports = {
  name: String // 插件的英文名
  displayName: String | ReactElement // 插件在界面显示时的名字
  priority: Number // 插件在菜单里排序的优先级，值越小插件就会显示在越前
  show: Boolean // 插件是否应该被显示
  realClose: Boolean // 窗口插件在关闭时是否完全终结进程，默认为否
  author: String | ReactElement // 插件作者
  link: String // 插件作者的链接
  description: String | ReactElement // 插件基本描述
  version: String | ReactElement // 插件版本
  reactClass: ReactClass // 插件的视图和逻辑，将会渲染进 poi 插件面板里，使用 React.createClass 生成
  handleClick: Function // 如果插件拥有这个属性，那么它的 reactClass 属性会被忽略，并且不会在插件面板里，你可以指定用户点击菜单时的反馈（比如新建窗口等）。
};
```

比如，需要编写一个点击后跳到新面板的插件。
```javascript
module.exports = {
  name: 'Sample',
  displayName: 'Sample',
  reactClass: React.createClass({
    render: function() {
      return React.createElement('h1', null, 'It works');
    }
  })
};
```
当然，可以用 jsx，cjsx 等简化其语法，下列例子将会大部分使用 cjsx，比如上面这个插件等价为。
```coffeescript
module.exports =
  name: 'Sample'
  displayName: 'Sample'
  reactClass: React.createClass
    render: ->
      <h1>It works</h1>
```
在 index 中，以下所有接口都是可用的。

+ HTML DOM API
+ Chrome 43 的浏览器 JavaScript
+ Node.js 的所有功能
+ poi 暴露出的 API

## poi 暴露的 API

poi 基本开发环境与环境变量。
```javascript
window =
  React // React
  ReactBootstrap // React Bootstrap
  FontAwesome // React FontAwesome
  jQuery // jQuery，如果不是特别必要，不建议使用
  _ // Underscore
  $ // 等价于 document.querySelector
  $$ // 等价于 document.querySelectorAll
  ROOT // poi 代码根目录，即 package.json 和 index.html 所在目录
  APPDATA_PATH // 可以用于存放用户数据的目录，Windows 上是 %AppData%/poi，Linux 上是 ~/.config/poi
  POI_VERSION // poi 版本号
```

poi 以全局的方式暴露游戏资料相关的 API，可以在 window 中直接获得以下资料。

```javascript
window =
  // $ 开头的是游戏基本数据，和玩家无关
  $ships: Array // 游戏中所有舰船的基本资料，和游戏中的消息包一致，以 api_id 为 index。
  $shipTypes: Array // 游戏中所有舰种的基本资料，和游戏中的消息包一致，以 api_id 为 index。
  $slotitems: Array // 游戏中所有装备的基本资料，和游戏中的消息包一致，以 api_id 为 index。
  $mapareas: Array // 游戏中所有海域的基本资料，和游戏中的消息包一致，以 api_id 为 index。
  $maps: Array // 游戏中所有地图的基本资料，和游戏中的消息包一致，以 api_id 为 index。
  $missions: Array // 游戏中所有远征的基本资料，和游戏中的消息包一致，以 api_id 为 index。
  // _ 开头的是玩家相关的数据
  _ships: Object // 玩家的所有舰船，以 api_id 为 key。
  _slotitems: Object // 玩家的所有装备，以 api_id 为 key。
  _decks: Array // 玩家目前的编队信息。
```

poi 以全局事件的方式暴露游戏的通讯信息，可以通过 window.addEventListener 获得每次游戏请求的发包收包信息。

```javascript
window.addEventListener('game.request', function (e) {
  e.detail.method // HTTP 方法(POST / GET)
  e.detail.path // API 路径
  e.detail.body // 发送的数据包
});
window.addEventListener('game.response', function (e) {
  e.detail.method // HTTP 方法(POST / GET)
  e.detail.path // API 路径
  e.detail.body // 返回的数据包
  e.detail.postBody // 发送的数据包
});
```

poi 用户通知相关 API。

```javascript
window.log('Something'); // 显示在游戏窗口下方的信息条
window.warn('Something'); // 显示在游戏窗口下方的信息条
window.error('Something'); // 显示在游戏窗口下方的信息条
window.success('Something'); // 显示在游戏窗口下方的信息条
window.notify('Something'); // 桌面通知，Windows 上由于 Electron 的原因未实现
window.toggleModal('Title', 'Content'); // 显示模态框，Content 可以是 HTML 文档
// 如果需要在模态框下自定义按钮
var footer = {
  name: String, // 按钮显示的名字
  func: Function, // 点击按钮后的动作
  style: String in ['default', 'primary', 'success', 'info', 'danger', 'warning'] // 颜色
}
window.toggleModal('Title', 'Content', footer);
```

poi 用户设置相关 API。
```javascript
window.config.get('path.to.config', 'default'); // 获取某个用户设置值，获取失败返回默认值
window.config.set('path.to.config', 'some value'); // 保存某个用户设置值
window.layout // 目前的布局，'horizontal' || 'vertical'
window.theme // 目前使用的主题
```
## 窗口插件开发

使用 windowManager 来创建新窗口。关于 createWindow 的更多说明，参考 Electron 的 [BrowserWindow 中的 new 方法](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#new-browserwindowoptions)。

index.cjsx
```coffeescript
{remote} = require 'electron'
windowManager = remote.require './lib/window'

window.pluginWindow = null // 保留一个全局引用防止 pluginWindow 被 gc
initialPluginWindow = ->
  window.pluginWindow = windowManager.createWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: 820
    height: 650
  window.pluginWindow.loadURL "file://#{__dirname}/index.html"
initialItemImprovementWindow()

module.exports =
  name: 'Sample'
  displayName: 'Sample'
  handleClick: ->
    window.pluginWindow.show()
```
index.html
```html
<html><body><h1>It works</h1></body></html>
```

由于新建窗口时的新进程和主进程环境变量有所不同，可以引用此段 javascript 以加载与主程序相同的环境变量。

env-loader.js
```javascript
window.remote = require('electron').remote;
window.ROOT = remote.getGlobal('ROOT');
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH');
window.POI_VERSION = remote.getGlobal('POI_VERSION');
window.SERVER_HOSTNAME = remote.getGlobal('SERVER_HOSTNAME');
window.MODULE_PATH = remote.getGlobal('MODULE_PATH');
require('module').globalPaths.push(MODULE_PATH);
require(ROOT + "/components/coffee-script/extras/coffee-script.js");
```

## i18n

poi 内置了 i18n-2 模组以进行多语言翻译

建议将将要初始化的 i18n object 附着到 window.i18n 下，如下所示：

```coffeescript
window.i18n.pluginName = new (require 'i18n-2')
  locales:['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  directory: path.join(__dirname, 'i18n'),
  updateFiles: false,
  indent: "\t",
  extension: '.json'
  devMode: false
window.i18n.pluginName.setLocale(window.language)
__ = i18n.pluginName.__.bind(i18n.pluginName)
__n = i18n.pluginName.__n.bind(i18n.pluginName)
```

在相应目录放置翻译文件之后就可以通过如下方法来获得翻译了

```coffeescript
translated = __ 'to translate'
```

关于 i18n-2 模组的详细使用方法请参照 [i18n-2](https://github.com/jeresig/i18n-node-2) 的文档

对于游戏内资源的翻译，poi 预置了一个翻译方法，对于非新窗口插件，可以通过如下方法调用

```coffeescript
resource = window.i18n.resources.__ 'to translate'
```

对于新窗口插件，需要调用相应插件

```coffeescript
if !window.i18n?
  window.i18n = {}
window.i18n.resources = {}
window.i18n.resources.__ = (str) -> return str
window.i18n.resources.translate = (locale, str) -> return str
window.i18n.resources.setLocale = (str) -> return # poi-plugin-translator 不存在时返回原值，如果 require 了 ROOT/view/env 则不需要此项目

try
  Translator = require 'poi-plugin-translator'
catch error
  console.log error

resource = window.i18n.resources.__ 'to translate'
```

## 在 [npm](http://npmjs.org) 上发布

在 npm 上发布不仅可以使得版本维护更加简便，而且 poi 将会用重载的 npm 模组进行新版本插件的更新。

详情请参照 npm 关于 [package.json](https://docs.npmjs.com/files/package.json) 和 [npm publish](https://docs.npmjs.com/cli/publish) 的文档

注意包名应该以 `poi-plugin-` 开头以便其被 poi 发现

## 插件安装包的打包方法

对于网络情况诡异或不熟悉npm命令又希望使用第三方插件的用户，基于npm对tar.gz格式本地安装包的支持，poi 提供了从本地插件安装包安装的方式。

由于npm i命令仅支持 tar.gz格式的安装包，必须将插件打包成tar.gz格式。

参考命令如下

```
cd path/to/[repo] && npm i
cd .. && tar cvf [repo] [repo].tar.gz
```

## 一些提示

+ 面板中显示的插件会被包裹在`<div id='插件名' />` 中，所以在自定义 CSS 中，建议用 `#插件名` 保证不影响全局 CSS。
+ 设置环境变量 DEBUG，可以开启调试模式。

## 实例参考

poi 的所有内置组件和 plugins 以一样的方式组织，在 poi 代码的 views/componets 下可以看到他们的代码。

在 poooi(https://github.com/poooi) 下有很多可以参考的插件。
