// Barrel kept for compatibility: poi code and third-party plugins import the
// plugin-manager helpers through './utils' / 'views/services/plugin-manager/utils'.
// The implementation lives in the sibling modules.
export type { NpmConfig, Plugin, BundlePluginMeta } from './types'
export { isRecord } from './types'
export {
  findInstalledTarball,
  installPackage,
  removePackage,
  repairDep,
  safePhysicallyRemove,
  getNpmConfig,
} from './npm-utils'
export { updateI18n } from './plugin-i18n'
export { bundlePluginMetaToPlugin, readPlugin } from './read-plugin'
export { enablePlugin, disablePlugin, unloadPlugin, notifyFailed } from './lifecycle'
