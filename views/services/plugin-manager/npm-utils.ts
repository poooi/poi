import child_process from 'child_process'
import { lstat, pathExists, remove, unlink, ensureDir, writeJSON } from 'fs-extra'
import { mkdtemp } from 'fs/promises'
import npa from 'npm-package-arg'
import { join } from 'path'
import { config, ROOT } from 'views/env'

import type { NpmConfig } from './types'

export const NPM_EXEC_PATH = join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
const MIRROR_JSON_PATH = join(ROOT, 'assets', 'data', 'mirror.json')
const MIRRORS: Record<string, { server: string }> = require(MIRROR_JSON_PATH)

const STAGING_DIRECTORY = '.staging'

export interface RegistryPluginSpec {
  packageName: string
  spec: string
}

export interface StagedPluginPackage {
  stagingDir: string
  pluginPath: string
  cleanup: () => Promise<void>
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/**
 * Parse and validate a plugin install spec. Only packages that live on the
 * configured npm registry are accepted, so Git URLs, local directories,
 * tarballs and `npm:` aliases are rejected before npm is ever started.
 */
export function resolveRegistryPluginSpec(
  packageSource: string,
  version?: string,
): RegistryPluginSpec {
  const raw = packageSource.trim()
  if (!raw) throw new Error('Plugin package name is required.')

  const assertRegistrySpec = (result: npa.Result): void => {
    if (result.registry !== true || !['tag', 'version', 'range'].includes(result.type)) {
      throw new Error(`Only npm registry packages can be installed (got "${raw}").`)
    }
    if (!result.name) {
      throw new Error(`Invalid plugin package spec "${raw}": package name is missing.`)
    }
  }

  let resolved: npa.Result
  try {
    resolved = npa(raw)
    // Check the original source first: a separate `version` argument must not
    // let `poi-plugin-x@file:../x` bypass registry-only validation.
    assertRegistrySpec(resolved)
    if (version) {
      if (!resolved.name) throw new Error('Plugin package name is required.')
      resolved = npa.resolve(resolved.name, version)
      assertRegistrySpec(resolved)
    }
  } catch (error) {
    throw new Error(`Invalid plugin package spec "${raw}": ${describeError(error)}`, {
      cause: error,
    })
  }

  if (!resolved.name) {
    throw new Error(`Invalid plugin package spec "${raw}": package name is missing.`)
  }

  const unscopedName = resolved.name.slice(resolved.name.lastIndexOf('/') + 1)
  if (!/^poi-plugin-.+$/.test(unscopedName)) {
    throw new Error(`Plugin package name "${resolved.name}" must match "poi-plugin-*".`)
  }

  return {
    packageName: resolved.name,
    spec: version ? `${resolved.name}@${version}` : raw,
  }
}

const runScriptAsync = (
  scriptPath: string,
  args: string[],
  options: child_process.ForkOptions,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = child_process.fork(scriptPath, args, options)
    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })
    proc.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })

    proc.once('error', (error) => {
      reject(error)
    })
    proc.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`npm terminated by signal ${signal}.`))
        return
      }
      if (code !== 0) {
        const diagnostics = [stderr.trim(), stdout.trim()].filter(Boolean).join('\n')
        const detail = diagnostics ? `\n${diagnostics.slice(-4000)}` : ''
        reject(new Error(`npm failed with exit code ${code}.${detail}`))
        return
      }
      resolve()
    })
  })

export async function installPackage(
  packageName: string,
  version: string | null | undefined,
  npmConfig: NpmConfig,
): Promise<void> {
  if (!packageName) return
  const target = version ? `${packageName}@${version}` : packageName
  let args = ['install', '--registry', npmConfig.registry]
  if (npmConfig.http_proxy) {
    args = [...args, '--proxy', npmConfig.http_proxy]
  }
  args = [
    ...args,
    '--install-strategy=shallow',
    '--no-progress',
    '--ignore-scripts',
    '--legacy-peer-deps',
    '--no-audit',
    '--no-fund',
    '--',
    target,
  ]
  await runScriptAsync(NPM_EXEC_PATH, args, { cwd: npmConfig.prefix })
}

const buildStageInstallArgs = (
  spec: string,
  stagingDir: string,
  npmConfig: NpmConfig,
): string[] => {
  const args = ['install', '--prefix', stagingDir, '--registry', npmConfig.registry]
  if (npmConfig.http_proxy) {
    args.push('--proxy', npmConfig.http_proxy)
  }
  args.push(
    '--install-strategy=shallow',
    '--legacy-peer-deps',
    '--ignore-scripts',
    '--no-save',
    '--no-package-lock',
    '--no-audit',
    '--no-fund',
    '--no-progress',
    '--',
    spec,
  )
  return args
}

/**
 * Install a plugin into a temporary staging directory on the same volume as
 * the plugin root, so it can be moved into place without EXDEV failures.
 * The returned staging directory must be cleaned up by the caller.
 */
export async function stagePluginPackage(
  packageName: string,
  spec: string,
  npmConfig: NpmConfig,
): Promise<StagedPluginPackage> {
  const stagingRoot = join(npmConfig.prefix, STAGING_DIRECTORY)
  await ensureDir(stagingRoot)
  const stagingDir = await mkdtemp(join(stagingRoot, 'tmp-'))
  const cleanup = async (): Promise<void> => {
    await remove(stagingDir).catch(() => undefined)
  }

  try {
    await writeJSON(
      join(stagingDir, 'package.json'),
      { name: 'poi-plugin-staging', private: true },
      { spaces: 2 },
    )
    await runScriptAsync(NPM_EXEC_PATH, buildStageInstallArgs(spec, stagingDir, npmConfig), {
      cwd: stagingDir,
      silent: true,
      env: { ...process.env, npm_config_update_notifier: 'false' },
    })

    const pluginPath = join(stagingDir, 'node_modules', packageName)
    if (!(await pathExists(pluginPath))) {
      throw new Error(`npm finished without installing ${packageName}.`)
    }
    return { stagingDir, pluginPath, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
}

export const safePhysicallyRemove = async (packagePath: string): Promise<void> => {
  let packageStat
  try {
    packageStat = await lstat(packagePath)
  } catch (_) {
    return
  }
  if (packageStat.isSymbolicLink()) {
    return await unlink(packagePath)
  }
  try {
    const gitStat = await lstat(join(packagePath, '.git'))
    if (gitStat.isDirectory()) {
      console.error(
        `${packagePath} appears to be a git repository. For the safety of your files in development, please use 'npm link' to install plugins from github.`,
      )
      return
    }
  } catch (_) {
    return await remove(packagePath)
  }
}

export const getNpmConfig = (prefix: string): NpmConfig => {
  const mirrorConf = config.get('packageManager.mirrorName')
  const enableBetaPluginCheck = config.get('packageManager.enableBetaPluginCheck')
  const mirrorName = Object.keys(MIRRORS).includes(mirrorConf ?? '')
    ? (mirrorConf ?? 'npm')
    : navigator.language === 'zh-CN'
      ? 'taobao'
      : 'npm'
  const registry = MIRRORS[mirrorName]?.server ?? ''
  return { registry, prefix, enableBetaPluginCheck }
}
