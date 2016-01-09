Promise = require 'bluebird'
path = require 'path-extra'
semver = require 'semver'
npm = require 'npm'
async = Promise.coroutine
React = require 'react'
fs = Promise.promisifyAll require 'fs-extra'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)

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
    # @private {?Object} npm config
    @config_ =
      mirror: null
      proxy: null
      betaCheck: null

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
      mirrorConf = config.get 'packageManager.mirrorName', if navigator.language is 'zh-CN' then  "taobao" else "npm"
      proxyConf = config.get "packageManager.proxy", false
      betaCheck = config.get "packageManager.enableBetaPluginCheck", false
      @selectConfig(mirrorConf, proxyConf, betaCheck).then =>
        @mirrors_

  # select a mirror and set proxy config
  # @param {object, object, object} mirror name, is proxy enabled, is check beta plugin
  # @return {Promise<Object>} return the npm config
  selectConfig: (name, enable, check) ->
    @getMirrors().then =>
      if name?
        @config_.mirror = @mirrors_[name]
        config.set "packageManager.mirrorName", name
      if enable?
        @config_.proxy = enable
        config.set "packageManager.proxy", enable
      if check?
        @config_.betaCheck = check
        config.set "packageManager.enableBetaPluginCheck", check
      new Promise (resolve) =>
        npmConfig =
          prefix: PLUGIN_PATH
          registry: @config_.mirror.server
        if @config_.proxy
          npmConfig.http_proxy = 'http://127.0.0.1:12450'
        else
          if npmConfig.http_proxy?
            delete npmConfig.http_proxy
        npm.load npmConfig, =>
          resolve @config_

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
  getConf: ->
    @getMirrors().then =>
      return Promise.resolve @config_

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
  getOutdatedPlugins: (isNotif) ->
    # after getting mirrors, at least one mirror is set
    @getMirrors().then =>
      new Promise (resolve) =>
        @getInstalledPlugins().then (plugins) =>
          outdatedPlugins = []
          outdatedList = []
          task = plugins.map (plugin) =>
            new Promise (resolve) =>
              npm.commands.distTag ['ls', plugin.packageName], (err, distTag) =>
                latest = plugin.version
                if @config_.betaCheck && distTag.beta?
                  if semver.gt distTag.beta, latest
                    latest = distTag.beta
                    if semver.gt distTag.latest, latest
                      latest = distTag.latest
                else
                  if semver.gt distTag.latest, latest
                    latest = distTag.latest
                if semver.gt latest, plugin.version
                  outdatedPlugins.push plugin
                  index = @plugins_.indexOf(plugin)
                  @plugins_[index].isOutdated = true
                  @plugins_[index].lastestVersion = latest
                  outdatedList.push plugin.stringName
                resolve()
          Promise.all(task).then =>
            if isNotif
              content = "#{outdatedList.join(' ')} #{__ "have newer version. Please update your plugins."}"
              notify content,
                type: 'plugin update'
                title: __ 'Plugin update'
                icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png')
                audio: "file://#{ROOT}/assets/audio/update.mp3"
            resolve outdatedPlugins

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

  # update one plugin
  # @param {Plugin} plugin
  # @return {Promise<>}
  updatePlugin: (plugin) ->
    @getMirrors().then =>
      new Promise (resolve) =>
        npm.commands.install ["#{plugin.packageName}@#{plugin.lastestVersion}"], (err) =>
          plugin.isUpdating = false
          if !err then resolve() else reject()

  # install one plugin and read it
  # @param {string} name
  # @return {Promise<Plugin>}
  installPlugin: (name) ->
    @getMirrors().then =>
      new Promise (resolve) =>
        npm.commands.install [name], (err) =>
          plugin = @readPlugin_ path.join @pluginPath, 'node_modules', name
          @plugins_.push plugin
          if !err then resolve plugin else reject()

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
      pluginData = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'plugin.json'))
    catch error
      pluginData = {}
      utils.error error

    try
      plugin = require pluginPath
      plugin.priority ?= 10000
      plugin.isRead = true
    catch error
      plugin = isRead: false
      plugin.version = '0.0.0'

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

    # Missing data of broken plugins

    if !plugin.displayName?
      if pluginData[plugin.packageName]?
        plugin.displayName =
          <span>
            <FontAwesome key={0} name=pluginData[plugin.packageName].icon />
            {' ' + pluginData[plugin.packageName][window.language]}
          </span>
      else
        plugin.displayName = plugin.packageName

    if !plugin.author?
      if pluginData[plugin.packageName]?
        plugin.author = pluginData[plugin.packageName].author
      else
        plugin.author = "unknown"

    if !plugin.link?
      if pluginData[plugin.packageName]?
        plugin.link = pluginData[plugin.packageName].link
      else
        plugin.link = "https://github.com/poooi"

    if !plugin.description?
      if pluginData[plugin.packageName]?
        plugin.description = pluginData[plugin.packageName]["des#{window.language}"]
      else
        plugin.description = "unknown"

    # For notifition
    if typeof plugin.displayName is 'string'
      plugin.stringName = plugin.displayName
    else if pluginData[plugin.packageName]?
        plugin.stringName = pluginData[plugin.packageName][window.language]
      else
        if plugin.displayName.props?.children?
          displayItems = plugin.displayName.props.children
        else
          if plugin.displayName.props?.children?
            displayItems = plugin.displayName.props.children
          else
            displayItems = plugin.displayName
          for child in displayItems
            if typeof child is "string"
              plugin.stringName = child

    plugin.isInstalled = true
    plugin.isOutdated = false
    if plugin.packageData?.version?
      plugin.version = plugin.packageData.version
    plugin.lastestVersion = plugin.version
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

pluginManager = new PluginManager path.join(ROOT, 'assets', 'data', 'plugin.json'), PLUGIN_PATH,
  path.join(ROOT, 'assets', 'data', 'mirror.json')

module.exports = pluginManager
