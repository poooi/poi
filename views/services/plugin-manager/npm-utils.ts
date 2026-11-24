import crypto from 'crypto'
import { createReadStream, readJson, lstat, unlink, remove } from 'fs-extra'
import { glob } from 'glob'
import { join, basename } from 'path'
import { config, ROOT } from 'views/env'

import type { NpmConfig } from './types'

import { runNpmCommand } from '../../../lib/npm-cli'
import { buildHttpProxyUrl, proxyEnvironment } from './proxy'
import { isRecord, getString } from './types'

export const NPM_EXEC_PATH = join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
const MIRROR_JSON_PATH = join(ROOT, 'assets', 'data', 'mirror.json')
const MIRRORS: Record<string, { server: string }> = require(MIRROR_JSON_PATH)

// glob v9+ treats `\` as an escape character; ROOT/join produce backslash paths on Windows.
const GLOB_OPTIONS = { windowsPathsNoEscape: true } as const

function calculateShasum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const hash = crypto.createHash('sha1')
      const stream = createReadStream(filePath)
      stream.on('data', (data) => hash.update(data.toString(), 'utf8'))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', (e) => reject(e))
    } catch (e) {
      reject(e)
    }
  })
}

// Kept for third-party callers. New installs take their identity from the
// prepared candidate instead of guessing from npm's private manifest fields.
export const findInstalledTarball = async (
  pluginRoot: string,
  tarballPath: string,
): Promise<string> => {
  const filename = basename(tarballPath)
  const pluginPaths = await glob(join(pluginRoot, 'poi-plugin-*'), GLOB_OPTIONS)
  const packageDatas: Array<Record<string, unknown>> = await Promise.all(
    pluginPaths.map((p: string) => readJson(join(p, 'package.json'))),
  )
  const nameMatchDatas = packageDatas.filter((packageData) => {
    const requested = packageData['_requested']
    const raw = isRecord(requested) ? (getString(requested, 'raw') ?? '') : ''
    return raw.endsWith(filename)
  })
  if (nameMatchDatas.length === 1) {
    const name = nameMatchDatas[0]['name']
    if (typeof name !== 'string') throw new Error(`Invalid package name in ${pluginRoot}`)
    return name
  }
  if (nameMatchDatas.length === 0) {
    throw new Error(`Error: Can't find a package matching ${tarballPath}.`)
  }
  const shasum = await calculateShasum(tarballPath)
  const shasumMatchDatas = nameMatchDatas.filter((data) => data['_shasum'] === shasum)
  if (!shasumMatchDatas[0]) {
    throw new Error(
      `Error: Can't find a package installed from ${tarballPath} matching shasum ${shasum}.`,
    )
  }
  const name = shasumMatchDatas[0]['name']
  if (typeof name !== 'string') throw new Error(`Invalid package name in ${pluginRoot}`)
  return name
}

const runNpmCli = async (
  args: string[],
  cwd: string,
  extraEnv: Record<string, string> = {},
): Promise<void> => {
  const customCertificateAuthority = config.get('poi.network.customCertificateAuthority', '')
  try {
    await runNpmCommand({
      npmCliPath: NPM_EXEC_PATH,
      args,
      cwd,
      env: {
        ...extraEnv,
        ...(customCertificateAuthority ? { NODE_EXTRA_CA_CERTS: customCertificateAuthority } : {}),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const detail =
      error instanceof Error && 'detail' in error && typeof error.detail === 'string'
        ? error.detail
        : ''
    throw new Error(`${message}${detail ? `\n${detail}` : ''}`, { cause: error })
  }
}

/**
 * Generic install into a caller-owned prefix. Kept for the WCTF database
 * updater and third-party callers (`utils.ts` is a public entry point), so it
 * must keep supporting non-plugin package names and a separate prefix.
 */
export async function installPackage(
  packageName: string,
  version: string | null | undefined,
  npmConfig: NpmConfig,
): Promise<void> {
  if (!packageName) return
  const target = version ? `${packageName}@${version}` : packageName
  const args = ['install']
  if (npmConfig.registry) args.push('--registry', npmConfig.registry)
  args.push(
    '--no-progress',
    '--no-prune',
    '--global-style',
    '--ignore-scripts',
    '--legacy-peer-deps',
    '--no-audit',
    '--no-fund',
    target,
  )
  await runNpmCli(args, npmConfig.prefix, proxyEnvironment(npmConfig.http_proxy))
}

export async function removePackage(target: string, npmConfig: NpmConfig): Promise<void> {
  await runNpmCli(
    ['uninstall', '--no-progress', target],
    npmConfig.prefix,
    proxyEnvironment(npmConfig.http_proxy),
  )
}

/**
 * Reinstalls only explicitly named packages. The previous implementation
 * scanned and deleted every unrequireable dependency when given an empty list;
 * that is not a safe repair and is gone.
 */
export async function repairDep(brokenList: string[], npmConfig: NpmConfig): Promise<void> {
  for (const pluginName of brokenList) {
    await installPackage(pluginName, null, npmConfig)
  }
}

export interface ExtraRemovalResult {
  removed: boolean
  missing?: true
  linked: boolean
}

/** Removes one extra plugin directory; symlinks are unlinked, Git trees are kept. */
export const removeExtraPackage = async (packagePath: string): Promise<ExtraRemovalResult> => {
  const packageStat = await lstat(packagePath).catch((error: unknown) => {
    if (isRecord(error) && error['code'] === 'ENOENT') return undefined
    throw error
  })
  if (!packageStat) return { removed: false, linked: false, missing: true }
  if (packageStat.isSymbolicLink()) {
    await unlink(packagePath)
    return { removed: true, linked: true }
  }
  try {
    await lstat(join(packagePath, '.git'))
    return { removed: false, linked: false }
  } catch (error) {
    if (!isRecord(error) || error['code'] !== 'ENOENT') throw error
  }
  await remove(packagePath)
  return { removed: true, linked: false }
}

/** Backwards-compatible void wrapper used by older callers. */
export const safePhysicallyRemove = async (packagePath: string): Promise<void> => {
  await removeExtraPackage(packagePath)
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

  let http_proxy: string | undefined
  if (config.get('proxy.use') === 'http') {
    http_proxy = buildHttpProxyUrl({
      host: config.get('proxy.http.host', '127.0.0.1'),
      port: config.get('proxy.http.port', 8118),
      requirePassword: config.get('proxy.http.requirePassword', false),
      username: config.get('proxy.http.username', ''),
      password: config.get('proxy.http.password', ''),
    })
  }

  const customCertificateAuthority = config.get('poi.network.customCertificateAuthority', '')
  const env = customCertificateAuthority
    ? { NODE_EXTRA_CA_CERTS: customCertificateAuthority }
    : undefined

  return { registry, prefix, enableBetaPluginCheck, http_proxy, env }
}
