# Plugin development

Poi is based on web, and all UI and procedure are done with web development techniques. Developers
are supposed to have knowledge of following subjects:

+ HTML, CSS
+ JavaScript（ECMAScript 7）or [CoffeeScript](http://coffeescript.org/) (not recommended)
+ [Node.js](https://nodejs.org) as well as [npm](http://npmjs.com/)
+ [React.js](http://facebook.github.io/react/)
+ [Redux](http://redux.js.org/) as well as [react-redux](https://github.com/reactjs/react-redux)
+ [Electron](https://github.com/atom/electron)

documents of following libraries may be also useful during development:

+ [reselect](https://github.com/reactjs/reselect)
+ [react-bootstrap](http://react-bootstrap.github.io/components.html)
+ [redux-observers](https://github.com/xuoe/redux-observers)

Finally, it is recommended to follow some development instructions below.

## Brief Introduction
A poi plugin is essentially a node module. Installing, removing or updating the plugin are therefore manupulations on the plugin by poi itself.

A plugin should follow npm related specifications, a [`package.json`](https://docs.npmjs.com/files/package.json) under plugin root directory is necessary. The mounting point is specified in `main` field, and, if not provided, will be `index.js`, `index.coffee`, `index.cjsx`, or `index.es`.

plugin will interact with poi using:
+ information provided in `package.json`
+ code executed when importing (using `import` or `require` syntax) the module
+ imported variables

For example, if a plugin is inside poi main interface (*panel plugin*), a React component should be exported; if it is a standalone window plugin (*window plugin*), it should export content index page (`index.html`); plugins that does not contain any user-interface will just run in the back-end.

Of course there will be many arguments related to installation, upgrade, removing, executing and setting.

## Plugin life cycle
The procedure between the moment plugin is installed, updated, or enabled in settings panel, and the moment it start to work, is called *enable plugin*. During this procedure, poi will:

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
`package.json` is standard file for npm module metadata, its structured can be refered in [npm offical documents](https://docs.npmjs.com/files/package.json). poi makes use of parts of its standard field, and also extra field for plugin's own information.

Standard metadata used are:
+ `version`: *String*, plugin version in [Semantic Versioning](http://semver.org/) format, e.g. `x.y.z` for stable version, `x.y.z-beta.a` for beta version.
+ `author`: author for plugin
 + if *String*, it is the name of author
 + if *Object*, then `name` is the name of author,`links` or `url` is the links to the author.
+ `description`: *String*, brief description

Extra information is stored in `poiPlugin` field, including:
+ `title`: *String*, title for plugin, displayed in plugin list and menu. Will be translated provided in i18n keys.
+ `id`: *String*, key for identify the plugin. Will be package name if empty.
+ `priority`: *Number*, priority in plugin menu, smaller value will make it more ahead. Generally the order is panel plugin < window plugin < non UI plugin, but it is not obliged.
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



## Interfaces
In index, following interfaces are available:

+ HTML DOM API
+ Javascript in chrome 47
+ All functionality of Node.js
+ API exposed by poi

## API exposed by poi

### Essential development environment and its variables

```javascript
window =
  React // React
  ReactBootstrap // React Bootstrap
  FontAwesome // React FontAwesome
  jQuery // jQuery, not recommended to use unless you really need it
  _ // Underscore
  $ // equivalent to document.querySelector
  $$ // equivalent to document.querySelectorAll
  ROOT // poi's root path, namely path where package.json and index.html reside
  APPDATA_PATH // path to store user data on Windows it will be %AppData%/poi, on Linux it will be ~/.config/poi
  POI_VERSION // poi version
```

### Game data

Poi exposes API related to game data as global variables, you can fetch following information in `window`:

```javascript
window =
  // variable beginning with $ is basic data, not related to user
  $ships: Array // basic data for all ships in game, same as the received data, index by api_id
  $shipTypes: Array // basic data for all ships in game, same as the received data, index by api_id
  $slotitems: Array // basic data for all equipments in game, same as the received data, index by api_id
  $mapareas: Array // basic data for all map areas in game, same as the received data, index by api_id
  $maps: Array // basic data for all maps in game, same as the received data, index by api_id
  $missions: Array // basic data for all expeditions in game, same as the received data, index by api_id
  // variable beginning with _ is user data
  _ships: Object // all ships owned by player, index by api_id
  _slotitems: Object // all equipments owned by player, index by api_id
  _decks: Array // player fleets
  _nickName: String // Player's name
  _teitokuId: String // Player's ID
  _teitokuLv: Number // Player's level
  _teitokuExp: Number // Player's experience
```

Poi exposes game data communication as global events, can be accessed via `window.addEventListener` to obtain information on data sending/receiving:

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

### Notifications API

```javascript
window.log('Something'); // display on the information bar below game window
window.warn('Something'); // display on the information bar below game window
window.error('Something'); // display on the information bar below game window
window.success('Something'); // display on the information bar below game window
window.notify('Something'); // desktop notification
window.toggleModal('Title', 'Content'); // display modal, Content can be HTML
// if you need to customize buttons
var footer = {
  name: String, // button display name
  func: Function, // action on clicking the button
  style: String in ['default', 'primary', 'success', 'info', 'danger', 'warning'] // button style
}
window.toggleModal('Title', 'Content', footer);
```

### Config API

```javascript
window.config.get('path.to.config', 'default'); // get a user config value, if fail, return the default value
window.config.set('path.to.config', 'some value'); // save a user config value, not providing value will delete the config path
window.layout // current layout = 'horizontal' || 'vertical'
window.theme // current theme
```

### Inter-Plugin Call

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

## Window plugin development

New windows are created by `windowManager`. More information about `createWindow` method can be found in Electron's' [new BrowserWindow method](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#new-browserwindowoptions)。

index.cjsx
```coffeescript
{remote} = require 'electron'
windowManager = remote.require './lib/window'

window.pluginWindow = null # retain a global reference to prevent pluginWindow's GC
initialPluginWindow = ->
  window.pluginWindow = windowManager.createWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: 820
    height: 650
    indexName: 'pluginName' # if you want to add an index in global.windowsIndex
  window.pluginWindow.loadURL "file://#{__dirname}/index.html"
initialItemImprovementWindow()

module.exports =
  name: 'Sample'
  displayName: 'Sample'
  handleClick: ->
    window.pluginWindow.show()
```
Rendered index.html:
```html
<html><body><h1>It works</h1></body></html>
```

Since environment variables in new window process are different from those in main process, use following code to load same variables from main program.

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

Poi supports i18n with the `i18n-2` package.

It is recommended that the i18n object be attached to
`window.i18n`, as following:

```coffeescript
window.i18n.pluginName = new (require 'i18n-2')
  locales:['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
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

You can get translations after placing files in specified folders

```coffeescript
translated = __ 'to translate'
```

For more information on i18n-2 package, please refer to [i18n-2](https://github.com/jeresig/i18n-node-2)

For i18n of game resources, poi predefines a translation method, for non-window plugin, it can be called as below:

```coffeescript
resource = window.i18n.resources.__ 'to translate'
```

For new-window plugin, package should be called

```coffeescript
# returns default value if there's no poi-plugin-translator (the plugin converting kanji names into romaji). If you have already required `ROOT/view/env`, these lines can be omitted.
if !window.i18n?
  window.i18n = {}
window.i18n.resources = {}
window.i18n.resources.__ = (str) -> str
window.i18n.resources.translate = (locale, str) -> str
window.i18n.resources.setLocale = (str) -> return

try
  Translator = require 'poi-plugin-translator'
catch error
  console.log error

resource = window.i18n.resources.__ 'to translate'
```

## Debugging

See [Debugging Guide](debug.md#software-debugging-guide)

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
