import child_process from 'child_process'
import crypto from 'crypto'
import { createReadStream, readJson, lstat, unlink, remove } from 'fs-extra'
import glob from 'glob'
import { join, basename } from 'path'
import { promisify } from 'util'
import { config, ROOT } from 'views/env'

import type { NpmConfig } from './types'

import { isRecord, getString } from './types'

export const NPM_EXEC_PATH = join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
const MIRROR_JSON_PATH = join(ROOT, 'assets', 'data', 'mirror.json')
const MIRRORS: Record<string, { server: string }> = require(MIRROR_JSON_PATH)

const globAsync = promisify(glob)

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

export const findInstalledTarball = async (
  pluginRoot: string,
  tarballPath: string,
): Promise<string> => {
  const filename = basename(tarballPath)
  const pluginPaths = await globAsync(join(pluginRoot, 'poi-plugin-*'))
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

const runScriptAsync = (
  scriptPath: string,
  args: string[],
  options: child_process.ForkOptions,
): Promise<void> =>
  new Promise((resolve) => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
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
    '--no-progress',
    '--no-prune',
    '--global-style',
    '--ignore-scripts',
    '--legacy-peer-deps',
    target,
  ]
  await runScriptAsync(NPM_EXEC_PATH, args, { cwd: npmConfig.prefix })
}

export async function removePackage(target: string, npmConfig: NpmConfig): Promise<void> {
  const args = ['uninstall', '--no-progress', target]
  await runScriptAsync(NPM_EXEC_PATH, args, { cwd: npmConfig.prefix })
  await repairDep([], npmConfig)
}

export async function repairDep(brokenList: string[], npmConfig: NpmConfig): Promise<void> {
  const depList = (
    await new Promise<string[]>((res) => {
      glob(join(npmConfig.prefix, 'node_modules', '*'), (err, matches) => res(matches ?? []))
    })
  ).filter((p) => !p.includes('poi-plugin'))
  depList.forEach((p) => {
    try {
      require(p)
    } catch (_) {
      safePhysicallyRemove(p)
    }
  })
  brokenList.forEach((pluginName) => {
    installPackage(pluginName, null, npmConfig)
  })
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
