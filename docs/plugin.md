# Plugin development

Poi is based on web, and all UI and procedure are done with web development techniques. Developers
are supposed to have knowledge of following subjects:

+ HTML, CSS
+ JavaScript（ECMAScript 7）or [CoffeeScript](http://coffeescript.org/) (not recommended)
+ [Node.js](https://nodejs.org) as well as [npm](http://npmjs.com/)
+ [React.js](http://facebook.github.io/react/)
+ [Redux](http://redux.js.org/) as well as [react-redux](https://github.com/reactjs/react-redux)
+ [Electron](https://github.com/atom/electron)

Documents of following libraries may be also useful during development:

+ [reselect](https://github.com/reactjs/reselect)
+ [react-bootstrap](http://react-bootstrap.github.io/components.html)
+ [redux-observers](https://github.com/xuoe/redux-observers)

Finally, it is recommended to follow some development instructions below.

## Brief Introduction
A poi plugin is essentially a node module. Installing, removing or updating the plugin are therefore manupulations on the plugin by poi itself.

A plugin should follow npm related specifications, a [`package.json`](https://docs.npmjs.com/files/package.json) under plugin root directory is necessary. The entry file is specified in `main` field, and, if not provided, will be `index.js`, `index.coffee`, `index.cjsx`, or `index.es`.

Plugin will interact with poi using:
+ information provided in `package.json`
+ code executed when importing (using `import` or `require` syntax) the module
+ imported variables

For example, if a plugin is inside poi main interface (*panel plugin*), a React component should be exported; if it is a standalone window plugin (*window plugin*), it should export content index page (`index.html`); plugins that does not contain any user-interface (*backend plugin*) will just run in the back-end.

Of course there will be many arguments related to installation, upgrade, removing, executing and setting.

## Plugin life cycle
The procedure between the moment plugin is installed, updated, or enabled in settings panel, and the moment it starts to work, is called *enable plugin*. During this procedure, poi will:

1. import plugin module
1. read and analyze plugin's `package.json`
1. load plugin's reducer
1. call `pluginDidLoad`
1. update plugin list, load plugin component or window

The procedure between the moment plugin is running and and the moment is disabled, is removed or starts being updated, is call *disable plugin*. During this procedure, poi will:

1. call `pluginWillUnload`
1. close the window for window plugin
1. update plugin list
1. remove plugin's reducer and empty plugin store
1. remove plugin cache such as import cache

## On `package.json`
`package.json` is the standard file for npm module metadata, its structure can be refered in [npm offical documents](https://docs.npmjs.com/files/package.json). poi makes use of parts of its standard field, and also extra field for plugin's own information.

Standard metadata used are:
+ `version`: *String*, plugin version in [Semantic Versioning](http://semver.org/) format, e.g. `x.y.z` for stable version, `x.y.z-beta.a` for beta version.
+ `author`: author for plugin
  + if *String*, it is the name of author
  + if *Object*, then `name` is the name of author,`links` or `url` is the links to the author.
+ `description`: *String*, brief description

Extra information is stored in `poiPlugin` field, including:
+ `title`: *String*, title for plugin, displayed in plugin list and menu. Will be translated provided in i18n keys.
+ `id`: *String*, key for identify the plugin. Will be package name if empty.
+ `priority`: *Number*, priority in plugin menu, smaller value will make it more ahead. Generally the order is panel plugin < window plugin < back end plugin, but it is not obliged.
+ `description`: *String*, description of the plugin, displayed in plugin list. Since standard metadata's `description` is displayed in npm website, this field is for poi specified description. Will be translated provided in i18n keys.
+ `icon`: *String*, icon for plugin in plugin list, supports icons including `FontAwesome`, see [react-icons](https://www.npmjs.com/package/react-icons)
+ `i18nDir`: *String*, custom [i18n](https://github.com/jeresig/i18n-node-2) path relative to plugin root, will be `./i18n` and `./assets/i18n` by default.
+ `apiVer`, *Object*, defines plugin compatibility. Use it if a newer version is not compatible on older poi versions. Poi will check the field for installed plugin to determine its loading, and also check the field in latest version on npm repository, to control the update check, installation, upgrade or rolling back. Its format will be:
```javascript
{
  <poiVer>: <pluginVer>,
}
```
which means: plugins versioned above `pluginVer` requires poi version above `poiVer`; if poi version is under `poiVer`, will rollback to `pluginVer`.
   + Attention, `pluginVer` should exactly exist in npm repository since the rolling back will use the exact version, while `poiVer` is not limited, e.g. you can use `6.99.99` to cover poi versions under 7.0.0
   + poi will check update and rollback for the most latest stable version.

An example `package.json`:
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

## Exporting variables

Exported variables can de defined in the entry file of a [Node module](https://nodejs.org/api/modules.html), which is the primary way for a module to expose inner functionality and information. If you use [ECMAScript 7's exports statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export), the code will be,

```javascript
import {join} from 'path'
export const windowURL = join(__dirname, 'index.html')
```
If you use CoffeeScript, it will be:
```coffeescript
{join} = require 'path'
module.exports.windowURL = join __dirname, 'index.html'
```

Above `_dirname` variable is the root path of your plugin.

poi demands that plugin inform main program with information using exporting.

Panel plugin is essentially a component rendered within main poi. Following variables for panel and backend plugin are:
+ `reactClass`: *React Component*, rendered in main poi as a plugin panel.
+ `reducer`: [*Redux reducer*](http://redux.js.org/docs/basics/Reducers.html), as Redux requires a unique global store, if plugin shall maintain the store, a reducer must be provided and main poi will combine it with its own reducers.
  + plugin store will be placed at `store.ext.<pluginPackageName>`, e.g. `store.ext['poi-plugin-prophet']`. It is recommended to use `extensionSelectorFactory('poi-plugin-prophet')` to retrieve data, as to improve readability.
  + plugin store will be emptied upon being disabled

New window plugin is exactly a new web page window running on another process. Following variables are for new window plugin:

+ `windowURL`: *String*, path for new window plugin's index page.
 + `reactClass` property will be ignored if provided `windowURL`
+ `realClose`: *Boolean*, whether the window is closed on exiting. If set to `true`, "closing the plugin" will just hide the window with plugin running at backend; otherwise closing means empty the process memory. default is `false`
+ `multiWindow`: *Boolean*, whether multiple windows are allowed. If set to `true`, every time clicking the plugin name will open a new window, and `realClose` will be fixed to `true`, otherwise clicking the plugin name will switch to the existing window.
+ `windowOptions`: *Object*, used in window initialization. You are free to use options listed in [Electron BrowserWindow](https://github.com/electron/electron/blob/master/docs/api/browser-window.md#class-browserwindow) except for some that are overwritten by poi. Generally you need the following:
 + `x`: *Number*, x coordinate for window
 + `y`: *Number*, y coordinate for window
 + `width`: *Number*, window width
 + `height`: *Number*, window height

And following variables apply to all sorts of plugins:
+ `settingClass`: *React Component*, setting panel for plugin, will be rendered in plugin list, settings view
+ `pluginDidLoad`: *function*, no argument, called after plugin is enabled
+ `pluginWillUnload`: *function*, no argument, called before plugin is disabled

Here's an example using custom reducer. It records and shows the count for clicking a button. Though React state is capable for this task, the code uses Redux for showcasing `export reducer` usage. [JSX language](https://facebook.github.io/react/docs/jsx-in-depth.html) is used.

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

## Interface
Following interfaces are available:

+ HTML DOM API
+ Chrome javascript
+ Node.js standard libraries
+ libraries installed in main poi

For panel and backend plugins, as they are part of main poi, every pieces of code of poi can be imported, they can benefit from poi's APIs, and utility functions.

poi appends its root path to importing paths, so you can import path relative to poi root, e.g.

```javascript
import * from 'views/utils/selectors'
```
equals to

```javascript
import * from `${window.ROOT}/views/utils/selectors`    // Actually syntactically illegal
```


### API

#### Globals

```javascript
window =
  ROOT // poi's root path, namely path where package.json and index.html reside
  APPDATA_PATH // path to store user data, it will be %AppData%/poi on Windows, ~/.config/poi on Linux, ~/Library/Application Support/poi on macOS
  POI_VERSION // poi version
```

some globals are reserved for compatibility, such as `_`, `ships`. It is not recommended to use them in the plugin. Use `import` or `store`'s `selector` instead.

#### Notifications
To display information in the info bar under game area:
```javascript
window.log('Something'); // display on the information bar below game window
window.warn('Something'); // display on the information bar below game window
window.error('Something'); // display on the information bar below game window
window.success('Something'); // display on the information bar below game window
```

To use desktop noftication, check `views/env-parts/notif-center.es#L42` for more detail:
```javascript
window.notify('Something'); // desktop notification
```

To use modal:
```javascript
window.toggleModal('Title', 'Content'); // display modal, Content can be HTML
// if you need to customize buttons
var footer = [
  {
    name: String, // button display name
    func: Function, // action on clicking the button
    style: String in ['default', 'primary', 'success', 'info', 'danger', 'warning'] // button style
  }
]
window.toggleModal('Title', 'Content', footer);
```

To use toast, check `views/env-parts/toast.es#L2` for more detail:
```javascript
window.toast("something")
```

### Config API

Global `window.config` class handles configurations. The config is saved in `config.cson` that resides in `APPDATA_PATH`, and also loaded in `store.config`.

```javascript
window.config.get('path.to.config', 'default'); // get a user config value, if fail, return the default value (NOT RECOMMENDED, SEE BELOW)
window.config.set('path.to.config', 'some value'); // save a user config value, not providing value will delete the config path
window.layout // current layout = 'horizontal' || 'vertical'
window.theme // current theme
```

If you want to use config within React component, instead of `config.get`, the best practice is to use selectors (see `views/utils/selectors`) to retrieve from store.config, with `lodash`'s `get` method.

### Redux
#### Redux store
poi uses Redux store for data including game information.

Reducers are defined in `views/redux`, and store is created in `views/create-store`. Following interfaces are available, the best practice, however, is to use selector, reducer as well as `connect` from `react-redux`.
+ `import { store } from 'views/create-store'`: global store
+ `import { extendReducer } from 'views/create-store'`: `extendReducer(key, reducer)` will add `reducer` under `store.ext.<key>`
+ `const { getStore } = window`: `getStore()` or `getStore('a.b.c')` can retrieve all data of part of data under certain path. This method is convenient during debugging, but not recommended for prodcution. If you use it in reducer, it implies a better design for store is needed to assure the independency; if you use it in React component, you may use `connect` instead. Anyway, you have to live with it sometimes.


#### Naming
According to [Kancolle API](https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/apilist.txt), data including ships, items, maps, etc. comes from 2 sources: one is basic data during game initialization, which is not related to game player; other is player data that is given and kept updated during gaming. For convinient and historical reasons, the former is named with `$` and latter `_`, e.g. `$ships` and `_ships`.

Following data paths are related to plugin development:

##### store.const
Data in this path are all basic information during game initialization, generally *Object*s keyed by `api_id`, same as server packet.
```javascript
store.const.
  $ships
  $shipTypes
  $equips
  $equipTypes
  $mapareas
  $maps
  $missions
  $useitems     // items list in アイテム menu
  $shipgraph
```

##### store.info
Data in this path are player data, generally *Object*s keyed by `api_id`, same as server packet
```javascript
store.info.
  basic         // player/teitoku basic information, name, id, level, exp, etc.
  ships
  fleets        // 0-base, *Array* of lenth 4
  equips
  repairs       // 0-base, *Array* of lenth 4
  constructions // 0-base, *Array* of lenth 4
  resources     // *Array* of 8 *Number*
  maps
  quests        // format {records: <quest progress>, activeQuests: <active quests> }
```

##### store.battle
Data in this path are data related to battle.
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
Data in this path are related to sortie.
```javascript
store.sortie.
  combinedFlag      // Integer, api_combined_flag
  sortieStatus      // [false|true] * 4, whether a fleet is in sortie
  escapedPos        // [] | [idx], array of escaped/towed ships
    // 0 for fleet1Pos1, 6 for fleet2Pos1, ..., 23 for fleet4Pos6
```

##### store.misc
Some data that we don't know where to place.
```javascript
store.misc.
  canNotify         // will be true the first time log in to HQ screen
```

#### Selectors
When convenient, use [reselect](https://github.com/reactjs/reselect)'s selector to obtain data from store to avoid unnecessary compuations and renderings.

`'views/utils/selectos'` provides some commonly used slectors for game data. Here lists some example.
+ `fleetSelectorFactory(fleetId)`: returns selector of `store.info.fleets[<fleetId>]` when called with `fleetId`(from 0 to 3)
+ `shipDataSelectorFactory(shipId)`: returns selector of data of certain ship when called with `shipId`. Which will be in format `[_ship, $ship]` or `undefined` if shipId dose not exist.
+ `fleetShipDataSelectorFactory(fleetId)`: returns selector of all ships in the given fleet. in format `[_ship, $ship]` or `undefined` if fleetId dose not exist

Besides, some special selectors are:
+ `stateSelector`: returns whole store. Used only when composing new selector, for example, `fleetShipsDataSelectorFactory`.
+ `extensionSelectorFactory(extKey)`: returns `store.ext[<extKey>]`. When a plugin exports `reducer` calling it with `extKey` will return store for the reducer.

And also helper function:
+ `createDeepCompareArraySelector`: similar to `createSelector` but will  strict equality compare(`===`) on every element of array. If every element is strictly equal, they will be consider equal. This can be used in slectors with many elements composing arrays.

Pay attention that __slectors are not generally safe__, developers are supposed to handle exceptions on their own, especially considering the case of freshly installed poi and not logged in (the store is nearly empty).

#### Redux action
If you consider maintaining reducers, you may need some Redux actions dispatched by main poi:
+ `@@Request/kcsapi/<api>`, such as `@@Request/kcsapi/api_port/port` , dispatched before game request is to be sent, in format
```javascript
  action.
    type        // `@@Request/kcsapi/<api>`
    method      // 'GET' | 'POST' | ...
    path        // `/kcsapi/<api>`
    body        // Request body
```
+ `@@Response/kcsapi/<api>`, such as `@@Response/kcsapi/api_port/port`, dispatched after response is received, in format
```javascript
  action.
    type        // `@@Response/kcsapi/<api>`
    method      // 'GET' | 'POST' | ...
    path        // `/kcsapi/<api>`
    body        // Response body
    postBody    // Request body
```
+ `@@BattleResult`, dispatched after a battle ends. If you need battle result, please use this action instead of listening to `@@Response/kcsapi/api_req_sortie/battleresult`. It is because the battle processing and storage is in the latter action, and the disordered reducer may cause error. it is in format
```javascript
    type: '@@BattleResult',
    result:
      valid              // always true
      rank               // *String*, 'S' | ... | 'D'
      boss               // *Boolean*
      map                // *Number*, 11 | ... | 54 | ...
      mapCell            // *Number*, same as api_no in api_req_map/next, it is actually route number not cell number
      quest              // *String*, map name
      enemy              // *String*, enemy fleet name
      combined           // *Boolean*
      mvp                // *Array*,  single fleet: [<mvp>, <mvp>] combined fleet: [<mvpFlee1>, <mvpFleet2>], format is 1 | ... | 6 | -1 (none)
      dropItem           // *Object*, see api_get_useitem
      dropShipId         // *Number*, drop ship's api_id
      deckShipId         // *Array*, ships' api_id, concated when combined fleet
      deckHp             // *Array*, HP at battle's end, concated when combined fleet
      deckInitHp         // *Array*, HP at battle's start, concated when combined fleet
      enemyShipId        // *Array*, enemy ships' api_ship_id
      enemyFormation     // *Number*, same as api_formation
      enemyHp            // *Array*, HP at battle's end
      eventItem          // *Object* | null, same as api_get_eventitem
      time               // *Number* Start time of the battle
```

#### Promise Action
poi intergrates [`redux-thunk`](https://github.com/gaearon/redux-thunk) for asynchronous manupulations. Besides dispatching a plain object, you may dispatch a function with argument `(dispatch, getState) => {}`, in which you may asynchronously work with data and dispatch actions.

You may also use poi's `PromiseAction` API for dispatching promise. The arguments are:
+ `actionNameBase`: *String*
+ `promiseGenerator`: *function* with no argument, returning a promise
+ `args`：anything, optional, will be passed to promiseGenerator and each action

dispatching an instance of the class will generate 3 actions:
```javascript
   // dispathed before running promiseGenerator
   {
     type: `${actionNameBase}`,
     args,
   }
   // dispatched after promise resolve
   {
     type: `${actionNameBase}@then`,
     result: <result>,
     args,
   }
   // dispatch after promise on error
   {
     type: `${actionNameBase}@catch`,
     error: <error>
     args,
   }
```

An example:
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
[`redux-observers`](https://github.com/xuoe/redux-observers) is used to monitor certain path of store and reacts when it changes. The manupulation may be just store the data or compute with some functions, or even dispatch a new action. You can refer to its documents for more details.

It should be note that if you define an observer in your plugin, it should be removed when plugin is disabled with the returned `unsubscribeFunc` from your call of `observe`.

Example:

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

### Events
poi use a few global events for communication. Since overusing events will break program's hierarchy and complexifies the procedures, avoid events if possible.

Corresponding to `@@Request/kcsapi/<api>` and `@@Response/kcsapi/<api>`, 2 events are emitted before sending request and after receiving responses, they are:
```javascript
window.addEventListener('game.request', function (e) {
  e.detail.method // HTTP method (POST / GET)
  e.detail.path // API path
  e.detail.body // data to send
});
window.addEventListener('game.response', function (e) {
  e.detail.method // HTTP method (POST / GET)
  e.detail.path // API path
  e.detail.body // returned data
  e.detail.postBody // data sended
});
```
Normally you don't have to listen to these events, especially when you have react component. You should write reducers and listen to redux actions for data maintenance. If you use events, React will have to re-render 2 times, one after action and one after event, which increases the cost and should be avoid. You should not use these events for data storage, either. Use observer for monitoring store instead.

There do exist cases when you may use them. For backend service, listening to events won't change panel data, but only manupulations like storaging, sending packet for other server, etc.


## Developing window plugins
For window plugins, as they are running on memory-independent processes, they cannot import code from main poi. Electron provides `remote` module for interaction with main program. `remote.require` can import modules from remote, and `remote.getGlobal` can import globals from remote. Note that all methods related to remote is asynchronous with no returned value.

### Environment variables
You may use the code below for loading same environment variables as main poi.
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

### Theming
You may use theme API from main poi to let your window plugin use the same theme.
```javascript
require(`${ROOT}/views/env-parts/theme`) // if you've loaded ROOT variable
```
The API will load stylesheets for `bootstrap`, `font-awesome`, and user defined `custom.css`, you may append following `<link>` tags into your `<head>`.
```html
<link rel="stylesheet" id="bootstrap-css">
<link rel="stylesheet" id="fontawesome-css">
<link rel="stylesheet" id="custom-css">
```

The zooming factor in main poi is not inherit, so you have to deal with it yourself, for example, zooming the font size only to get rid of window size issues.

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

## Inter-Plugin Call

Import IPC module
```javascript
var ipc = window.ipc;
```

Register plugin's API:
You should use `pluginName` as `scope_name`.
```javascript
ipc.register("scope_name", {
  api_name:   @ref_to_function
  api_name2:  @ref_to_function_2
});
```

Unregister plugin's API:
```javascript
ipc.unregister("scope_name", "api_name");
ipc.unregister("scope_name", ["api_name", "api_name2"]);
ipc.unregister("scope_name", {
  api_name:   @whatever
  api_name2:  @whatever
});
ipc.unregisterAll("scope_name");
```

Call other plugin's API:
NOTICE: All calls are asynchronous. You mustn't expect a return value.
```coffeescript
scope = ipc.access("scope_name");
scope?.api_name?(args);
```

Call an API of all plugins：
```javascript
ipc.foreachCall("api_name", arg1, arg2, ...)
```

## i18n

Poi supports i18n with `i18n-2` package.

Place your translation files in the path indicated by `poiPlugin.i18nDir` of `package.json`, and the translation object `window.i18n[plugin id]` will be automatically created.

For panel plugin, use `translated = window.i18n[plugin id].__(toTranslate)` to get string translated.

`poi-plugin-translator` provides English / Korean localization for ship and item names, etc.

For i18n of game resources, poi predefines a translation method, for non-window plugin, it can be called as below:

```javascript
resource = window.i18n.resources.__('to translate')
```

For window plugin, you have to create yourself translation object.

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

It is recommended to translate the window title
```javascript
document.title = window.__('your-plugin')
```

Please refer to [i18n-2](https://github.com/jeresig/i18n-node-2) for more information on i18n-2 package.

## Debugging

To load you dev version of plugin in poi, the recommended way is to use [npm link](https://docs.npmjs.com/cli/link).

First run `npm link` in your dev directory (may require admin privilege), and them run `npm link PLUGIN-PACKAGE-NAME` in poi's `APPDATA_PATH`'s plugins sub folder.

See [Debugging Guide](debug.md#software-debugging-guide) for more detail

## Plugin publishing specification
### Publishing on [npm](http://npmjs.org)

Publishing on npm facilitates versioning, and poi will use reloaded npm module to update plugin to new version.

For more info, you can read npm's docs:  [package.json](https://docs.npmjs.com/files/package.json) and [npm publish](https://docs.npmjs.com/cli/publish).

Package name should begin with `poi-plugin-` to make it detected by poi.

### Publishing a beta version

It is possible to publish a beta version on npm for beta testers and early access users。Plugin's beta version number should be something like `x.y.z-beta.a`, say, `"version": "2.2.0-beta.0"`. When publishing on npm, use `beta` tag instead of `latest` tag.

Correspondingly, stable version number should be in `x.y.z` format, following [Semantic Versioning](http://semver.org/).

Example command is:

`npm publish --tag beta`

### Publishing plugin as installable archive

Installable archive should be packaged in tar.gz format for users who want to download and install offline.

Example command is:

```
cd path/to/[repo] && npm i
cd .. && tar cvf [repo] [repo].tar.gz
```

## Some hints

+ plugin that displayed on panel will be wrapped by `<div id='plugin-name' />`, so it is recommended to use `#plugin-name` selector in plugin's stylesheet to avoid touching global styles.

## Plugin examples

Poi's internal components are structured like plugins, you can find their codes in views/componets.

More plugins are available as reference on poooi(https://github.com/poooi)


## Community
Welcome to become developer for poi. You may post your questions and ideas as github issues, or join our [telegram group](https://telegram.me/joinchat/AoMUpkCr6B8uH7EUewq6eQ) for discussions.
