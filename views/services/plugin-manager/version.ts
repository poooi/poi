import semver from 'semver'

interface PluginUpdateResolution {
  latestVersion: string
  outdated: boolean
  /** poi is older than the plugin's declared compatible range. */
  notCompatible: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function manifestVersion(manifest: unknown): string | undefined {
  if (!isRecord(manifest)) return undefined
  const version = manifest['version']
  return typeof version === 'string' && semver.valid(version) ? version : undefined
}

function apiVerOf(manifest: unknown): Record<string, unknown> | undefined {
  if (!isRecord(manifest)) return undefined
  const poiPlugin = manifest['poiPlugin']
  if (!isRecord(poiPlugin)) return undefined
  const apiVer = poiPlugin['apiVer']
  if (!isRecord(apiVer) || Object.keys(apiVer).length === 0) return undefined
  return apiVer
}

/**
 * Keeps the historical latest/beta selection and the `poiPlugin.apiVer`
 * compatibility rollback. Remote manifests come from `npm view`, so the same
 * logic works for private or scoped registries.
 */
export function resolvePluginUpdate(
  currentVersion: string,
  poiVersion: string,
  latestManifest: unknown,
  betaManifest: unknown,
  enableBeta: boolean,
  pluginApiVer?: Record<string, string>,
): PluginUpdateResolution {
  const latestTag = manifestVersion(latestManifest) ?? currentVersion
  const betaTag = enableBeta ? manifestVersion(betaManifest) : undefined
  if (!semver.valid(currentVersion)) {
    return { latestVersion: currentVersion, outdated: false, notCompatible: false }
  }

  const apiVer = apiVerOf(latestManifest) ?? pluginApiVer ?? {}
  let latest = currentVersion
  let notCompatible = false
  let nearestCompVer = 'v214.748.3647'
  for (const mainVersion of Object.keys(apiVer)) {
    const apiVerValue = apiVer[mainVersion]
    if (!apiVerValue || !semver.valid(mainVersion)) continue
    if (semver.lte(poiVersion, mainVersion) && semver.lt(mainVersion, nearestCompVer)) {
      notCompatible = true
      nearestCompVer = mainVersion
      latest = typeof apiVerValue === 'string' ? apiVerValue : latest
    }
  }

  if (!notCompatible && betaTag && semver.gt(betaTag, latest)) {
    latest = betaTag
  }
  if (!notCompatible && semver.gt(latestTag, latest)) {
    latest = latestTag
  }

  return {
    latestVersion: latest,
    outdated: semver.valid(latest) ? semver.gt(latest, currentVersion) : false,
    notCompatible,
  }
}
