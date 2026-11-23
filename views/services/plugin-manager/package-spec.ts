import npa from 'npm-package-arg'
import path from 'path'

// npm package naming rules, restricted to poi plugins. The optional scope is
// part of the package name, never something to split on '@'.
const PLUGIN_PACKAGE_RE = /^(?:@[^/]+\/)?poi-plugin-.+$/
const TARBALL_RE = /\.(?:tgz|tar\.gz)$/i
const REGISTRY_TYPES = ['version', 'range', 'tag']

function looksLikeLocalTarballPath(input: string): boolean {
  return (
    TARBALL_RE.test(input) &&
    (path.isAbsolute(input) || /^[A-Za-z]:[\\/]/.test(input) || /^\.{1,2}[\\/]/.test(input))
  )
}

export interface NormalizedInstallSpec {
  /** Spec handed to the installer. */
  spec: string
  /** Known before preparation for registry specs; local tarballs are resolved later. */
  packageName?: string
}

export function isPluginPackageName(name: string): boolean {
  return PLUGIN_PACKAGE_RE.test(name)
}

export function normalizeInstallSpec(
  source: string,
  version?: string | null,
): NormalizedInstallSpec {
  const input = source.trim()
  if (!input) throw new Error('Empty plugin spec')

  if (version) {
    return { spec: `${input}@${version}`, packageName: input }
  }

  if (looksLikeLocalTarballPath(input)) {
    return { spec: path.resolve(input) }
  }
  if (TARBALL_RE.test(input) && !/^https?:\/\//i.test(input) && !/^file:/i.test(input)) {
    // A bare file name cannot be located reliably and used to be handed to npa
    // as a registry tag. Reject it instead of silently reinterpreting it.
    throw new Error('Local tarball paths must be absolute or start with ./ or ../')
  }

  try {
    const parsed = npa(input)
    return parsed.name ? { spec: input, packageName: parsed.name } : { spec: input }
  } catch {
    return { spec: input }
  }
}

/**
 * Accepts what the manual install box honestly supports: registry names with an
 * exact version, range or tag (scoped or not), and local tarballs. Aliases,
 * URLs, Git specs and directories are reported as invalid instead of being
 * silently reinterpreted.
 */
export function validateInstallInput(value: string): boolean {
  const input = value.trim()
  if (!input) return false
  // Local tarball paths are supported; remote URLs and bare file names are not.
  if (looksLikeLocalTarballPath(input)) return true
  if (/^file:/i.test(input) && TARBALL_RE.test(input)) return true

  try {
    const parsed = npa(input)
    return Boolean(
      parsed.name &&
      isPluginPackageName(parsed.name) &&
      parsed.type &&
      REGISTRY_TYPES.includes(parsed.type),
    )
  } catch {
    return false
  }
}
