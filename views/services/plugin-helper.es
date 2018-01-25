/*
   pluginHelper is a tool that provides convenient access to
   plugin-related operations and information.

   - window.pluginHelper.$reload(pkgNameOrShort, verbose=false, measureEnableTime=true)

       reload a plugin.

       pkgNameOrShort: full package name or the string after prefix 'poi-plugin-'
       verbose: bool, verbosity control
       measureEnableTime: bool, whether time duration of enabling a plugin should be printed

   - window.pluginHelper.$populate()

       most of the time you don't have to call this function, as it's called automatically by observer
       whenever the list of plugin changes.

       clear and reload all `window.pluginHelper.<pkgNameOrShort>` (see below)

   - window.pluginHelper.<pkgNameOrShort>.reload(verbose=false, measureEnableTime=true)

       reload plugin <pkgNameOrShort>.

       example: `window.pluginHelper.mo2.reload()` or `window.pluginHelper['poi-plugin-mo2'].reload()`

   - window.pluginHelper.<pkgNameOrShort>.getExt()

       get current reducer state of a plugin

   - window.pluginHelper.<pkgNameOrShort>.getConfig()

       get config data of a plugin, assuming it's located under `config.plugin.<packageName>`

 */
import _ from 'lodash'
import { observer } from 'redux-observers'

import { extensionSelectorFactory } from '../utils/selectors'

const pluginHelper = {}

const reloadPlugin = pkgNameOrShort => async (verbose=false, measureEnableTime=true) => {
  const {getStore} = window
  const {plugins} = getStore()
  const pluginInd = plugins.findIndex(p =>
    p.packageName === pkgNameOrShort ||
    p.packageName === `poi-plugin-${pkgNameOrShort}`
  )

  if (pluginInd === -1) {
    console.error(`plugin "${pkgNameOrShort}" not found`)
    return
  }
  const plugin = plugins[pluginInd]

  // delaying PM loading to break circular dep
  const pluginManager = require('./plugin-manager')

  /* eslint-disable no-console */
  await pluginManager.disablePlugin(plugin)
  if (verbose)
    console.log(`plugin "${plugin.id}" disabled, re-enabling...`)

  if (measureEnableTime)
    console.time(`Enable ${plugin.packageName}`)
  await pluginManager.enablePlugin(plugin)
  if (measureEnableTime)
    console.timeEnd(`Enable ${plugin.packageName}`)
  if (verbose)
    console.log(`plugin "${plugin.id}" enabled.`)
  /* esline-enable no-console */
}

const mkTools = plugin => {
  const {getStore, config} = window
  const {packageName} = plugin

  const getExt = () =>
    extensionSelectorFactory(packageName)(getStore())

  const getConfig = () =>
    config.get(['plugin', packageName])

  return {
    reload: reloadPlugin(packageName),
    getExt,
    getConfig,
  }
}

pluginHelper.$populate = () => {
  // remove all plugin tools
  _.keys(pluginHelper).map(k => {
    if (!(/^\$.*$/.exec(k)))
      delete pluginHelper[k]
  })

  const {getStore} = window
  const plugins = getStore('plugins') || []
  plugins.map(plugin => {
    const {packageName} = plugin
    const reResult = /^poi-plugin-(.+)$/.exec(packageName)
    if (!reResult)
      return
    const [_ignored, shortNameRaw] = reResult
    const shortName = _.camelCase(shortNameRaw)

    const tools = mkTools(plugin)
    pluginHelper[packageName] = tools
    pluginHelper[shortName] = tools
  })
}

pluginHelper.$reload = (pkgNameOrShort, verbose, measureEnableTime) =>
  reloadPlugin(pkgNameOrShort)(verbose, measureEnableTime)

const pluginHelperObserver = observer(
  state =>
    // digest plugin info by Array of packageName
    _.map(_.get(state, ['plugins']), p => p.packageName),
  (_dispatch, current, previous) => {
    // setup window.pluginHelper upon initial call
    if (typeof previous === 'undefined') {
      window.pluginHelper = pluginHelper
    } else {
      // re-populate when plugin list is changed
      if (!_.isEqual(current, previous)) {
        pluginHelper.$populate()
      }
    }
  },
  {skipInitialCall: false}
)

export {
  pluginHelper,
  pluginHelperObserver,
}
