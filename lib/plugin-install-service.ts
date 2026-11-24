import fs from 'node:fs/promises'
import path from 'node:path'

import type {
  InstallerPaths,
  InstalledPlugin,
  PluginReceipt,
  PreparedInstall,
  RemoveResult,
} from './plugin-installer'

import { InstallerError } from './installer-error'
import { runNpmCommand } from './npm-cli'
import {
  activate as activatePrepared,
  DEFAULT_INSTALL_TIMEOUT,
  DEFAULT_NPM_CLI_PATH,
  prepare,
  readPluginReceipt,
  remove,
} from './plugin-installer'

/**
 * Main-process supervision layer for plugin installation.
 *
 * The heavy lifting lives in `./plugin-installer`.  This module adds what the
 * renderer must not own:
 *
 * - a single write queue for one user directory, so repeated clicks and
 *   renderer reloads cannot interleave directory swaps
 * - npm CLI supervision for update checks
 * - install source inspection so the renderer can decide whether an update is
 *   allowed without trusting the plugin directory
 *
 * It stays free of Electron imports so it can be tested directly.
 */

export type InstalledPackageSource = 'registry' | 'file' | 'legacy-registry' | 'unknown'

export interface InstalledPackageInfo {
  packageName: string
  installSource: InstalledPackageSource
  /** Exact spec that reinstalls the currently installed version, when known. */
  spec?: string
  /** Registry inferred from the receipt or the legacy lockfile. */
  registry?: string
  receipt?: PluginReceipt
}

export interface PluginInstallServiceOptions extends InstallerPaths {
  npmCliPath?: string
  timeoutMs?: number
  /** Extra environment passed to every npm child. */
  env?: Record<string, string | undefined>
}

export interface NpmRequestOptions {
  registry?: string
  proxy?: string
  env?: Record<string, string | undefined>
  cwd?: string
  timeoutMs?: number
}

/** Identity recorded at install time that a repair must not silently replace. */
export interface ExpectedInstallSource {
  type: 'registry' | 'file'
  /** sha512 for local tarballs, dist integrity for registry packages. */
  integrity?: string
}

export interface PrepareRequest extends NpmRequestOptions {
  /** Registry spec or local `.tgz`/`file:` tarball. */
  spec: string
  /** Set by repairs, so the recorded source cannot be swapped underneath them. */
  expected?: ExpectedInstallSource
}

export interface ViewRequest extends NpmRequestOptions {
  name: string
  /** Dist-tag such as `latest` or `beta`. */
  tag?: string
}

const VIEW_TIMEOUT = 60 * 1000
const VIEW_CONCURRENCY = 4

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEnoent(error: unknown): boolean {
  return isRecord(error) && error['code'] === 'ENOENT'
}

async function readJsonFile(target: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(target, 'utf8')) as unknown
  } catch (error) {
    if (isEnoent(error)) return undefined
    throw error
  }
}

async function readPackageVersion(directory: string): Promise<string | undefined> {
  const manifest = await readJsonFile(path.join(directory, 'package.json'))
  if (!isRecord(manifest)) return undefined
  return typeof manifest['version'] === 'string' ? manifest['version'] : undefined
}

function inferredRegistry(resolvedUrl: string): string | undefined {
  try {
    return `${new URL(resolvedUrl).origin}/`
  } catch {
    return undefined
  }
}

export class PluginInstallService {
  private readonly pluginsRoot: string
  private readonly workRoot: string
  private readonly npmCliPath: string
  private readonly timeoutMs: number
  private readonly baseEnv: Record<string, string | undefined>
  private chain: Promise<void> = Promise.resolve()
  private readActive = 0
  private readonly readQueue: Array<() => void> = []

  constructor(options: PluginInstallServiceOptions) {
    this.pluginsRoot = path.resolve(options.pluginsRoot)
    this.workRoot = path.resolve(options.workRoot)
    this.npmCliPath = options.npmCliPath ?? DEFAULT_NPM_CLI_PATH
    this.timeoutMs = options.timeoutMs ?? DEFAULT_INSTALL_TIMEOUT
    this.baseEnv = options.env ?? {}
  }

  /**
   * Prepares an isolated candidate. The active plugin is not touched.
   *
   * Trusted project `.npmrc` copying and effective scoped-registry lookup are
   * owned by the installer; this layer only forwards the caller's registry.
   */
  prepare(request: PrepareRequest): Promise<PreparedInstall> {
    return this.enqueue(async () => {
      const prepared = await prepare({
        pluginsRoot: this.pluginsRoot,
        workRoot: this.workRoot,
        spec: request.spec,
        registry: request.registry,
        proxy: request.proxy,
        npmCliPath: this.npmCliPath,
        timeoutMs: request.timeoutMs ?? this.timeoutMs,
        env: { ...this.baseEnv, ...request.env },
        cwd: request.cwd,
      })
      await this.assertRecordedSource(prepared, request.expected)
      return prepared
    })
  }

  /** Replaces the selected active plugin with the prepared candidate. */
  activate(operationId: string): Promise<InstalledPlugin> {
    return this.enqueue(() =>
      activatePrepared({
        pluginsRoot: this.pluginsRoot,
        workRoot: this.workRoot,
        operationId,
      }),
    )
  }

  remove(packageName: string): Promise<RemoveResult> {
    return this.enqueue(() =>
      remove({
        pluginsRoot: this.pluginsRoot,
        packageName,
      }),
    )
  }

  /**
   * Describes how an installed plugin got there. New installs carry a receipt;
   * legacy installs fall back to the old root manifest and lockfile, and stay
   * `unknown` when neither records a trusted registry source.
   */
  async inspectPlugin(packageName: string): Promise<InstalledPackageInfo> {
    const pluginPath = path.join(this.pluginsRoot, 'node_modules', packageName)
    let receipt: PluginReceipt | undefined
    try {
      receipt = await readPluginReceipt(pluginPath)
    } catch {
      receipt = undefined
    }
    const version = await readPackageVersion(pluginPath)

    if (receipt) {
      const spec =
        receipt.source.type === 'file'
          ? receipt.source.path
          : version
            ? `${packageName}@${version}`
            : receipt.source.spec
      return {
        packageName,
        installSource: receipt.source.type === 'file' ? 'file' : 'registry',
        spec,
        registry: receipt.source.type === 'registry' ? receipt.source.registry : undefined,
        receipt,
      }
    }

    const legacy = await this.legacySource(packageName, version)
    return { packageName, ...legacy }
  }

  /**
   * Fetches registry metadata through the npm CLI so update checks use the same
   * auth, proxy, CA and scoped-registry configuration as installs. It runs from
   * the plugin root so npm reads the trusted project config there as well.
   */
  view(request: ViewRequest): Promise<Record<string, unknown> | undefined> {
    // Read-only lookups use their own bounded path: they must not block file
    // swaps, and a full update check must not become N sequential npm spawns.
    return this.withReadSlot(async () => {
      try {
        const spec = request.tag ? `${request.name}@${request.tag}` : request.name
        const args = ['view', spec, '--json']
        if (request.registry) args.push('--registry', request.registry)
        const stdout = await runNpmCommand({
          npmCliPath: this.npmCliPath,
          args,
          cwd: this.pluginsRoot,
          timeoutMs: request.timeoutMs ?? Math.min(this.timeoutMs, VIEW_TIMEOUT),
          env: { ...this.baseEnv, ...request.env, npm_config_update_notifier: 'false' },
          proxy: request.proxy,
        })
        const parsed: unknown = JSON.parse(stdout)
        return isRecord(parsed) ? parsed : undefined
      } catch (error) {
        console.warn(
          `npm view failed for ${request.name}${request.tag ? `@${request.tag}` : ''}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
        return undefined
      }
    })
  }

  private async withReadSlot<T>(task: () => Promise<T>): Promise<T> {
    while (this.readActive >= VIEW_CONCURRENCY) {
      await new Promise<void>((resolve) => this.readQueue.push(resolve))
    }
    this.readActive++
    try {
      return await task()
    } finally {
      this.readActive--
      this.readQueue.shift()?.()
    }
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task)
    this.chain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  /**
   * A repair must reinstall the source recorded at install time: same registry,
   * same exact version, same local tarball bytes. The installer verifies the
   * candidate identity; this rejects a source that changed underneath it.
   */
  private async assertRecordedSource(
    prepared: PreparedInstall,
    expected: ExpectedInstallSource | undefined,
  ): Promise<void> {
    if (!expected) return
    const source = prepared.receipt.source
    const recorded = source.type === 'file' ? source.integrity : source.integrity
    const mismatch =
      source.type !== expected.type ||
      (!expected.integrity || !recorded ? false : expected.integrity !== recorded)
    if (!mismatch) return
    await fs.rm(prepared.operationPath, { recursive: true, force: true }).catch(() => undefined)
    throw new InstallerError(
      'EIDENTITY',
      'Reinstalled source does not match the recorded install',
      { stage: 'prepare', packageName: prepared.packageName },
    )
  }

  private async legacySource(
    packageName: string,
    version: string | undefined,
  ): Promise<Omit<InstalledPackageInfo, 'packageName'>> {
    const manifest = await readJsonFile(path.join(this.pluginsRoot, 'package.json'))
    if (isRecord(manifest) && isRecord(manifest['dependencies'])) {
      const spec = manifest['dependencies'][packageName]
      if (typeof spec === 'string') {
        if (/^file:/i.test(spec)) {
          const filePath = path.resolve(this.pluginsRoot, spec.slice('file:'.length))
          return { installSource: 'file', spec: filePath }
        }
        if (!/^(?:[a-z]+:|[./])/i.test(spec) && !/[\\/]/.test(spec)) {
          return {
            installSource: 'legacy-registry',
            spec: `${packageName}@${version ?? spec}`,
          }
        }
        return { installSource: 'unknown' }
      }
    }

    const lock = await readJsonFile(path.join(this.pluginsRoot, 'package-lock.json'))
    if (isRecord(lock) && isRecord(lock['packages'])) {
      const entry = lock['packages'][`node_modules/${packageName}`]
      if (isRecord(entry)) {
        const resolved = entry['resolved']
        if (typeof resolved === 'string' && /^https?:/i.test(resolved)) {
          return {
            installSource: 'legacy-registry',
            spec: version ? `${packageName}@${version}` : undefined,
            registry: inferredRegistry(resolved),
          }
        }
      }
    }
    return { installSource: 'unknown' }
  }
}

export function createPluginInstallService(
  options: PluginInstallServiceOptions,
): PluginInstallService {
  return new PluginInstallService(options)
}

let defaultService: PluginInstallService | undefined

export function getPluginInstallService(): PluginInstallService {
  if (!defaultService) {
    const appData = global.APPDATA_PATH
    if (!appData) {
      throw new Error('APPDATA_PATH is not initialized')
    }
    defaultService = new PluginInstallService({
      pluginsRoot: path.join(appData, 'plugins'),
      workRoot: path.join(appData, '.plugin-install'),
    })
  }
  return defaultService
}

// Module-level wrappers keep `remote.require('./lib/plugin-install-service')`
// simple: the renderer calls functions instead of crossing a class instance.
export const preparePluginInstall = (request: PrepareRequest): Promise<PreparedInstall> =>
  getPluginInstallService().prepare(request)

export const activatePluginInstall = (operationId: string): Promise<InstalledPlugin> =>
  getPluginInstallService().activate(operationId)

export const removePluginDirectory = (packageName: string): Promise<RemoveResult> =>
  getPluginInstallService().remove(packageName)

export const inspectPluginInstall = (packageName: string): Promise<InstalledPackageInfo> =>
  getPluginInstallService().inspectPlugin(packageName)

export const viewPackage = (request: ViewRequest): Promise<Record<string, unknown> | undefined> =>
  getPluginInstallService().view(request)
