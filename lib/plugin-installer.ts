import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import npa from 'npm-package-arg'

import { InstallerError } from './installer-error'
import { redactNpmOutput, runNpmCommand } from './npm-cli'

/**
 * Bottom-layer plugin installation engine.
 *
 * It intentionally knows nothing about Electron, Redux or plugin loading.  The
 * caller owns the plugin lifecycle and decides which directory is the plugin
 * root.  This module owns:
 *
 * - preparing a plugin in an isolated shallow staging project using npm CLI
 * - validating the staged tree and writing a source receipt into it
 * - replacing the selected active plugin directory with the staged tree
 * - removing a selected plugin directory
 *
 * A failed replacement leaves the old tree removed or the new tree absent; the
 * user retries through the normal install entry point. There is no journal or
 * background recovery protocol.
 */

export const INSTALLER_RECEIPT_FILE = '.poi-plugin-installer.json'
export const DEFAULT_INSTALL_TIMEOUT = 10 * 60 * 1000
export const DEFAULT_NPM_CLI_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  'npm',
  'bin',
  'npm-cli.js',
)

const STAGE_DIR = 'stage'
const RECEIPT_SCHEMA = 1
const PACKAGE_NAME_RE = /^(?:@[^/]+\/)?poi-plugin-[^/]+$/
const ENTRY_EXTENSIONS = ['', '.js', '.json', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.es']

export type PluginSource =
  | {
      type: 'registry'
      spec: string
      registry?: string
      integrity?: string
    }
  | {
      type: 'file'
      spec: string
      path: string
      integrity: string
    }

export interface PluginReceipt {
  schema: typeof RECEIPT_SCHEMA
  packageName: string
  version: string
  source: PluginSource
  installedAt: string
}

export interface InstallerPaths {
  /** The directory containing `node_modules/<package>`, usually `plugins`. */
  pluginsRoot: string
  /** Sibling work directory on the same volume, usually `APPDATA/.plugin-install`. */
  workRoot: string
}

export interface PrepareOptions extends InstallerPaths {
  /** A registry spec, or a local `.tgz` / `file:` tarball. */
  spec: string
  /** Registry selected by poi. User npm config still contributes auth etc. */
  registry?: string
  proxy?: string
  npmCliPath?: string
  timeoutMs?: number
  env?: NodeJS.ProcessEnv
  /** Used to resolve a relative local tarball; defaults to process.cwd(). */
  cwd?: string
}

export interface PreparedInstall {
  operationId: string
  packageName: string
  version: string
  candidatePath: string
  operationPath: string
  receipt: PluginReceipt
}

export interface ActivateOptions extends InstallerPaths {
  operationId: string
}

export interface InstalledPlugin {
  packageName: string
  version: string
  path: string
  receipt: PluginReceipt
}

export interface RemoveOptions {
  pluginsRoot: string
  packageName: string
}

export interface RemoveResult {
  packageName: string
  removed: boolean
  linked: boolean
}

interface NormalizedSpec {
  npmSpec: string
  source: 'registry' | 'file'
  filePath?: string
  registryName?: string
  displaySpec: string
}

interface PackageManifest {
  name: string
  version: string
  raw: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}

function parseJson(text: string, what: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    throw new InstallerError('EBADPACKAGE', `Invalid ${what}`, {
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}

function resolveRoots(paths: InstallerPaths): InstallerPaths {
  const pluginsRoot = path.resolve(paths.pluginsRoot)
  const workRoot = path.resolve(paths.workRoot)
  if (pluginsRoot === workRoot) {
    throw new InstallerError('EPATH', 'Plugin root and work root must be different')
  }
  if (isSubpath(pluginsRoot, workRoot) || isSubpath(workRoot, pluginsRoot)) {
    throw new InstallerError('EPATH', 'Plugin root and work root must not contain each other')
  }
  return { pluginsRoot, workRoot }
}

async function assertSameVolume(paths: InstallerPaths): Promise<void> {
  const [pluginsRoot, workRoot] = await Promise.all([
    fs.realpath(paths.pluginsRoot),
    fs.realpath(paths.workRoot),
  ])
  const [pluginsStat, workStat] = await Promise.all([fs.stat(pluginsRoot), fs.stat(workRoot)])
  if (pluginsStat.dev !== workStat.dev) {
    throw new InstallerError('EPATH', 'Plugin root and work root must be on the same volume')
  }
}

async function assertSameVolumeIfPresent(paths: InstallerPaths): Promise<void> {
  try {
    await assertSameVolume(paths)
  } catch (error) {
    if (isEnoent(error)) return
    throw error
  }
}

function isSubpath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function assertSafePackageName(name: unknown): asserts name is string {
  if (
    typeof name !== 'string' ||
    !PACKAGE_NAME_RE.test(name) ||
    name.includes('\\') ||
    name.includes('..')
  ) {
    throw new InstallerError('EBADPACKAGE', `Invalid plugin package name: ${String(name)}`)
  }
}

function pluginPath(pluginsRoot: string, packageName: string): string {
  assertSafePackageName(packageName)
  return path.join(pluginsRoot, 'node_modules', packageName)
}

async function assertSafeDirectory(
  directory: string,
  label: string,
  realParent: string,
): Promise<void> {
  const stat = await fs.lstat(directory)
  if (stat.isSymbolicLink()) {
    throw new InstallerError('EPATH', `${label} must not be a symbolic link or junction`)
  }
  if (!stat.isDirectory()) throw new InstallerError('EPATH', `${label} is not a directory`)
  const realDirectory = await fs.realpath(directory)
  if (realDirectory !== realParent && !isSubpath(realParent, realDirectory)) {
    throw new InstallerError('EPATH', `${label} resolves outside its parent`)
  }
}

async function ensurePluginParent(
  pluginsRoot: string,
  packageName: string,
  create: boolean,
): Promise<string> {
  assertSafePackageName(packageName)
  if (!(await pathExists(pluginsRoot))) {
    if (!create) return pluginPath(pluginsRoot, packageName)
    await fs.mkdir(pluginsRoot, { recursive: true })
  }
  const rootStat = await fs.stat(pluginsRoot)
  if (!rootStat.isDirectory()) {
    throw new InstallerError('EPATH', 'Plugin root is not a directory')
  }
  const realPluginsRoot = await fs.realpath(pluginsRoot)
  const nodeModules = path.join(pluginsRoot, 'node_modules')
  if (!(await pathExists(nodeModules))) {
    if (!create) return pluginPath(pluginsRoot, packageName)
    await fs.mkdir(nodeModules)
  }
  await assertSafeDirectory(nodeModules, 'node_modules', realPluginsRoot)

  if (!packageName.startsWith('@')) return pluginPath(pluginsRoot, packageName)

  const scopeName = packageName.slice(0, packageName.indexOf('/'))
  const scopeDirectory = path.join(nodeModules, scopeName)
  if (!(await pathExists(scopeDirectory))) {
    if (!create) return pluginPath(pluginsRoot, packageName)
    await fs.mkdir(scopeDirectory)
  }
  const realNodeModules = await fs.realpath(nodeModules)
  await assertSafeDirectory(scopeDirectory, 'scope parent', realNodeModules)
  return pluginPath(pluginsRoot, packageName)
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target)
    return true
  } catch (error) {
    if (isEnoent(error)) return false
    throw error
  }
}

function isEnoent(error: unknown): boolean {
  return isRecord(error) && error['code'] === 'ENOENT'
}

async function assertNotSymlink(target: string, what: string): Promise<void> {
  const stat = await fs.lstat(target)
  if (stat.isSymbolicLink()) {
    throw new InstallerError('EPATH', `${what} must not be a symbolic link`)
  }
}

async function assertNoGit(target: string): Promise<void> {
  if (await pathExists(path.join(target, '.git'))) {
    throw new InstallerError('EPATH', 'Refusing to touch a Git working tree')
  }
}

async function assertRealPathWithin(parent: string, target: string, what: string): Promise<void> {
  const [realParent, realTarget] = await Promise.all([fs.realpath(parent), fs.realpath(target)])
  if (!isSubpath(realParent, realTarget) && realParent !== realTarget) {
    throw new InstallerError('EPATH', `${what} resolves outside ${parent}`)
  }
}

async function readManifest(directory: string): Promise<PackageManifest> {
  let text: string
  try {
    text = await fs.readFile(path.join(directory, 'package.json'), 'utf8')
  } catch (error) {
    if (isEnoent(error)) {
      throw new InstallerError('EBADPACKAGE', 'Missing package.json')
    }
    throw error
  }
  const raw = parseJson(text, 'package.json')
  if (!isRecord(raw)) throw new InstallerError('EBADPACKAGE', 'package.json must be an object')
  const name = getString(raw, 'name')
  const version = getString(raw, 'version')
  if (!name || !version) {
    throw new InstallerError('EBADPACKAGE', 'package.json must have name and version')
  }
  return { name, version, raw }
}

async function normalizeTarballSpec(filePath: string, spec: string): Promise<NormalizedSpec> {
  let stat
  try {
    stat = await fs.stat(filePath)
  } catch (error) {
    if (isEnoent(error)) throw new InstallerError('ENOTFOUND', `Tarball not found: ${spec}`)
    throw error
  }
  if (!stat.isFile()) {
    throw new InstallerError('EUNSUPPORTED', 'Directory installs are not supported')
  }
  if (!/\.(?:tgz|tar\.gz)$/i.test(filePath)) {
    throw new InstallerError('EUNSUPPORTED', 'Only .tgz/.tar.gz local tarballs are supported')
  }
  return {
    npmSpec: `file:${filePath}`,
    source: 'file',
    filePath,
    displaySpec: spec,
  }
}

async function normalizeSpec(spec: string, cwd: string): Promise<NormalizedSpec> {
  if (!spec.trim()) throw new InstallerError('EBADSPEC', 'Empty package spec')

  // A plain filesystem path is accepted as an offline tarball. Resolve it
  // before calling npa so a Windows drive path is not misparsed as a name.
  const looksLikePath =
    path.isAbsolute(spec) ||
    spec.startsWith('./') ||
    spec.startsWith('../') ||
    spec.startsWith('.\\') ||
    spec.startsWith('..\\') ||
    /^[A-Za-z]:[\\/]/.test(spec)
  if (looksLikePath) return normalizeTarballSpec(path.resolve(cwd, spec), spec)

  let parsed
  try {
    parsed = npa(spec, cwd)
  } catch (error) {
    throw new InstallerError('EBADSPEC', `Invalid package spec: ${spec}`, {
      detail: error instanceof Error ? error.message : String(error),
    })
  }

  if (parsed.type === 'file') {
    if (typeof parsed.fetchSpec !== 'string') {
      throw new InstallerError('EBADSPEC', `Invalid local package spec: ${spec}`)
    }
    return normalizeTarballSpec(path.resolve(parsed.fetchSpec), spec)
  }

  if (parsed.type !== 'range' && parsed.type !== 'tag' && parsed.type !== 'version') {
    throw new InstallerError('EUNSUPPORTED', `Unsupported package spec type: ${parsed.type}`, {
      detail: spec,
    })
  }

  if (parsed.name) assertSafePackageName(parsed.name)
  return {
    npmSpec: spec,
    source: 'registry',
    registryName: parsed.name ?? undefined,
    displaySpec: spec,
  }
}

async function hashFile(filePath: string): Promise<string> {
  const hash = createHash('sha512')
  const stream = await fs.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(1024 * 1024)
    for (;;) {
      const { bytesRead } = await stream.read(buffer, 0, buffer.length, null)
      if (bytesRead === 0) break
      hash.update(buffer.subarray(0, bytesRead))
    }
  } finally {
    await stream.close()
  }
  return `sha512-${hash.digest('base64')}`
}

function operationId(): string {
  return randomBytes(12).toString('hex')
}

function operationPath(workRoot: string, id: string): string {
  if (!/^[a-f0-9]{24}$/.test(id)) throw new InstallerError('EBADSTATE', 'Invalid operation ID')
  return path.join(workRoot, id)
}

async function runNpm(options: PrepareOptions, cwd: string, args: string[]): Promise<string> {
  const stdout = await runNpmCommand({
    npmCliPath: options.npmCliPath ?? DEFAULT_NPM_CLI_PATH,
    args,
    cwd,
    timeoutMs: options.timeoutMs ?? DEFAULT_INSTALL_TIMEOUT,
    env: { ...options.env, npm_config_update_notifier: 'false' },
    proxy: options.proxy,
  })
  return redactNpmOutput(stdout)
}

async function runNpmInstall(
  options: PrepareOptions,
  stage: string,
  npmSpec: string,
): Promise<string> {
  const args = [
    'install',
    '--prefix',
    stage,
    '--install-strategy=shallow',
    '--legacy-peer-deps',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--no-progress',
  ]
  if (options.registry) args.push('--registry', options.registry)
  args.push(npmSpec)
  return runNpm(options, stage, args)
}

async function listInstalledPackages(nodeModules: string): Promise<string[]> {
  const result: string[] = []
  let entries
  try {
    entries = await fs.readdir(nodeModules, { withFileTypes: true })
  } catch (error) {
    if (isEnoent(error)) return result
    throw error
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(nodeModules, entry.name)
    if (entry.name.startsWith('@')) {
      let scoped
      try {
        scoped = await fs.readdir(full, { withFileTypes: true })
      } catch {
        continue
      }
      for (const child of scoped) {
        if (child.name.startsWith('.')) continue
        const packageDir = path.join(full, child.name)
        if (await pathExists(path.join(packageDir, 'package.json'))) result.push(packageDir)
      }
    } else if (await pathExists(path.join(full, 'package.json'))) {
      result.push(full)
    }
  }
  return result
}

async function findEntry(packageDir: string, manifest: Record<string, unknown>): Promise<string> {
  const main = getString(manifest, 'main')
  const bases = main ? [main] : ['index']
  if (main) {
    const withoutExt = main.replace(/\.(?:js|json|cjs|mjs|ts|tsx|jsx|es)$/i, '')
    if (withoutExt !== main) bases.push(withoutExt)
    bases.push(path.join(main, 'index'))
  }
  for (const base of bases) {
    for (const ext of ENTRY_EXTENSIONS) {
      const candidate = path.resolve(packageDir, `${base}${ext}`)
      if (!(await pathExists(candidate))) continue
      const stat = await fs.lstat(candidate)
      if (!stat.isFile()) continue
      const [realPackage, realCandidate] = await Promise.all([
        fs.realpath(packageDir),
        fs.realpath(candidate),
      ])
      if (!isSubpath(realPackage, realCandidate)) {
        throw new InstallerError('EPATH', 'Plugin entry resolves outside the plugin package')
      }
      return candidate
    }
  }
  throw new InstallerError('EBADPACKAGE', 'Plugin entry is missing or unreadable')
}

interface LockValidation {
  integrity?: string
}

async function validateLock(stage: string, packageName: string): Promise<LockValidation> {
  let raw: unknown
  try {
    raw = parseJson(await fs.readFile(path.join(stage, 'package-lock.json'), 'utf8'), 'lockfile')
  } catch (error) {
    if (isEnoent(error)) {
      throw new InstallerError('ELOCK', 'npm did not produce a package-lock.json')
    }
    throw error
  }
  if (!isRecord(raw) || !isRecord(raw['packages'])) {
    throw new InstallerError('ELOCK', 'Invalid package-lock.json')
  }
  const packages = raw['packages']
  const pluginKey = `node_modules/${packageName}`
  let integrity: string | undefined
  for (const [key, entry] of Object.entries(packages)) {
    if (!key) continue
    if (!isRecord(entry)) throw new InstallerError('ELOCK', 'Invalid lock entry')
    if (entry['link'] === true) {
      throw new InstallerError('ELOCK', `Link dependency is not movable: ${key}`)
    }
    if (key === pluginKey) {
      const value = entry['integrity']
      if (typeof value === 'string') integrity = value
      continue
    }
    if (key.startsWith(`${pluginKey}/node_modules/`)) continue
    if (key.startsWith('node_modules/')) {
      throw new InstallerError('ELOCK', `Dependency was hoisted outside the plugin: ${key}`)
    }
  }
  return { integrity }
}

function receiptFor(packageName: string, version: string, source: PluginSource): PluginReceipt {
  return {
    schema: RECEIPT_SCHEMA,
    packageName,
    version,
    source,
    installedAt: new Date().toISOString(),
  }
}

export async function readPluginReceipt(
  pluginDirectory: string,
): Promise<PluginReceipt | undefined> {
  let text: string
  try {
    text = await fs.readFile(path.join(pluginDirectory, INSTALLER_RECEIPT_FILE), 'utf8')
  } catch (error) {
    if (isEnoent(error)) return undefined
    throw error
  }
  let raw: unknown
  try {
    raw = parseJson(text, 'installer receipt')
  } catch {
    // A corrupt receipt is not authoritative identity.  It must not make an
    // explicitly installed plugin impossible to uninstall.
    return undefined
  }
  if (!isRecord(raw) || raw['schema'] !== RECEIPT_SCHEMA) return undefined
  const packageName = raw['packageName']
  const version = raw['version']
  const installedAt = raw['installedAt']
  const source = raw['source']
  if (
    typeof packageName !== 'string' ||
    typeof version !== 'string' ||
    typeof installedAt !== 'string' ||
    !isRecord(source)
  ) {
    return undefined
  }
  if (source['type'] === 'registry') {
    const spec = source['spec']
    if (typeof spec !== 'string') return undefined
    return {
      schema: RECEIPT_SCHEMA,
      packageName,
      version,
      installedAt,
      source: {
        type: 'registry',
        spec,
        registry: typeof source['registry'] === 'string' ? source['registry'] : undefined,
        integrity: typeof source['integrity'] === 'string' ? source['integrity'] : undefined,
      },
    }
  }
  if (source['type'] === 'file') {
    const spec = source['spec']
    const filePath = source['path']
    const integrity = source['integrity']
    if (typeof spec !== 'string' || typeof filePath !== 'string' || typeof integrity !== 'string') {
      return undefined
    }
    return {
      schema: RECEIPT_SCHEMA,
      packageName,
      version,
      installedAt,
      source: { type: 'file', spec, path: filePath, integrity },
    }
  }
  return undefined
}

async function writeReceipt(pluginDirectory: string, receipt: PluginReceipt): Promise<void> {
  await fs.writeFile(
    path.join(pluginDirectory, INSTALLER_RECEIPT_FILE),
    `${JSON.stringify(receipt, null, 2)}\n`,
    'utf8',
  )
}

async function prepareCandidate(
  stage: string,
  spec: NormalizedSpec,
  registry: string | undefined,
): Promise<{ packageName: string; version: string; candidate: string; receipt: PluginReceipt }> {
  const candidates = await listInstalledPackages(path.join(stage, 'node_modules'))
  if (candidates.length === 0) {
    throw new InstallerError('EBADPACKAGE', 'npm did not install a package into the stage')
  }
  if (candidates.length > 1) {
    throw new InstallerError('EBADPACKAGE', 'Stage contains more than one direct package')
  }
  const candidate = candidates[0]
  if (!(await pathExists(candidate))) throw new InstallerError('EBADPACKAGE', 'Missing candidate')
  await assertNotSymlink(candidate, 'Candidate package')
  await assertNoGit(candidate)
  await assertRealPathWithin(stage, candidate, 'Candidate package')

  const manifest = await readManifest(candidate)
  assertSafePackageName(manifest.name)
  if (spec.registryName && spec.registryName !== manifest.name) {
    throw new InstallerError(
      'EIDENTITY',
      `Installed package ${manifest.name} does not match requested ${spec.registryName}`,
    )
  }
  const expectedPath = path.join(stage, 'node_modules', manifest.name)
  if (path.resolve(candidate) !== path.resolve(expectedPath)) {
    throw new InstallerError('EIDENTITY', 'Installed package directory does not match its name')
  }
  await findEntry(candidate, manifest.raw)
  const lock = await validateLock(stage, manifest.name)

  let source: PluginSource
  if (spec.source === 'file') {
    if (!spec.filePath) throw new InstallerError('EBADSTATE', 'Missing local tarball path')
    source = {
      type: 'file',
      spec: spec.displaySpec,
      path: spec.filePath,
      integrity: await hashFile(spec.filePath),
    }
  } else {
    source = {
      type: 'registry',
      spec: spec.displaySpec,
      registry,
      integrity: lock.integrity,
    }
  }
  const receipt = receiptFor(manifest.name, manifest.version, source)
  await writeReceipt(candidate, receipt)
  return {
    packageName: manifest.name,
    version: manifest.version,
    candidate,
    receipt,
  }
}

async function applyTrustedNpmrc(pluginsRoot: string, stage: string): Promise<boolean> {
  const source = path.join(pluginsRoot, '.npmrc')
  if (!(await pathExists(source))) return false
  let stat
  try {
    stat = await fs.stat(source)
  } catch (error) {
    // A dangling trusted .npmrc symlink is configuration state, not a bad
    // plugin package.  Treat it like a missing file.
    if (isEnoent(error)) return false
    throw error
  }
  if (!stat.isFile()) return false
  const content = await fs.readFile(source, 'utf8')
  await fs.writeFile(path.join(stage, '.npmrc'), content, { encoding: 'utf8', mode: 0o600 })
  return true
}

async function removeStageNpmrc(stage: string): Promise<void> {
  await fs.rm(path.join(stage, '.npmrc'), { force: true }).catch(() => undefined)
}

function sanitizeRegistry(value: string): string {
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed)
    url.username = ''
    url.password = ''
    return url.toString()
  } catch {
    return trimmed
  }
}

async function effectiveRegistry(
  options: PrepareOptions,
  stage: string,
  packageName: string,
): Promise<string | undefined> {
  const scope = packageName.startsWith('@') ? packageName.slice(0, packageName.indexOf('/')) : ''
  const key = scope ? `${scope}:registry` : 'registry'
  try {
    const args = ['config', 'get', key, '--prefix', stage]
    if (options.registry) args.push('--registry', options.registry)
    const stdout = await runNpm(options, stage, args)
    const value = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && line !== 'undefined' && line !== 'null')
    if (value) return sanitizeRegistry(value)
  } catch {
    // The receipt is diagnostic metadata; installation itself already
    // succeeded.  Fall back to the caller-provided registry.
  }
  return options.registry ? sanitizeRegistry(options.registry) : undefined
}

export async function prepare(options: PrepareOptions): Promise<PreparedInstall> {
  const { pluginsRoot, workRoot } = resolveRoots(options)
  const normalized = await normalizeSpec(options.spec, options.cwd ?? process.cwd())
  const id = operationId()
  const operationDirectory = operationPath(workRoot, id)
  const stage = path.join(operationDirectory, STAGE_DIR)

  let npmrcApplied = false
  try {
    await fs.mkdir(stage, { recursive: true })
    await assertSameVolumeIfPresent({ pluginsRoot, workRoot })
    await fs.writeFile(
      path.join(stage, 'package.json'),
      JSON.stringify(
        { name: 'poi-plugin-install-stage', version: '0.0.0', private: true },
        null,
        2,
      ),
      'utf8',
    )
    npmrcApplied = await applyTrustedNpmrc(pluginsRoot, stage)
    await runNpmInstall({ ...options, pluginsRoot, workRoot }, stage, normalized.npmSpec)
    const registry =
      normalized.source === 'registry'
        ? await effectiveRegistry(options, stage, normalized.registryName ?? '')
        : undefined
    const prepared = await prepareCandidate(stage, normalized, registry)
    return {
      operationId: id,
      packageName: prepared.packageName,
      version: prepared.version,
      candidatePath: prepared.candidate,
      operationPath: operationDirectory,
      receipt: prepared.receipt,
    }
  } catch (error) {
    await fs.rm(operationDirectory, { recursive: true, force: true }).catch(() => undefined)
    if (error instanceof InstallerError) throw error
    const code = isRecord(error) && typeof error['code'] === 'string' ? error['code'] : undefined
    throw new InstallerError('EBADSTATE', 'Failed to prepare plugin', {
      stage: 'prepare',
      detail: `${code ? `${code}: ` : ''}${error instanceof Error ? error.message : String(error)}`,
    })
  } finally {
    if (npmrcApplied) await removeStageNpmrc(stage)
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await fs.rename(from, to)
      return
    } catch (error) {
      lastError = error
      if (
        !isRecord(error) ||
        !['EACCES', 'EBUSY', 'EPERM', 'ENOTEMPTY'].includes(String(error['code'])) ||
        attempt === 5
      ) {
        break
      }
      await delay(100)
    }
  }
  throw lastError
}

async function assertTargetForInstall(pluginsRoot: string, packageName: string): Promise<string> {
  const target = await ensurePluginParent(pluginsRoot, packageName, true)
  if (await pathExists(target)) {
    await assertNotSymlink(target, 'Active plugin')
    const stat = await fs.lstat(target)
    if (!stat.isDirectory()) throw new InstallerError('EPATH', 'Active plugin is not a directory')
    await assertNoGit(target)
    await assertRealPathWithin(pluginsRoot, target, 'Active plugin')
    try {
      const manifest = await readManifest(target)
      if (manifest.name !== packageName) {
        throw new InstallerError('EIDENTITY', 'Active plugin package name does not match target')
      }
    } catch (error) {
      if (!(error instanceof InstallerError) || error.code !== 'EBADPACKAGE') throw error
      // A broken same-version install may have lost package.json; the path is
      // still protected by the ownership checks above.  Allow repair.
    }
  }
  return target
}

export async function activate(options: ActivateOptions): Promise<InstalledPlugin> {
  const { pluginsRoot, workRoot } = resolveRoots(options)
  const operationDir = operationPath(workRoot, options.operationId)
  const stage = path.join(operationDir, STAGE_DIR)

  try {
    const candidates = await listInstalledPackages(path.join(stage, 'node_modules'))
    if (candidates.length !== 1) {
      throw new InstallerError('EBADSTATE', 'Prepared stage does not contain exactly one package')
    }
    const candidate = candidates[0]
    await assertNotSymlink(candidate, 'Prepared candidate')
    await assertNoGit(candidate)
    await assertRealPathWithin(stage, candidate, 'Prepared candidate')
    const manifest = await readManifest(candidate)
    assertSafePackageName(manifest.name)
    const receipt = await readPluginReceipt(candidate)
    if (!receipt || receipt.packageName !== manifest.name || receipt.version !== manifest.version) {
      throw new InstallerError('EIDENTITY', 'Prepared candidate metadata is inconsistent')
    }

    const target = await assertTargetForInstall(pluginsRoot, manifest.name)
    await assertSameVolume({ pluginsRoot, workRoot })

    try {
      await fs.rm(target, { recursive: true, force: true })
      await renameWithRetry(candidate, target)
    } catch (error) {
      throw new InstallerError('EPATH', 'Failed to activate prepared plugin', {
        stage: 'activate',
        packageName: manifest.name,
        detail: error instanceof Error ? error.message : String(error),
      })
    }

    return { packageName: manifest.name, version: manifest.version, path: target, receipt }
  } finally {
    // Any activation failure abandons this stage; keep no journal to reclaim it.
    await fs.rm(operationDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function remove(options: RemoveOptions): Promise<RemoveResult> {
  const pluginsRoot = path.resolve(options.pluginsRoot)
  assertSafePackageName(options.packageName)
  const target = await ensurePluginParent(pluginsRoot, options.packageName, false)

  let stat
  try {
    stat = await fs.lstat(target)
  } catch (error) {
    if (isEnoent(error)) return { packageName: options.packageName, removed: false, linked: false }
    throw error
  }
  if (stat.isSymbolicLink()) {
    await fs.unlink(target)
    return { packageName: options.packageName, removed: true, linked: true }
  }
  if (!stat.isDirectory()) throw new InstallerError('EPATH', 'Plugin is not a directory')
  await assertNoGit(target)
  await assertRealPathWithin(pluginsRoot, target, 'Plugin')

  const manifest = await readManifest(target).catch((error: unknown) => {
    if (error instanceof InstallerError && error.code === 'EBADPACKAGE') return undefined
    throw error
  })
  if (manifest && manifest.name !== options.packageName) {
    throw new InstallerError('EIDENTITY', 'Plugin package name does not match target')
  }

  await fs.rm(target, { recursive: true, force: true })
  return { packageName: options.packageName, removed: true, linked: false }
}
