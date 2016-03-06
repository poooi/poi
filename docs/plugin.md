# Plugin development

Poi is based on web, and all UI and procedure are done with web development techniques. Developers
are supposed to have knowledge of following subjects:

+ Basic HTML, CSS and JavaScript
+ [React.js](http://facebook.github.io/react/)
+ [Node.js](https://nodejs.org)
+ [Electron](https://github.com/atom/electron)

For a comfortable developing experience, it is recommended that you know of following stuffs:

+ [CoffeeScript](http://coffeescript.org)
+ [CoffeeReact](https://github.com/jsdf/coffee-react)
+ [ReactBootstrap](http://react-bootstrap.github.io/components.html)

## Plugin Structure
Current plugin system is constructed as below:
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
On initiation, poi will visit all folders whose name begins with `poi-plugin-` under path `appData/plugins/node_modules`, and tries to load them as plugins. Here `appData` is path to store user data, on Windows it will be `%AppData%/poi`, on Unix-like OS it will be `~/.config/poi`.

Basically, a plugin can be loaded when it contains an index, which can be `index.js`, `index.coffee` or `index.cjsx`.

## Attributes of index
Index can expose its attributes via `export` method. Below are all attributes and their respective data type. Data type `String | ReactElement` means it will be directly displayed if it is a string, or rendered by React if a ReactElement.

```javascript
module.exports = {
  name: String // plugin name, in English
  displayName: String | ReactElement // plugin display name on UI
  priority: Number // priority for plugin order in plugin menu, smaller value appears in front
  show: Boolean // should the plugin be displayed
  realClose: Boolean // should the plugin process be terminated if it is closed, default is false
  author: String | ReactElement // plugin author
  link: String // plugin author's link
  description: String | ReactElement // plugin description
  version: String | ReactElement // plugin version
  reactClass: ReactClass // plugin's view and model, which will be rendered on poi's plugin panel with React.createClass
  handleClick: Function // with this attribute plugin's reactClass will be ignored and not displayed in plugin panel, instead developer can define the reaction on clicking, e.g. creating new window
};
```
Let's take an example, if you need a plugin that jumps to a new panel on clicking:
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
You can always use jsx, cjsx to simplify the code. Codes provided from now will be in cjsx. Code above is equivalent to:
```coffeescript
module.exports =
  name: 'Sample'
  displayName: 'Sample'
  reactClass: React.createClass
    render: ->
      <h1>It works</h1>
```
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

Setting environment variable `DEBUG` can activate debug mode.

Open developer tool and type in console:
```javascript
process.env.DEBUG = 1;
```

If you want to enter debug mode from the start (e.g. you want to debug `app.cjsx`), you can add `--debug` or `-d` argument to start poi:
```
electron poi --debug
```

Plugin can be set to activate debug code or not by `--debug-plugin=plugin-name` argument.

Take an example of ship-info, if following code is added:
```coffeescript
if process.env.DEBUG_PLUGIN is 'ship-info'
    shipInfoWindow.openDevTools
      detach: true
```
When the command to start poi contains `--debug-plugin=ship-info` argument, ship-info's dev tool will automatically prompt:
```
electron poi --debug-plugin=ship-info
```

`--debug` and `--debug-plugin` can be used at the same time

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
