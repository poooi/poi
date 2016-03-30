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
                  |-- package.json
                  |-- ...
            |-- plugin2
                  |-- index.cjsx
                  |-- package.json
                  |-- ...
            |-- plugin3
                  |-- index.coffee
                  |-- package.json
                  |-- ...
            |-- plugin4
                  |-- index.es
                  |-- package.json
                  |-- ...
```
在启动的时候，poi 会寻找 `appData/plugins/node_modules` 目录下的所有名字以 `poi-plugin-` 开头的文件夹，并尝试以插件的方式将其载入。此处 `appData` 为用于存放用户数据的目录，OS X 上是 `$HOME/Library/Application Support/poi`，Windows 上是 `%AppData%/poi`，其他类 unix 操作系统上是 `~/.config/poi`

一个插件只需要有基本的 index 就可以被载入，index 可以是 `index.js`，`index.coffee`, `index.cjsx` 或者 `index.es`。

## plugin.json 的基本属性
插件的实质是一个 Node Module。每个插件都应该在根目录下放置一个 `package.json` 文件以存储基本数据，详细参照关于 [package.json](https://docs.npmjs.com/files/package.json) 的文档

除了基本的 `package.json` 字段，还应该具备一个 `poiPlugin` 字段以存储插件信息。

键值如下
```javascript
"poiPlugin": {
  "title": String, // 插件的名字，如果有翻译文件将会自动翻译为相应语言
  "id": String // 用于辨别插件身份的键值，留空则默认为插件的包名
  "priority": Number, // 插件在菜单里排序的优先级，值越小插件就会显示在越前
  "description": String, // 插件基本描述，如果有翻译文件将会自动翻译为相应语言
  "icon": String, // 用于插件列表中的图标名。字符串中没有"/"时默认为 FontAwesome
  "earliestCompatibleMain": Semver, // 兼容的最低 poi 版本
  "lastApiVer": Semver, // 在不兼容的时候回滚的目标版本号
  "i18nDir": String,  // 可选, i18n 文件的自定义目录相对路径，留空时会在 i18n 及 assets/i18n 下确认是否有翻译文件。详情见下
}
```

一个示例的 `package.json` 文件如下
```javascript
{
  "name": "poi-plugin-translator",
  "version": "0.2.4",
  "main": "index.cjsx",
  "author": {
    "name": "KochiyaOcean",
    "url": "https://github.com/kochiyaocean"
  },
  "poiPlugin": {
    "title": "Translator",
    "description": "Translate ships' & equipments' name into English",
    "icon": "fa/language",
    "i18nDir": "i18n/translator"
  }
}
```

## index 的基本属性
index 可以需要以 `export` 的方式向外暴露以下属性，下面列出的所有属性以及对应的类型。类型为 `String | ReactElement` 表示如果是 String 类型则直接显示，ReactElement 会被 React 渲染。
```coffeescript
module.exports =
  // 面板插件的相关属性
  reactClass: ReactClass // 插件的视图和逻辑，将会渲染进 poi 插件面板里，使用 React.createClass 生成
  // 新窗口插件的相关属性
  windowURL: String // 新窗口插件加载的 URL。如果插件拥有这个属性，那么它的 reactClass 属性会被忽略
  realClose: true | false // 新窗口退出时是否完全关闭，默认 false
  multiWindow: true | false // 是否允许多个新窗口。如果为是， realClose 属性将固定为 true，默认 false
  useEnv: true | false // 是否在初始化的时候获得舰娘信息、装备信息等的初始化数据，默认 false
  windowOptions: // 新窗口的初始数据
    x: Number
    y: Number
    width: Number
    height: Number
```

比如，需要编写一个点击后跳到新面板的插件。
```javascript
module.exports = {
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
  reactClass: React.createClass
    render: ->
      <h1>It works</h1>
```
在 index 中，以下所有接口都是可用的。

+ HTML DOM API
+ Chrome 47 的浏览器 JavaScript
+ Node.js 的所有功能
+ poi 暴露出的 API

## poi 暴露的 API

### 基本开发环境与环境变量

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

### 游戏数据

poi 以全局的方式暴露游戏资料，可以在 window 中直接获得以下资料。

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
  _nickName: String // 玩家的名字。
  _teitokuId: String // 玩家的 ID。
  _teitokuLv: Number // 玩家的等级。
  _teitokuExp: Number // 玩家的经验值。
```

poi 以全局事件的方式暴露游戏的通讯信息，可以通过 `window.addEventListener` 获得每次游戏请求的发包收包信息。

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

### 用户通知相关 API

```javascript
window.log('Something'); // 显示在游戏窗口下方的信息条
window.warn('Something'); // 显示在游戏窗口下方的信息条
window.error('Something'); // 显示在游戏窗口下方的信息条
window.success('Something'); // 显示在游戏窗口下方的信息条
window.notify('Something'); // 桌面通知
window.toggleModal('Title', 'Content'); // 显示模态框，Content 可以是 HTML 文档
// 如果需要在模态框下自定义按钮
var footer = {
  name: String, // 按钮显示的名字
  func: Function, // 点击按钮后的动作
  style: String in ['default', 'primary', 'success', 'info', 'danger', 'warning'] // 颜色
}
window.toggleModal('Title', 'Content', footer);
```

### 用户设置相关 API

```javascript
window.config.get('path.to.config', 'default'); // 获取某个用户设置值，获取失败返回默认值
window.config.set('path.to.config', 'some value'); // 保存某个用户设置值，若不提供值相当于删除该设置
window.layout // 目前的布局，'horizontal' || 'vertical'
window.theme // 目前使用的主题
```

### 插件间调用 IPC

引入 ipc 模块：
```javascript
var ipc = window.ipc;
```

注册插件 API：  
建议使用 `pluginName` 作为 `scope_name`。
```javascript
ipc.register("scope_name", {
  api_name:   @ref_to_function
  api_name2:  @ref_to_function_2
});
```

注销插件 API：
```javascript
ipc.unregister("scope_name", "api_name");
ipc.unregister("scope_name", ["api_name", "api_name2"]);
ipc.unregister("scope_name", {
  api_name:   @whatever
  api_name2:  @whatever
});
ipc.unregisterAll("scope_name");
```

调用其他插件的 API：  
注意：所有调用均为异步调用，无法获得返回值。
```coffeescript
scope = ipc.access("scope_name");
scope?.api_name?(args);
```

调用所有插件的 API：
```javascript
ipc.foreachCall("api_name", arg1, arg2, ...)
```

## 窗口插件开发

index.cjsx
```coffeescript
module.exports =
  windowOptions:
    x: 0
    y: 0
    width: 800
    height: 600
  windowURL: "file://#{__dirname}/index.html"
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

poi 内置了 `i18n-2` 模组以进行多语言翻译

将翻译文件放置在 `package.json` 里的 `poiPlugin.i18nDir` 键值指示的路径中，插件将会自动创建 `window.i18n[插件的 id]` 的翻译对象。

对于面板内插件，可以通过 `translated = window.i18n[插件的 id].__(toTranslate)` 来获得翻译。

对于新窗口插件，则需要通过自行建立翻译对象以调用翻译文件

关于 `i18n-2` 模组的详细使用方法请参照 [i18n-2](https://github.com/jeresig/i18n-node-2) 的文档

poi 预置了一个翻译方法以解决游戏内资源的翻译，对于非新窗口插件，可以通过如下方法调用

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

## 调试

见：[软件调试指南](debug-cn.md#软件调试指南)

## 插件发布规范
### 在 [npm](http://npmjs.org) 上发布

在 npm 上发布不仅可以使得版本维护更加简便，而且 poi 将会用重载的 npm 模组进行新版本插件的更新。

详情请参照 npm 关于 [npm publish](https://docs.npmjs.com/cli/publish) 的文档

注意包名应该以 `poi-plugin-` 开头以便其被 poi 发现

### 发布插件的测试版

允许插件通过 npm 发布测试版本，提供给“希望及时体验 beta 版插件”的用户进行测试。测试版插件使用先行版本号，形如 `x.y.z-beta.a`， 例如 `"version": "2.2.0-beta.0"`。在 npm 上发布时应打 `beta` tag，而非 `latest` tag。

与之对应的，稳定版插件应使用形如 `x.y.z` 的版本号，遵循[语义化版本规范](http://semver.org/)。

参考命令如下

`npm publish --tag beta`

### 插件（安装包）的发布

插件在发布时，应打包为 tar.gz 格式，以方便用户下载并直接安装离线安装包。

参考命令如下

```
cd path/to/[repo] && npm i
cd .. && tar cvf [repo] [repo].tar.gz
```

## 一些提示

+ 面板中显示的插件会被包裹在`<div id='插件名' />` 中，所以在自定义 CSS 中，建议用 `#插件名` 保证不影响全局 CSS。

## 实例参考

poi 的所有内置组件和 plugins 以一样的方式组织，在 poi 代码的 views/components 下可以看到他们的代码。

在 poooi(https://github.com/poooi) 下有很多可以参考的插件。
