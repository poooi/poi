Promise = require 'bluebird'
path = require 'path-extra'
semver = require 'semver'
npm = require 'npm'
async = Promise.coroutine
React = require 'react'
fs = Promise.promisifyAll require 'fs-extra'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
windowManager = remote.require './lib/window'

# we need only glob here
globAsync = Promise.promisify require 'glob'

utils = remote.require './lib/utils'

{config, language, notify, proxy} = window
envKeyList = ['_teitokuLv', '_nickName', '_nickNameId', '_teitokuExp', '_teitokuId', '_slotitems', '_ships', '_decks', '_ndocks']

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
      production: true
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
  readPlugins: async (opt_notifyFailed) ->
    pluginPaths = yield Promise.promisify(globAsync)(path.join @pluginPath, 'node_modules', 'poi-plugin-*')
    @plugins_ = pluginPaths.map @readPlugin_
    for plugin_ in @plugins_
      if plugin_.enabled
        @loadPlugin(plugin_)
    if opt_notifyFailed
      @notifyFailed_()
    @plugins_ = _.sortBy @plugins_, 'priority'
    return @plugins_

  # emit @PLUGIN_RELOAD event, let valid plugins make effect
  emitReload: ->
    window.dispatchEvent @PLUGIN_RELOAD

  # read mirrors information and select the default one
  # @retrun {Promise<Array<Object>>}
  readMirrors: async ->
    @mirrors_ = yield Promise.promisify(fs.readJsonAsync)(@mirrorPath)
    mirrorConf = config.get 'packageManager.mirrorName', if navigator.language is 'zh-CN' then  "taobao" else "npm"
    proxyConf = config.get "packageManager.proxy", false
    betaCheck = config.get "packageManager.enableBetaPluginCheck", false
    yield @selectConfig(mirrorConf, proxyConf, betaCheck)
    return @mirrors_

  # select a mirror and set proxy config
  # @param {object, object, object} mirror name, is proxy enabled, is check beta plugin
  # @return {Promise<Object>} return the npm config
  selectConfig: async (name, enable, check) ->
    yield @getMirrors()
    if name?
      @config_.mirror = @mirrors_[name]
      config.set "packageManager.mirrorName", name
    if enable?
      @config_.proxy = enable
      config.set "packageManager.proxy", enable
    if check?
      @config_.betaCheck = check
      config.set "packageManager.enableBetaPluginCheck", check
    npmConfig =
      prefix: PLUGIN_PATH
      registry: @config_.mirror.server
    if @config_.proxy
      npmConfig.http_proxy = 'http://127.0.0.1:#{proxy.port}'
    else
      if npmConfig.http_proxy?
        delete npmConfig.http_proxy
    yield Promise.promisify(npm.load)(npmConfig)
    return @config_

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
  getMirrors: async ->
    if @mirrors_ != null
      return Promise.resolve @mirrors_
    else
      yield @readMirrors()

  # get the selected mirror
  # @return {Promise<Object>}
  getConf: async ->
    yield @getMirrors()
    return Promise.resolve @config_

  # get installed plugins
  # @return {Promise<Array<Plugin>>}
  getInstalledPlugins: ->
    @getFilteredPlugins_ (plugin) -> plugin.isInstalled

  # get uninstalled plugin settings, get from requirements_
  # @return {Promise<Object>}
  getUninstalledPluginSettings: async ->
    yield @getRequirements()
    installedPlugins = yield @getInstalledPlugins()
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

  # get all broken plugins
  # @return {Promise<Array<Plugin>>}
  # @private
  getBrokenPlugins: ->
    @getFilteredPlugins_ (plugin) -> plugin.isBroken

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
  getOutdatedPlugins: async (isNotif) ->
    # after getting mirrors, at least one mirror is set
    yield @getMirrors()
    plugins = yield @getInstalledPlugins()
    outdatedPlugins = []
    outdatedList = []
    tasks = plugins.map async (plugin, index) =>
      if semver.lt(POI_VERSION, plugin.earlistCompatibleMain)
        @plugins_[index]?.isOutdated = @plugins_[index].needRollback
        @plugins_[index]?.lastestVersion = @plugins_[index]?.lastApiVer
      else try
        distTag = yield Promise.promisify(npm.commands.distTag)(['ls', plugin.packageName])
        latest = "#{plugin.version}"
        if @config_.betaCheck && distTag.beta?
          if semver.gt distTag.beta, latest
            latest = distTag.beta
        if semver.gt distTag.latest, latest
          latest = distTag.latest
        if semver.gt latest, plugin.version
          outdatedPlugins.push plugin
          @plugins_[index]?.isOutdated = true
          @plugins_[index]?.lastestVersion = latest
          if plugin.isRead then outdatedList.push plugin.name
    yield Promise.all(tasks)
    if isNotif && outdatedList.length > 0
      content = "#{outdatedList.join(' ')} #{__ "have newer version. Please update your plugins."}"
      notify content,
        type: 'plugin update'
        title: __ 'Plugin update'
        icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png')
        audio: "file://#{ROOT}/assets/audio/update.mp3"
    return outdatedPlugins
  # get all plugins which match a filer function
  # @param {!function(Plugin): boolean} filter
  # @return {Promise<Array<Plugin>>}
  # @private
  getFilteredPlugins_: async (filter) ->
    yield @getRequirements()
    yield @getPlugins()
    return @plugins_.filter filter

  # get a status of a plugin
  # @param {Plugin} plugin
  # @return {number} one of status code
  getStatusOfPlugin: (plugin) ->
    if plugin.isBroken || plugin.needRollback
      return @BROKEN
    if not plugin.isRead
      return @DISABLED
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
    return plugin.enabled

  # update one plugin
  # @param {Plugin} plugin
  # @return {Promise<>}
  updatePlugin: async (plugin) ->
    yield @getMirrors()
    plugin.isUpdating = true
    try
      yield Promise.promisify(npm.commands.install)(["#{plugin.packageName}@#{plugin.lastestVersion}"])
      #plugin.isUpdating = false
      #plugin.isOutdated = false
      #plugin.version = plugin.lastestVersion
      @reloadPlugin(plugin)
    catch error
      plugin.isUpdating = false
      throw error

  # install one plugin and read it
  # @param {string} name
  # @return {Promise<Plugin>}
  installPlugin: async (name) ->
    yield @getMirrors()
    try
      data = yield Promise.promisify(npm.commands.install)([name])
      readPlugins = yield @getReadPlugins()
      # Make sure if the plugin is unavailable.
      # if available, update information.
      for [packInfo, packPath] in data
        [packName, packVersion] = packInfo.split('@')
        continue if !packName.startsWith('poi-plugin-')
        plugin = readPlugins.find (plugin_) -> packName == plugin_.packageName
        if plugin?
          # If the installed plugin is one of the existing plugins
          if plugin.version != packVersion
            @reloadPlugin(plugin)
        else
          # If the installed plugin is a new plugin
          @addPlugin(path.join @pluginPath, 'node_modules', packName)
          break
      @plugins_ = _.sortBy @plugins_, 'priority'
    catch error
      console.log "installPlugin error: #{error}"
      console.log error.stack
      throw error

  # uninstall one plugin, this won't unload it from memory
  # @param {Plugin} plugin
  # @return {Promise<>}
  uninstallPlugin: async (plugin) ->
    yield @getMirrors()
    try
      yield Promise.promisify(npm.commands.uninstall)([plugin.packageName])
      @unloadPlugin(plugin)
      @removePlugin(plugin)
    catch error
      console.log "uninstallPlugin error: #{error}"
      console.log error.stack
      throw error

  # enable one plugin
  # @param {Plugin} plugin
  enablePlugin: (plugin) ->
    config.set "plugin.#{plugin.id}.enable", true
    plugin.enabled = true
    # Require plugin
    if !plugin.isRead && !plugin.isBroken
      for plugin_, index in @plugins_
        if plugin.packageName == plugin_.packageName
          try
            pluginMain = require plugin.pluginPath
            pluginMain.isRead = true
          catch error
            pluginMain = isBroken: true
          _.extend pluginMain, @plugins_[index]
          pluginMain.isRead ?= false
          @plugins_[index] = pluginMain
          plugin = @plugins_[index]
          break
    @loadPlugin(plugin)

  # disable one plugin
  # @param {Plugin} plugin
  disablePlugin: (plugin) ->
    config.set "plugin.#{plugin.id}.enable", false
    plugin.enabled = false
    @unloadPlugin(plugin)

  # load one plugin
  # @param {Plugin} plugin
  loadPlugin: (plugin) ->
    return if !plugin?
    # Update envData of localStorage when plugin.useEnv && envData is outdated
    if plugin.useEnv && !window._portStorageUpdated
      for key in envKeyList
        localStorage[key] = JSON.stringify window[key]
      window._portStorageUpdated = true
    # Create window when the plugin has a window
    if plugin.windowURL?
      if plugin.windowOptions?
        windowOptions = plugin.windowOptions
      else
        windowOptions =
          x: config.get 'poi.window.x', 0
          y: config.get 'poi.window.y', 0
          width: 800
          height: 600
      _.extend windowOptions,
        realClose: plugin.realClose
      if plugin.multiWindow
        plugin.handleClick = ->
          pluginWindow = windowManager.createWindow windowOptions
          pluginWindow.loadURL plugin.windowURL
          pluginWindow.show()
      else if plugin.realClose
        plugin.pluginWindow = null
        plugin.handleClick = ->
          if !plugin.pluginWindow?
            plugin.pluginWindow = windowManager.createWindow windowOptions
            plugin.pluginWindow.on 'close', ->
              plugin.pluginWindow = null
            plugin.pluginWindow.loadURL plugin.windowURL
            plugin.pluginWindow.show()
          else
            plugin.pluginWindow.show()
      else
        plugin.pluginWindow = windowManager.createWindow windowOptions
        plugin.pluginWindow.loadURL plugin.windowURL
        plugin.handleClick = ->
          plugin.pluginWindow.show()
    # Lifecycle
    plugin.pluginDidLoad() if typeof plugin.pluginDidLoad is 'function'
    @emitReload()

  # unload one plugin
  # @param {Plugin} plugin
  unloadPlugin: (plugin) ->
    return if !plugin?
    # Lifecycle
    plugin.pluginWillUnload() if typeof plugin.pluginWillUnload is 'function'
    # Destroy window
    windowManager.closeWindow(plugin.pluginWindow) if plugin.pluginWindow?
    @emitReload()

  removePlugin: (plugin) ->
    delete require.cache[require.resolve plugin.pluginPath]
    for plugin_, index in @plugins_
      if plugin.packageName == plugin_.packageName
        @plugins_.splice(index, 1)
        break
    @emitReload()

  addPlugin: (pluginPath) ->
    plugin = @readPlugin_ pluginPath
    @plugins_.push plugin
    @plugins_ = _.sortBy @plugins_, 'priority'
    if plugin.enabled
      @loadPlugin(plugin)

  reloadPlugin: (plugin) ->
    @unloadPlugin(plugin)
    newPlugin = {}
    delete require.cache[require.resolve plugin.pluginPath]
    for plugin_, index in @plugins_
      if plugin.packageName == plugin_.packageName
        newPlugin = @readPlugin_ plugin.pluginPath
        @plugins_[index] = newPlugin
        break
    if plugin.enabled
      @loadPlugin(newPlugin)
    @plugins_ = _.sortBy @plugins_, 'priority'

  # read a plugin from file system
  # @param {string} pluginPath path to a plugin directory
  # @return {Plugin} the information for that plugin
  # @private
  readPlugin_: (pluginPath) ->
    # Read plugin.json
    try
      pluginData = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'plugin.json'))
    catch error
      pluginData = {}
      utils.error error
    # Read package.json
    try
      packageData = fs.readJsonSync path.join pluginPath, 'package.json'
    catch error
      packageData = {}
      utils.error error
    # Plugin data
    plugin = packageData.poiPlugin || {}
    plugin.packageData = packageData
    plugin.packageName = plugin.packageData.name || path.basename pluginPath
    plugin.name ?= plugin.title || plugin.packageName
    plugin.id ?= plugin.packageName
    plugin.author = plugin.packageData?.author?.name || 'unknown'
    plugin.author = plugin.packageData?.author if typeof plugin.packageData?.author is 'string'
    plugin.link = plugin.packageData?.author?.links || plugin.packageData?.author?.url || pluginData[plugin.packageName]?.link || "https://github.com/poooi"
    plugin.description ?= plugin.packageData?.description || pluginData[plugin.packageName]?["des#{window.language}"] || "unknown"
    plugin.pluginPath = pluginPath
    plugin.icon ?= 'fa/th-large'
    plugin.version = plugin.packageData?.version || '0.0.0'
    plugin.lastestVersion = plugin.version
    plugin.earlistCompatibleMain ?= '0.0.0'
    plugin.lastApiVer ?= plugin.version
    plugin.priority ?= 10000
    plugin.enabled = config.get "plugin.#{plugin.id}.enable", true
    plugin.isInstalled = true
    plugin.needRollback = semver.lt(POI_VERSION, plugin.earlistCompatibleMain) && semver.gt(plugin.version, plugin.lastApiVer)
    plugin.isOutdated = plugin.needRollback
    plugin.lastestVersion = plugin.lastApiVer if semver.lt(POI_VERSION, plugin.earlistCompatibleMain)
    # i18n
    i18nFile = null
    if plugin.i18nDir?
      i18nFile = path.join pluginPath, plugin.i18nDir
    else
      try
        fs.accessSync path.join pluginPath, 'i18n'
        i18nFile = path.join pluginPath, 'i18n'
      catch error
        try
          fs.accessSync path.join pluginPath, 'assets', 'i18n'
          i18nFile = path.join pluginPath, 'assets', 'i18n'
    if i18nFile?
      namespace = plugin.id
      window.i18n[namespace] = new (require 'i18n-2')
        locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
        defaultLocale: 'zh-CN',
        directory: i18nFile,
        updateFiles: false,
        indent: "\t",
        extension: '.json'
        devMode: false
      window.i18n[namespace].setLocale(window.language)
      plugin.name = window.i18n[namespace].__ plugin.name
      plugin.description = window.i18n[namespace].__ plugin.description
    # Display name
    icon = plugin.icon.split('/')[1] || plugin.icon || 'th-large'
    plugin.displayName =
      <span>
        <FontAwesome key={0} name=icon />
        {' ' + plugin.name}
      </span>
    # Require plugin
    if plugin.enabled && !plugin.needRollback
      try
        pluginMain = require pluginPath
        pluginMain.isRead = true
        # For plugin with api v1
        plugin.displayName = pluginMain.displayName if pluginMain.displayName?
      catch error
        pluginMain = isBroken: true
      _.extend pluginMain, plugin
      plugin = pluginMain
      plugin.isRead ?= false
    return plugin

  # notify user about unread plugins, only shown when any exists
  # @private
  notifyFailed_: async ->
    plugins = yield @getBrokenPlugins()
    unreadList = []
    for plugin in plugins
      unreadList.push plugin.name
    if unreadList.length > 0
      content = "#{unreadList.join(' ')} #{
        __ 'failed to load. Maybe there are some compatibility problems.'}"
      notify content,
        type: 'plugin error'
        title: __ 'Plugin error'
        icon: path.join ROOT, 'assets', 'img', 'material', '7_big.png'
        audio: "file://#{ROOT}/assets/audio/fail.mp3"

pluginManager = new PluginManager path.join(ROOT, 'assets', 'data', 'plugin.json'), PLUGIN_PATH,
  path.join(ROOT, 'assets', 'data', 'mirror.json')

module.exports = pluginManager
