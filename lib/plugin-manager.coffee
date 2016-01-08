Promise = require 'bluebird'
path = require 'path-extra'
semver = require 'semver'
npm = require 'npm'

fs = Promise.promisifyAll require 'fs-extra'

# we need only glob here
globAsync = Promise.promisify require 'glob'

utils = require './utils'

{config, language, notify} = window

# dummy class, no plugin is created by call the constructor
class Plugin
  # @private
  constructor: ->
    # @type {string}
    # use name in `package.json`, or plugin.name itself as fallback
    @packageName
    # @type {?Object}
    # data read from `package.json`, null if failed
    @packageData
    # @type {boolean}
    # whether the plugin is read
    @isRead
    # @type {boolean}
    # whether the plugin is outdated
    @isOutdated
    # @type {boolean}
    # whether the plugin occurs in file system
    @isInstalled
    # @type {string=}
    # the lastest version of plugin
    @lastestVersion
    # @type {boolean=}
    @isUpdating
    # @type {boolean=}
    # whether the plugin is being removing
    @isUninstalling
    # for other properties please refer to `docs/plugin-?.md`

class PluginManager
  # @param {string} packagePath path to a json which has plugin requirements
  # @param {string} pluginPath path to the plugin root
  #   shall have `node_modules` as a direct subdirectory
  # @param {string} mirrorPath path to a json which has plugin mirror
  constructor: (@packagePath, @pluginPath, @mirrorPath) ->
    # @private {?Object} plugin requirements
    @requirements_ = null
    # @private {?Array<Plugin>} all plugins
    @plugins_ = null
    # @private {?Array<Object>} mirror information
    @mirrors_ = null
    # @private {?Object} selected mirror
    @mirror_ = null

    # @const
    @VALID = 0
    @DISABLED = 1
    @NEEDUPDATE = 2
    @BROKEN = 3

    # @const
    @PLUGIN_RELOAD = new Event 'PluginManager.PLUGIN_RELOAD'

  # read package information
  # @return {Promise<?Object>}
  readPackage: ->
    fs.readJsonAsync(@packagePath).then (@requirements_) =>

  # read all plugins from file system
  # @param {boolean=} opt_notifyFailed notify user about unread plugins
  # @return {Promise<Array<Plugin>>}
  readPlugins: (opt_notifyFailed) ->
    globAsync(path.join @pluginPath, 'node_modules', 'poi-plugin-*')
      .then (pluginPaths) =>
        @plugins_ = pluginPaths.map @readPlugin_
        if opt_notifyFailed
          @notifyFailed_()
        return @plugins_

  # emit @PLUGIN_RELOAD event, let valid plugins make effect
  emitReload: ->
    window.dispatchEvent @PLUGIN_RELOAD

  # read mirrors information and select the default one
  # @retrun {Promise<Array<Object>>}
  readMirrors: ->
    fs.readJsonAsync(@mirrorPath).then (@mirrors_) =>
      @selectMirror(config.get 'packageManager.mirror', 0).then =>
        @mirrors_

  # select a mirror based on index
  # @param {number} index
  # @return {Promise<Object>} return the selected mirror
  selectMirror: (index) ->
    @getMirrors().then =>
      @mirror_ = @mirrors_[index]
      config.set "packageManager.mirror", index
      new Promise (resolve) =>
        npm.load {
          prefix: PLUGIN_PATH
          registry: @mirror_.server
          http_proxy: 'http://127.0.0.1:12450'
        }, =>
          resolve @mirror_

  # set the update relative information to plugins
  # @return {Promise<>}
  setUpdateInformation: ->
    @getMirrors().then =>
      @getInstalledPlugins().then =>
        Promise.all(@plugins.map (plugin) =>
          @getLastestVersionOfPlugin(plugin).then (version) ->
            plugin.lastestVersion = version
            plugin.isOutdated = semver.lt plugin.version, plugin.lastestVersion
        )

  # get the current plugins
  # @return {Promise<Array<Plugin>>}
  getPlugins: ->
    if @plugins_ != null
      return Promise.resolve @plugins_
    else
      return @readPlugins()

  # get the current requirements
  # @return {Promise<Object>}
  getRequirements: ->
    if @requirements_ != null
      return Promise.resolve @requirements_
    else
      return @readPackage()

  # get the mirrors
  # @return {Promise<Array<Object>>}
  getMirrors: ->
    if @mirrors_ != null
      return Promise.resolve @mirrors_
    else
      return @readMirrors()

  # get the selected mirror
  # @return {Promise<Object>}
  getMirror: ->
    @getMirrors().then =>
      return Promise.resolve @mirror_

  # get installed plugins
  # @return {Promise<Array<Plugin>>}
  getInstalledPlugins: ->
    @getFilteredPlugins_ (plugin) -> plugin.isInstalled

  # get uninstalled plugin settings, get from requirements_
  # @return {Promise<Object>}
  getUninstalledPluginSettings: ->
    @getRequirements().then =>
      @getInstalledPlugins().then (installedPlugins) =>
        installedPluginNames = installedPlugins.map (plugin) ->
          plugin.packageName
        uninstalled = {}
        for name, value of @requirements_
          if name not in installedPluginNames
            uninstalled[name] = value
        return uninstalled

  # get all read plugins
  # @return {Promise<Array<Plugin>>}
  getReadPlugins: ->
    @getFilteredPlugins_ (plugin) -> plugin.isRead

  # get all unread plugins
  # @return {Promise<Array<Plugin>>}
  # @private
  getUnreadPlugins: ->
    @getFilteredPlugins_ (plugin) -> not plugin.isRead

  # get all unread plugin names, base on package settings or path
  # @return {Promise<Array<string>>}
  getUnreadPluginNames: ->
    @getUnreadPluginPaths_().then (paths) =>
      paths.map (path) =>
        basename = path.basename path
        if @requirements_[basename]?
          return @requirements_[basename][language]
        else
          return basename

  # get all valid plugins, see comment of @isValid_
  # @return {Promise<Array<Plugin>>}
  getValidPlugins: ->
    @getFilteredPlugins_ @isValid_.bind @

  # get all plugins met requirement
  # @return {Promise<Array<Plugin>>}
  getMetRequirementPlugins: ->
    @getFilteredPlugins_ @isMetRequirement_.bind @

  # get all plugins that are outdated
  # @return {Plugin<Array<Plugin>>}
  getOutdatedPlugins: ->
    # after getting mirrors, at least one mirror is set
    @getMirrors().then =>
      new Promise (resolve) =>
        npm.commands.outdated [], (err, data) =>
          # data is an Array<Array<>> represents outdated plugins
          # each element of data is in this format
          # [
          #   path,
          #   packageName,
          #   currentVersion,
          #   wantedVersion,
          #   lastestVersion,
          #   "lastest"
          # ]
          names = data.map (item) -> item[1]
          @getInstalledPlugins().then (plugins) ->
            resolve plugins.filter (plugin) -> plugin.packageName in names

  # get all plugins which match a filer function
  # @param {!function(Plugin): boolean} filter
  # @return {Promise<Array<Plugin>>}
  # @private
  getFilteredPlugins_: (filter) ->
    @getRequirements().then =>
      @getPlugins().then =>
        return @plugins_.filter filter

  # get a status of a plugin
  # @param {Plugin} plugin
  # @return {number} one of status code
  getStatusOfPlugin: (plugin) ->
    if not plugin.isRead
      return @BROKEN
    if not @isMetRequirement_ plugin
      return @NEEDUPDATE
    if not @isEnabled_ plugin
      return @DISABLED
    return @VALID

  # determine whether a plugin is valid
  # which means read, enabled and met requirement
  # @param {Plugin}
  # @return {boolean}
  # @private
  isValid_: (plugin) ->
    if not plugin.isRead
      return false
    if not plugin.isInstalled
      return false
    if not @isEnabled_ plugin
      return false
    return @isMetRequirement_ plugin

  # determine whether a plugin met requirement
  # which means read, met requirement
  # @param {Plugin}
  # @return {boolean}
  # @private
  isMetRequirement_: (plugin) ->
    if not plugin.isRead
      return false
    if @requirements_[plugin.packageName]?.version?
      lowest = @requirements_[plugin.packageName].version
    else
      lowest = 'v0.0.0'
    return semver.gte plugin.packageData.version, lowest

  # determine whether a plugin is enabled
  # which means read, enabled
  # @param {Plugin}
  # @return {boolean}
  # @private
  isEnabled_: (plugin) ->
    if not plugin.isRead
      return false
    return config.get "plugin.#{plugin.name}.enable", true

  # get the lastest version of plugin based on npm
  # @param {Plugin}
  # @return {Promise<?string>}
  getLastestVersionOfPlugin: (plugin) ->
    # after getting mirrors, at least one mirror is set
    @getMirrors().then ->
      new Promise (resolve) ->
        npm.commands.outdated [plugin.packageName], (err, data) ->
          resolve data[4] or null

  # update one plugin
  # @param {Plugin} plugin
  # @return {Promise<>}
  updatePlugin: (plugin) ->
    plugin.isUpdating = true
    @getMirrors().then ->
      new Promise (resolve) ->
        npm.commands.update [plugin.packageName], ->
        plugin.isUpdating = false
        resolve()

  # install one plugin and read it
  # @param {string} name
  # @return {Promise<Plugin>}
  installPlugin: (name) ->
    @getMirrors().then =>
      new Promise (resolve) =>
        npm.commands.install [name], =>
          plugin = @readPlugin_ path.join @pluginPath, 'node_modules', name
          @plugins_.push plugin
          resolve plugin

  # uninstall one plugin, this won't unload it from memory
  # @param {Plugin} plugin
  # @return {Promise<>}
  uninstallPlugin: (plugin) ->
    plugin.isUninstalling = true
    @getMirrors().then ->
      new Promise (resolve) ->
        npm.commands.uninstall [plugin.packageName], ->
        plugin.isInstalled = false
        plugin.isUninstalling = false
        resolve()

  # enable one plugin
  # @param {Plugin} plugin
  enablePlugin: (plugin) ->
    config.set "plugin.#{plugin.name}.enable", true

  # disable one plugin
  # @param {Plugin} plugin
  disablePlugin: (plugin) ->
    config.set "plugin.#{plugin.name}.enable", false

  # read a plugin from file system
  # @param {string} pluginPath path to a plugin directory
  # @return {Plugin} the information for that plugin
  # @private
  readPlugin_: (pluginPath) ->
    try
      plugin = require pluginPath
      plugin.priority ?= 10000
      plugin.isRead = true
    catch error
      plugin = isRead: false

    try
      plugin.packageData = fs.readJsonSync path.join pluginPath, 'package.json'
    catch error
      plugin.packageData = {}
      utils.error error

    if plugin.packageData?.name?
      plugin.packageName = plugin.packageData.name
    else if plugin.name?
      plugin.packageName = plugin.name
    else
      plugin.packageName = path.basename pluginPath

    plugin.isInstalled = true
    plugin.isOutdated = false
    return plugin

  # notify user about unread plugins, only shown when any exists
  # @private
  notifyFailed_: ->
    @getUnreadPluginNames().then (names) ->
      if names.length > 0
        content = "#{names.join(' ')} #{
          __ 'failed to load. Maybe there are some compatibility problems.'}"
        notify content,
          type: 'plugin error'
          title: __ 'Plugin error'
          icon: path.join ROOT, 'assets', 'img', 'material', '7_big.png'
          audio: "file://#{ROOT}/assets/audio/fail.mp3"

pluginManager = new PluginManager path.join(ROOT, 'plugin.json'), PLUGIN_PATH,
  path.join(ROOT, 'mirror.json')

module.exports = pluginManager
