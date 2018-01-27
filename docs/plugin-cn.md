# 插件开发指南

本文将介绍开发和发布一个 poi 插件的接口和要求。

## 基本要求

poi 基于 Web 技术开发，所有的 UI 和逻辑都是使用 Web 技术完成的。你需要对以下技术/库/名词的相关概念有基本的了解。
+ HTML，CSS
+ JavaScript（ECMAScript 7）或 [CoffeeScript](http://coffeescript.org/)（不推荐）
+ [Node.js](https://nodejs.org) 及 [npm](http://npmjs.com/)
+ [React.js](http://facebook.github.io/react/)
+ [Redux](http://redux.js.org/) 及 [react-redux](https://github.com/reactjs/react-redux)
+ [Electron](https://github.com/atom/electron)

另外，在 poi 大量使用的库中，开发插件还很可能会用到以下库，建议在必要时阅读相关文档。
+ [reselect](https://github.com/reactjs/reselect)
+ [react-bootstrap](http://react-bootstrap.github.io/components.html)
+ [redux-observers](https://github.com/xuoe/redux-observers)

最后，请在开发插件时遵循 [poi 开发规范](https://github.com/poooi/poi/blob/master/docs/plugin-cn.md)。

## 概述
一个 poi 插件实质是一个 Node 模块（module) 。安装/删除/升级这个插件，实质就是在 poi 上对这个 module 执行对应操作。

一个 poi 插件需要符合 npm 相关规范，需在根目录下包含描述文件 [`package.json`](https://docs.npmjs.com/files/package.json) 。在 `package.json` 中由 `main` 字段指定的文件将作为模块的入口文件；未指定的情况下，则是根目录下的 `index.js` ， `index.coffee` ， `index.cjsx` 或 `index.es`。

插件对本体的影响通过以下几种途径体现：
+ `package.json` 里的信息
+ 导入（`import`/`require`）该模块时立即执行的代码
+ 从该模块导入进的各变量

例如，如果一个插件是面板插件，那么它将会导出一个 React 组件（React component）；如果是新窗口插件，则会导出插件内容首页（`index.html`）的地址；类似于“数据汇报”的插件，不需要窗体，只要在启动时监听消息并在适当时候发送数据给服务器即可。

当然，还有大量控制安装、升级、删除、运行、设置等各方面的参数。

## 插件生命周期
插件刚被安装/升级结束后到能正式使用的过程，或被禁用的插件被启用的过程，称作启用插件（enable plugin）。在此之中，poi 按顺序做以下事情：

1. 导入插件模块
1. 读取并分析插件的 `package.json`
1. 加载插件 reducer
1. 运行 `pluginDidLoad`
1. 加入到/更新插件列表，加载插件 component / 窗口

插件从启用状态到被禁用/删除/升级前的过程，叫做禁用插件（disable plugin）。在此之中，poi 按顺序做以下事情：

1. 运行 `pluginWillUnload`
1. 关闭新窗口插件的窗口
1. 从插件列表移除/更新
1. 删除插件的 reducer 并清空插件 store
1. 删除插件的 import cache 等相关缓存

## package.json
`package.json` 是 npm 模组的元信息（metadata）的标准记录文件，其格式参见[其官方文档](https://docs.npmjs.com/files/package.json)。poi 利用其部分标准字段，并使用额外的字段储存 poi 对插件所需要的信息。

poi 读取的标准字段包括：

+ `version`：String，本插件的版本。须符合[语义化版本规范](http://semver.org/)，稳定版本号形如 `x.y.z` ，测试版本号形如 `x.y.z-beta.a`。
例如， `2.3.0-beta.0` 是 `2.3.0` 的测试版本，前者版本号较小，先于后者发布。
+ `author`：本插件的作者。
 + 如果是 String ，则该字符串为本插件的作者名。
 + 如果是 Object ，则其 `name` 属性为本插件的作者名，`links` 属性或 `url` 属性为作者个人链接。
+ `description`：String，本插件的简短介绍。

插件还可以向 poi 提供一些额外的信息，这些信息都存储在 `package.json` 中的 `poiPlugin` 字段中，包括：
+ `title`：String，插件的标题，用于插件列表中的显示。如果有翻译文件，则会以此为 key 翻译为相应语言。
+ `id`: String，用于辨别插件身份的键值，留空时默认为插件的包名（packageName）。
+ `priority`：Number，插件在插件列表里排序的优先级，值越小插件就会显示在越前。一般遵循“面板插件 < 新窗口插件 < 无窗口插件”顺序的管理，不过并非强制。
+ `description`：String，本插件的简短介绍，将显示在插件列表中。由于标准字段中的 `description` 会显示在 npm 网页中，因此可以在此处指定专用于插件列表的插件介绍。 如果有翻译文件将会以此为 key 翻译为相应语言。
+ `icon`：String，显示于于插件列表中的图标，支持包括 FontAwesome 在内的多个图标集，详见 [react-icons](https://www.npmjs.com/package/react-icons)。
  范例为 `"fa/beer"` 或 `"md/cancel"`， 字符串中没有 `/` 时默认为 FontAwesome ，如 `"beer"`。
+ `i18nDir`：String， 自定义 [i18n](https://github.com/jeresig/i18n-node-2) 文件夹相对插件根目录的路径，默认时会依次检查 `./i18n` 及 `./assets/i18n` 下是否有翻译文件。
+ `apiVer`：Object，插件兼容性定义。当最新版本的插件不能运行在旧版本的 poi 上时，需定义此字段。poi 会检查已安装插件的该字段来决定是否加载该插件，以及检查 npm 上最新 latest 版本的该字段，来控制检查新版、安装、升级、回滚等操作。 该字段的格式是，
```javascript
{
  <poiVer>: <pluginVer>,
}
```
 表达的含义是， 大于 `pluginVer` 版本的插件都需要大于 `poiVer` 的本体来运行；如果本体版本小于等于 `poiVer` ，则回滚到 `pluginVer`。
  + 注意，当下回滚操作会精确回滚到所指定的 `pluginVer` ，因此需要保证 `pluginVer` 是一个存在的版本，而不能给出一个任意大的值。而 `poiVer` 没有这个限制。例如可以写成 `6.99.99` 的形式来包括 7.0 以下的本体版本。
  + 注意，检查升级和回滚时，poi 只会检查 latest 中的最新版本，而不会检查 beta 中的版本，或 latest 中的较老版本。

示例 `package.json` 文件如下
```javascript
{
  "name": "poi-plugin-translator",
  "version": "0.2.4",
  "main": "index.cjsx",
  "description": "A plugin for poi that translates names."
  "author": {
    "name": "KochiyaOcean",
    "url": "https://github.com/kochiyaocean"
  },
  "poiPlugin": {
    "title": "Translator",
    "description": "Translate ships' & equipments' name into English",
    "icon": "fa/language",
    "i18nDir": "i18n/translator",
    "apiVer": {
      "6.3.3": "2.1.1",
      "7.0.0-beta.1": "3.0.0"
    }
  }
}
```

## 导出变量
一个 [Node 模组](https://nodejs.org/api/modules.html)的入口文件（如 `index.es` ）可以定义导出变量，这是一个模组向外暴露内部功能和信息的最主要方式。使用 [ECMAScript 7 的导出语法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)是
```javascript
import {join} from 'path'
export const windowURL = join(__dirname, 'index.html')
```
相对应地，CoffeeScript 的导出语法是
```coffeescript
{join} = require 'path'
module.exports.windowURL = join __dirname, 'index.html'
```
其中的 `__dirname` 变量为插件的根目录

poi 要求插件通过导出的方式告知本体和插件运行有关的信息。

面板插件本质上是在本体中渲染的一个组件。以下是适用于面板插件和无窗口插件的字段：
+ `reactClass`：React Component，面板插件的主要显示部分，将会作为 poi 本体的一部分渲染到插件面板。
+ `reducer`：[Redux reducer](http://redux.js.org/docs/basics/Reducers.html)，由于 Redux 要求全局只有一个 store ， 面板插件要自行维护 store 的话，需由本体读取 reducer 后合并到本体的主 reducer 当中。
 + 插件的 store 将会放置在 `store.ext.<pluginPackageName>` 处，如 `store.ext['poi-plugin-prophet']` 。建议使用 `extensionSelectorFactory('poi-plugin-prophet')` 的格式来提取数据，以提高可维护性。
 + 插件 store 将会在插件被禁用时清空。

新窗口插件本质上是一个在新进程中运行的网页窗口。以下是适用于新窗口插件的字段：

+ `windowURL`：String，新窗口插件页面的文件路径。
 + 如果插件拥有这个属性，那么它的 `reactClass` 属性会被忽略。
+ `realClose`：Boolean，新窗口退出时是否完全关闭。如果为 false 的话，“关闭插件”只是隐藏了该窗口；如果为 true 的话，关闭插件就清空进程的内存。默认为 false。
+ `multiWindow`：Boolean，是否允许多个新窗口。如果为true，则每次点击该插件都会开一个新窗口，并且 `realClose` 属性将固定为 true ；否则，点击插件名会切换到已打开的窗口。默认为 false。
+ `windowOptions`：Object，窗口的初始化选项。除了会被 poi 覆盖的个别选项以外，你可以使用 [Electron BrowserWindow](https://github.com/electron/electron/blob/master/docs/api/browser-window.md#class-browserwindow) 构造函数中的所有选项，不过一般而言你主要需要以下字段：
 + `x`：Number，窗口横坐标
 + `y`：Number，窗口纵坐标
 + `width`：Number，窗口宽度
 + `height`：Number，窗口高度

以下是适用于所有插件的字段：
+ `settingClass`：React Component，插件的设置面板，显示在插件列表中。
+ `pluginDidLoad`：function，不接受参数，在插件启用后被调用。
+ `pluginWillUnload`：function，不接受参数，在插件禁用前被调用。

下面是一个使用自定义 reducer 的面板插件的示例，这个插件记录并显示用户点击按钮的次数。虽然可以用 React state 来完成这一记录，不过这里我们决定用 Redux 以展示 `export reducer` 的用法。注意该示例使用了 [JSX 语法](https://facebook.github.io/react/docs/jsx-in-depth.html)。
```javascript
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { Button } from 'react-bootstrap'

// Import selectors defined in poi
import { extensionSelectorFactory } from 'views/utils/selectors'

const EXTENSION_KEY = 'poi-plugin-click-button'

// This selector gets store.ext['poi-plugin-click-button']
const pluginDataSelector = createSelector(
  extensionSelectorFactory(EXTENSION_KEY),
  (state) => state || {}
)
// This selector gets store.ext['poi-plugin-click-button'].count
const clickCountSelector = createSelector(
  pluginDataSelector,
  (state) => state.count
)

// poi will insert this reducer into the root reducer of the app
export function reducer(state={count: 0}, action) {
  const {type} = action
  if (type === '@@poi-plugin-click-button@click')
    return {
      // don't modify the state, use Object Spread Operator
      ...state,
      count: (state.count || 0) + 1,
    }
  return state
}

// Action
function increaseClick() {
  return {
    type: '@@poi-plugin-click-button@click'
  }
}

// poi will render this component in the plugin panel
export const reactClass = connect(
  // mapStateToProps, get store.ext['poi-plugin-click-button'].count and set as this.props.count
  (state, props) => ({count: clickCountSelector(state, props)}),
  // mapDispatchToProps, wrap increaseClick with dispatch and set as this.props.increaseClick
  {
    increaseClick,
  }
)(class PluginClickButton extends Component {
  render() {
    const {count, increaseClick} = this.props
    return (
      <div>
        <h1>Clicked: {count}</h1>
        <Button onClick={increaseClick}>
          Click here!
        </Button>
      </div>
    )
  }
})
```

## 本体插件接口
在插件中，以下接口都是可用的。
+ HTML DOM API
+ Chrome 浏览器 JavaScript
+ Node.js 的官方库
+ 所有 poi 本体已安装的库

对于非新窗口插件而言，由于其本质上就是本体的一部分，poi 的所有代码都可以直接导入，因此能直接使用 poi 提供的诸多接口、全局变量和工具函数。

poi 将其根目录加入了导入目录，因此可直接导入 poi 根目录的相对路径。即，
```javascript
import * from 'views/utils/selectors'
```
即可表达
```javascript
import * from `${window.ROOT}/views/utils/selectors`    // Actually syntactically illegal
```

### 全局接口

#### 全局变量
```javascript
window =
  ROOT // poi 本体的代码根目录，即 package.json 和 index.html 所在目录
  APPDATA_PATH // 可以用于存放用户数据的目录，Windows 上是 %AppData%/poi，Linux 上是 ~/.config/poi，macOS 上是 ~/Library/Application Support/poi
  POI_VERSION // poi 版本号
```
此外，还有一些全局变量是为了兼容旧版本插件而保留的，例如 `_`, `$ships` 等，不建议在新插件中使用。而是在插件中 `import` 或从 `store` 中使用 `selector` 获取。

#### 通知
在游戏界面下方的通知区域显示信息
```javascript
window.log('Something');
window.warn('Something');
window.error('Something');
window.success('Something');
```
使用桌面通知，`notify` 函数的参数可以参考 `views/env-parts/notif-center.es#L42`
```javascript
window.notify('Something'); // 桌面通知
```
使用 modal 通知
```javascript
window.toggleModal('Title', 'Content'); // 显示模态框，Content 可以是 HTML 文档
// 如果需要在模态框下自定义按钮
var footer = [
  {
    name: String, // 按钮显示的名字
    func: Function, // 点击按钮后的动作
    style: String in ['default', 'primary', 'success', 'info', 'danger', 'warning'] // 颜色
  }
]
window.toggleModal('Title', 'Content', footer);
```

使用 toast 通知，具体参数可参考 `views/env-parts/toast.es#L2`
```javascript
window.toast("something")
```

#### 设置
全局的 `window.config` 类负责统一管理设置。设置存放在 `APPDATA_PATH` 下的 `config.cson` 文件中，同时加载到了 `store.config` 中。
```javascript
window.config.get('path.to.config', 'default'); // 获取某个用户设置值，获取失败返回默认值（不推荐，见下方说明）
window.config.set('path.to.config', 'some value'); // 保存某个用户设置值，若不提供值相当于删除该设置
window.layout // 目前的布局，'horizontal' || 'vertical'
window.theme // 目前使用的主题
```
在 React component 内部要用到设置的话，不推荐使用 `config.get` 方法，而建议从 Redux store.config 中获取（参见 `views/utils/selectors` ）,并搭配 `lodash` 的 get 方法。

### Redux
#### Redux store
poi 用 Redux store 存储了包括所有游戏资料在内的大量数据。

Reducer 由 `views/redux` 下各文件定义，最后由 `views/create-store` 创建 store 。以下是你可以利用的接口，但并不推荐直接使用。推荐的做法是尽量多地使用 selector ，reducer 以及来自 `react-redux` 的 `connect` ，
+ `import { store } from 'views/create-store'`：全局 store
+ `import { extendReducer } from 'views/create-store'`：`extendReducer(key, reducer)` 会将 `reducer` 附加到 `store.ext.<key>`下。
+ `const { getStore } = window`：`getStore()` 或 `getStore('a.b.c')` 可以获取 store 的全部数据或某一路径下的数据。这个函数在 debug 时很方便，但在代码中应尽量少使用。在 reducer 中使用它，表明你可能需要调整你的 store 设计，以增强各子项之间的独立性；在 react component 中使用它，表明你应该换用 `connect` 来获取 store 中的数据。不过某些时候，使用这个函数无可避免。

##### 命名说明
根据[游戏 API](https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/apilist.txt)，包括舰船、装备、地图等在内的很多数据都由两部分组成，一部分是在 Flash 初始化时给出的与玩家无关的基本数据，一部分是在游戏开始后给出及不断更新的玩家数据。为了方便叙述，以及历史原因，将前者冠以 `$` 前缀，将后者冠以 `_` 前缀，例如 `$ships` 和 `_ships` 。

下面列出和插件开发有关的几个 store 子项。

##### store.const
此子项存储的数据，都是 Flash 初始化时提供的基本常量。如无特殊说明，均为以 `api_id` 为键的 object ，且值与服务器消息包一致。
```javascript
store.const.
  $ships        // 舰船
  $shipTypes    // 舰船种类
  $equips       // 装备
  $equipTypes   // 装备种类
  $mapareas     // 海域
  $maps         // 地图
  $missions     // 远征
  $useitems     // 物品（位于母港アイテム菜单中的物品）
  $shipgraph    //
```

##### store.info
此子项存储的数据，主要是各种玩家数据。如无特殊说明，均为以 `api_id` 为键的 object ，且值与服务器消息包一致。
```javascript
store.info.
  basic         // 提督基本资料，如提督名、提督 id、提督等级、经验等
  ships         // 舰船
  fleets        // 舰队。0-base 长度为4的数组
  equips        // 装备
  repairs       // 修理渠。0-base 长度为4的数组
  constructions // 建造渠。0-base 长度为4的数组
  resources     // 资源。长度为8的数组，值为 Number 资源量。
  maps          // 地图
  quests        // 任务，内部为 {records: <任务进度记录>, activeQuests: <活动任务记录> }
```

##### store.battle
此子项在出击时计算战斗，并在战斗结束（`api_req_sortie/battleresult`）时得到战斗敌我结果。
```javascript
store.battle.
  result.
    rank        // String
    boss        // Boolean
    map         // Integer(2-3 => 23)
    enemyHp     // Array of Integer
    deckHp      // Array of Integer
    deckInitHp  // Array of Integer
    enemyShipId // Array of Integer
    deckShipId  // Array of Integer
```

##### store.sortie
此子项维护出击信息。
```javascript
store.sortie.
  combinedFlag      // Integer, api_combined_flag
  sortieStatus      // [false|true] * 4, whether a fleet is in sortie
  escapedPos        // [] | [idx], array of escaped/towed ships
    // 0 for fleet1Pos1, 6 for fleet2Pos1, ..., 23 for fleet4Pos6
```

##### store.misc
此子项放置一些暂时没有更好地方集中摆放的值。
```javascript
store.misc.
  canNotify         // 只有在登陆后第一次进入母港时，本值变为 true
```

#### Selectors
在可以的情况下应采用 [reselect](https://github.com/reactjs/reselect) 库的 selector 来从 store 中提取数据，以避免不必要的计算和渲染。

本体代码的 `'views/utils/selectos'` 文件中提供了一些常用的计算游戏数据的 selector。详细列表请参见[该文件](https://github.com/poooi/poi/blob/master/views/utils/selectors.es)，这里以舰队、舰船和装备为例，讲解一下本文件中的主要格式。
+ `fleetSelectorFactory(fleetId)`：该函数以 `fleetId` （0到3）调用后返回的值为一个 selector，该 selector 返回指定舰队的资料（即 `store.info.fleets[<fleetId>]`）。
+ `shipDataSelectorFactory(shipId)`：该函数以 `shipId` 调用后返回的 selector， 返回指定船只的资料，该资料为一个二元数组，`[_ship, $ship]`。如果该船无法找到，则返回 `undefined`。
+ `fleetShipDataSelectorFactory(fleetId)`：该函数以 `fleetId` 调用后返回的 selector， 返回指定舰队所有船只的资料，每个船只的资料为二元数组`[_ship, $ship]`，或 `undefined`。

除此之外，几个比较特殊的 selector 有：
+ `stateSelector`：返回整个 store 。只应在级联 selector 时使用它，例如 `fleetShipsDataSelectorFactory` 。
+ `extensionSelectorFactory(extKey)`：返回 `store.ext[<extKey>]` 。当插件 `export reducer` 时，以插件包名调用即可获得该 reducer 对应的 store。

以及以下辅助函数：
+ `createDeepCompareArraySelector`：类似于 `createSelector` ，但对于所有的数组参数，都会对其元素进行逐一 `===` 比较，如果每个元素都相同，则仍然判定为相同。适合由多元素组成数组的 selector 的下一级使用。

为了方便开发中对错误进行追踪，__selector 并不是完全安全的__，需要由开发者进行异常值处理，特别是需要考虑到全新安装 poi，并未登录游戏情况下插件能否正常工作。

#### Redux action
如果你需要自行维护 reducer ，那么 poi 本体发送的几个 Redux action 是你可能会用到的：
+ `@@Request/kcsapi/<api>`，例如 `@@Request/kcsapi/api_port/port` ，在游戏发出请求前发出，格式为
```javascript
  action.
    type        // `@@Request/kcsapi/<api>`
    method      // 'GET' | 'POST' | ...
    path        // `/kcsapi/<api>`
    body        // Request body
```
+ `@@Response/kcsapi/<api>`，例如 `@@Response/kcsapi/api_port/port` ，在游戏收到回复后发出，格式为
```javascript
  action.
    type        // `@@Response/kcsapi/<api>`
    method      // 'GET' | 'POST' | ...
    path        // `/kcsapi/<api>`
    body        // Response body
    postBody    // Request body
```
+ `@@BattleResult`，在一次战斗结束后发出。如果你要获取战斗结果，请使用本动作，而不是监听 `@@Response/kcsapi/api_req_sortie/battleresult`，因为战斗结果的计算和存储也在后者的过程中，而 reducer 顺序不明可能造成数据访问出错。 本动作格式为
```javascript
    type: '@@BattleResult',
    result:
      valid              // 总是 true
      rank               // String，'S' | ... | 'D'
      boss               // Boolean
      map                // Number，11 | ... | 54 | ...
      mapCell            // Number，与 api_req_map/next 中的 api_no 一致。注意这实质是路径编号而不是结点编号
      quest              // String，出击海域名
      enemy              // String，敌方舰队名
      combined           // Boolean
      mvp                // Array， 单舰队：[<mvp>, <mvp>] 联合舰队：[<mvpFlee1>, <mvpFleet2>]，其中成员均为 1 | ... | 6 | -1（无）
      dropItem           // Object，见 api_get_useitem
      dropShipId         // Number，获得的船只的 api_id
      deckShipId         // Array，我方舰队船只的 api_id。联合舰队采用 concat
      deckHp             // Array，我方舰队船只的结束 hp。联合舰队采用 concat
      deckInitHp         // Array, 我方舰队船只的开始 hp。联合舰队采用 concat
      enemyShipId        // Array，敌方舰队的 api_ship_id
      enemyFormation     // Number，与 api_formation 一致
      enemyHp            // Array，敌方舰队的结束 hp
      eventItem          // Object | null，与 api_get_eventitem 一致
      time               // Number, 此战斗的开始时间
```

#### Promise Action
poi 整合了 [`redux-thunk`](https://github.com/gaearon/redux-thunk) 以便于编写异步操作。详情请参阅该库文档。简单来说，你不仅可以 dispatch 一个 plain object，还可以 dispatch 一个函数，其参数满足 `(dispatch, getState) => {}`，即你可以在函数内部异步获取数据及 dispatch actions。

除此之外， 如果你想要 dispatch promise 的话，你还可以使用 poi 编写的 `PromiseAction` 接口。该类接收三个参数，
+ `actionNameBase`：String
+ `promiseGenerator`：function，不接受参数，返回一个 promise
+ `args`：anything，可选，将会传递给 promiseGenerator 及各 action

dispatch 该类的实例后，将总共可能产生下面三个动作：
```javascript
   // 此动作在运行 promiseGenerator 前发出
   {
     type: `${actionNameBase}`,
     args,
   }
   // 此动作在 promise resolve 后发出
   {
     type: `${actionNameBase}@then`,
     result: <result>,
     args,
   }
   // 此动作在 promise 出错后发出
   {
     type: `${actionNameBase}@catch`,
     error: <error>
     args,
   }
```

下面是示例。
```javascript
import { PromiseAction } from 'views/middlewares/promise-action'
import { readFile } from 'fs'

function readSomeFile(filename) {
  return new PromiseAction('@@TestAction/Readfile',     // action name base
    ({filename}) =>                 // A function that returns a promise
      readFile(filename),
    {                                                   // Optional args
      filename: filename,
      time: Date.now()
    }
  )
}



store.dispatch(readSomeFile('./assets/useful-file.json')


function reducer(state, action) {
  const {type, error, result, args} = action
  switch (type) {
  case '@@TestAction/Readfile':
    console.log(`About to read file ${args.filename} now!`)
    break
  case '@@TestAction/Readfile@then':
    console.log(`Successfully read file ${args.filename} at ${args.time}!`)
    console.log(`The file reads:`)
    console.log(result)
    return {
      ...state,
      ...result,
    }
  case '@@TestAction/Readfile@catch':
    console.log(`Failed to read file ${args.filename} at ${args.time}!`)
    console.log(error.stack)
    break
  }
}

```

#### Observer
[`redux-observers`](https://github.com/xuoe/redux-observers) 库用于监听 store 中的某一子项，当它发生变化时采取某一操作。这一操作可能只是把该子项以某种方式储存起来，或者进行计算并调用某函数，也有可能是根据此子项 dispatch 一个新的 action 。具体请参见库文档。

这里强调一个要点。如果你在插件中定义了 observe，那么你必须同时定义在插件禁用时删除该 observer。根据 `redux-observers` 的文档，`observe` 函数调用后返回 `unsubscribeFunc`，你应该在你的插件的 `pluginWillUnload` 中调用该 `unsubscribeFunc` 。

下面是示例：
```javascript
// index.es
import { observe, observer } from 'redux-observers'
import { createSelector } from 'reselect'
import { writeFileSync } from 'fs'

import { extensionSelectorFactory } from 'views/utils/selectors'
import { store } from 'views/create-store'

const EXTENSION_KEY = 'poi-plugin-some-plugin-name'

const countSelector = createSelector(
  extensionSelectorFactory(EXTENSION_KEY),
  (state) => state.count
)

const unsubscribeObserve = observe(store, [
  observer(
    state => countSelector(state),
    (dispatch, current, previous) => {
      writeFileSync('someFile.json', JSON.stringify({count: current}))
    }
  )]
)

export function pluginWillUnload() {
  unsubscribeObserve()
}
```

### 事件
poi 使用少量的全局事件来进行通信。由于过度使用事件会破坏程序的层级性，并使执行流变得复杂，因此应该尽量避免使用事件。一般而言，事件应被当做一种底层操作。

与 `@@Request/kcsapi/<api>`  和 `@@Response/kcsapi/<api>` 两个动作相对应地，在发出请求前和收到回复后也会发出两个事件，分别是
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
正常情况下你不应该监听这两个事件。特别是，如果你的插件有 react component 的话，你应该编写 reducer 并且监听前述两个 redux action 来维护数据，因为如果监听事件来维护数据，那么 React 就会在 action 结束后以及事件结束后各渲染一次，从而增加渲染开销，是需要避免的情况。你也不应该监听这两个事件来做存储等操作，而应该使用 observer 来监听 store。

一个可以使用这事件的地方，是在服务（services），即对于没有面板的插件，监听这两个事件后的行为也不是改变面板数据，而是执行其它操作（存储，向别的服务器发送包，等）。

## 窗口插件开发
对于新窗口插件而言，由于其本质上是在内存独立的新进程中运行的网页，因此不能直接导入本体代码。好在 Electron 提供了 `remote` 模块用于和远端（本体）交互，其中 `remote.require` 可以从远端导入模组，而 `remote.getGlobal` 可以从远端导入全局变量。不过注意，所有和远端相关的函数均为异步调用，无法获得返回值。

### 环境变量
由于新建窗口时的新进程和主进程环境变量有所不同，可以引用此段 javascript 以加载与主程序相同的环境变量。
```javascript
// `env-loader.js`
window.remote = require('electron').remote;
window.ROOT = remote.getGlobal('ROOT');
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH');
window.POI_VERSION = remote.getGlobal('POI_VERSION');
window.MODULE_PATH = remote.getGlobal('MODULE_PATH');
window.PLUGIN_ROOT = __dirname
require('module').globalPaths.push(MODULE_PATH);   // Allows importing main-poi libraries
require('module').globalPaths.push(ROOT);          // Allows importing main-poi source files
```

### 主题
可以借助 poi 本体提供的主题 api 来使窗口插件使用本体主题:
```javascript
require(`${ROOT}/views/env-parts/theme`) // if you've loaded ROOT variable
```
该 api 内会载入 `bootstrap`，`font-awesome` 等组件的样式表，以及用户自定义样式表 `custom.css` 的支持，只需要在插件的 `index.html` 的 `<head>` 元素中加入对应的 `<link>`。
```html
<link rel="stylesheet" id="bootstrap-css">
<link rel="stylesheet" id="fontawesome-css">
<link rel="stylesheet" id="custom-css">
```
poi 本体的缩放参数 `zoomLevel` 不会被窗口插件继承，需要自行按需进行处理，例如只放大字体而避免考虑窗口大小等因素：

```javascript
const zoomLevel = config.get('poi.zoomLevel', 1)
const additionalStyle = document.createElement('style')

remote.getCurrentWindow().webContents.on('dom-ready', (e) => {
  document.body.appendChild(additionalStyle)
})

additionalStyle.innerHTML = `
  item-improvement {
    font-size: ${zoomLevel * 100}%;
  }
`
```

## 插件间调用 IPC

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

## i18n

poi 内置了 `i18n-2` 模组以进行多语言翻译

将翻译文件放置在 `package.json` 里的 `poiPlugin.i18nDir` 键值指示的路径中，插件将会自动创建 `window.i18n[插件的 id]` 的翻译对象。

对于面板内插件，可以通过 `translated = window.i18n[插件的 id].__(toTranslate)` 来获得翻译。

poi 的 `poi-plugin-translator` 插件提供了对于舰娘名，装备名等的英文/韩文化翻译，可以在插件中按需使用。

poi 预置了一个翻译方法以解决游戏内资源的翻译，对于面板插件，可以通过如下方法调用

```javascript
resource = window.i18n.resources.__('to translate')
```

对于新窗口插件，需要调用相应插件

对于新窗口插件，则需要通过自行建立翻译对象以调用翻译文件。
```javascript
window.language = config.get('poi.language', navigator.language)
const i18n = new i18n2({
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  directory: join(__dirname, 'i18n'),
  extension: '.json',
  updateFiles: false,
  devMode: false,
})
i18n.setLocale(window.language)

if(i18n.resources == null){
  i18n.resources = {}
}

if(i18n.resources.__ == null){
  i18n.resources.__ = (str) => str
}
if(i18n.resources.translate == null){
  i18n.resources.translate = (locale, str) => str
}
if(i18n.resources.setLocale == null){
  i18n.resources.setLocale = (str) => {}
}

window.i18n = i18n

try{
  require('poi-plugin-translator').pluginDidLoad()
}
catch(error){
  console.warn('plugin-translator',error)
}


window.__ = i18n.__.bind(i18n)
window.__r = i18n.resources.__.bind(i18n.resources)

window.i18n = i18n

resource = window.i18n.resources.__('to translate')
```

建议对新窗口标题进行翻译：
```javascript
document.title = window.__('your-plugin')
```

关于 `i18n-2` 模组的详细使用方法请参照 [i18n-2](https://github.com/jeresig/i18n-node-2) 的文档。


## 调试
对于开发版本的插件，推荐的载入 poi 方式为使用 [`npm link`命令](https://docs.npmjs.com/cli/link)。

首先在插件目录下执行 `npm link`（可能需要管理员权限），再在 poi 数据文件夹中的 `plugins` 子目录下执行 `npm link PLUGIN-PACKAGE-NAME`。

其它资料参见：[软件调试指南](debug-cn.md#软件调试指南)

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

+ 面板中显示的插件会被包裹在`<div id='插件名' />` 中，所以在自定义 CSS 的选择器中，建议加入 `#插件名` 保证不影响全局 CSS。

## 实例参考

在 poooi(https://github.com/poooi) 下有很多可以参考的插件。

## 社区
欢迎你成为 poi 的开发者，在开发过程中的问题以及想法可以在 issue 中提出。此外可以加入 [telegram 交流群](https://telegram.me/joinchat/AoMUpkCr6B8uH7EUewq6eQ)参与交流讨论。
