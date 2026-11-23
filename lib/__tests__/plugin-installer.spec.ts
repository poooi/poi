import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  activate,
  DEFAULT_NPM_CLI_PATH,
  prepare,
  readPluginReceipt,
  remove,
} from '../plugin-installer'

const FAKE_NPM = String.raw`
const fs = require('node:fs')
const path = require('node:path')
const args = process.argv.slice(2)
const prefixIndex = args.indexOf('--prefix')
const prefix = prefixIndex === -1 ? process.cwd() : args[prefixIndex + 1]
const registryIndex = args.indexOf('--registry')
const registry = registryIndex === -1 ? undefined : args[registryIndex + 1]

function readNpmrc() {
  const file = path.join(prefix, '.npmrc')
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).filter(line => !line.startsWith('#')).map(line => {
      const index = line.indexOf('=')
      return index === -1 ? [line.trim(), ''] : [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    })
  )
}

if (args[0] === 'config' && args[1] === 'get') {
  const key = args[2]
  const npmrc = readNpmrc()
  const value = key.endsWith(':registry')
    ? npmrc[key] || npmrc.registry || registry || ''
    : registry || npmrc.registry || 'https://registry.npmjs.org/'
  process.stdout.write(value + '\n')
  process.exit(0)
}

if (args[0] !== 'install') {
  process.stderr.write('unexpected npm command\n')
  process.exit(2)
}
if (fs.existsSync(path.join(prefix, '.npmrc'))) {
  fs.copyFileSync(path.join(prefix, '.npmrc'), path.join(prefix, 'npmrc-seen'))
}
if (process.env.FAKE_FAIL) {
  process.stderr.write('fake registry failure with token=secret\n')
  process.exit(1)
}
if (process.env.FAKE_WAIT) {
  const until = Date.now() + Number(process.env.FAKE_WAIT)
  while (Date.now() < until) {}
}

const name = process.env.FAKE_NAME || 'poi-plugin-fixture'
const version = process.env.FAKE_VERSION || '1.0.0'
const target = path.join(prefix, 'node_modules', name)
fs.mkdirSync(target, { recursive: true })
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name, version, main: 'index.js' }))
if (!process.env.FAKE_NO_ENTRY) fs.writeFileSync(path.join(target, 'index.js'), 'module.exports = {}')
if (process.env.FAKE_GIT) fs.mkdirSync(path.join(target, '.git'))

const baseRegistry = (registry || 'https://registry.npmjs.org/').replace(/\/$/, '')
const packageKey = 'node_modules/' + name
const packages = {
  '': { dependencies: { [name]: version } },
  [packageKey]: {
    version,
    resolved: baseRegistry + '/' + name + '/-/' + name.split('/').pop() + '-' + version + '.tgz',
    integrity: 'sha512-fake',
  },
}
if (process.env.FAKE_HOIST) packages['node_modules/other'] = { version: '1.0.0' }
fs.writeFileSync(path.join(prefix, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages }))
process.exit(0)
`

interface TestEnv {
  root: string
  pluginsRoot: string
  workRoot: string
  npmCliPath: string
}

const tempDirs: string[] = []

async function makeEnv(createPluginRoot = true): Promise<TestEnv> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'poi-plugin-installer-'))
  tempDirs.push(root)
  const pluginsRoot = path.join(root, 'plugins')
  const workRoot = path.join(root, '.plugin-install')
  if (createPluginRoot) {
    await fs.mkdir(path.join(pluginsRoot, 'node_modules'), { recursive: true })
  }
  const npmCliPath = path.join(root, 'fake-npm.cjs')
  await fs.writeFile(npmCliPath, FAKE_NPM, 'utf8')
  return { root, pluginsRoot, workRoot, npmCliPath }
}

async function writePlugin(
  directory: string,
  name: string,
  version: string,
  extras: { git?: boolean; entry?: boolean } = {},
): Promise<void> {
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({ name, version, main: 'index.js' }),
    'utf8',
  )
  if (extras.entry !== false) {
    await fs.writeFile(path.join(directory, 'index.js'), 'module.exports = {}\n', 'utf8')
  }
  if (extras.git) await fs.mkdir(path.join(directory, '.git'))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function jsonFile(file: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await fs.readFile(file, 'utf8'))
  if (!isRecord(value)) throw new Error(`Expected ${file} to contain an object`)
  return value
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target)
    return true
  } catch {
    return false
  }
}

async function runNpm(args: string[], cwd: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [DEFAULT_NPM_CLI_PATH, ...args], {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, npm_config_update_notifier: 'false' },
    })
    let stderr = ''
    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += String(chunk)
    })
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`npm ${args[0] ?? ''} exited ${String(code)}: ${stderr}`))
    })
  })
}

async function installFixture(env: TestEnv, spec: string): Promise<void> {
  const prepared = await prepare({
    pluginsRoot: env.pluginsRoot,
    workRoot: env.workRoot,
    spec,
    npmCliPath: env.npmCliPath,
  })
  await activate({
    pluginsRoot: env.pluginsRoot,
    workRoot: env.workRoot,
    operationId: prepared.operationId,
  })
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('plugin installer', () => {
  it('prepares without touching the active plugin, then replaces only that plugin', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const target = path.join(env.pluginsRoot, 'node_modules', name)
    await writePlugin(target, name, '0.9.0')
    const untouched = path.join(env.pluginsRoot, 'node_modules', 'poi-plugin-other', 'index.js')
    await fs.mkdir(path.dirname(untouched), { recursive: true })
    await fs.writeFile(untouched, 'other\n', 'utf8')

    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${name}@1.0.0`,
      npmCliPath: env.npmCliPath,
      registry: 'https://registry.example/',
    })

    expect(prepared.packageName).toBe(name)
    expect(prepared.version).toBe('1.0.0')
    expect((await jsonFile(path.join(target, 'package.json')))['version']).toBe('0.9.0')
    expect(await readPluginReceipt(prepared.candidatePath)).toMatchObject({
      packageName: name,
      version: '1.0.0',
      source: { type: 'registry', registry: 'https://registry.example/' },
    })

    const installed = await activate({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      operationId: prepared.operationId,
    })
    expect(installed.path).toBe(target)
    expect((await jsonFile(path.join(target, 'package.json')))['version']).toBe('1.0.0')
    expect(await readPluginReceipt(target)).toMatchObject({ packageName: name, version: '1.0.0' })
    expect(await fs.readFile(untouched, 'utf8')).toBe('other\n')
    await expect(fs.access(prepared.operationPath)).rejects.toThrow()
  })

  it('creates the missing plugin root and scoped parent for a first install', async () => {
    const env = await makeEnv(false)
    await installFixture(env, 'poi-plugin-fixture@1.0.0')

    const scoped = '@scope/poi-plugin-fixture'
    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${scoped}@1.0.0`,
      npmCliPath: env.npmCliPath,
      env: { FAKE_NAME: scoped },
    })
    await activate({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      operationId: prepared.operationId,
    })

    expect(
      await jsonFile(path.join(env.pluginsRoot, 'node_modules', scoped, 'package.json')),
    ).toMatchObject({ name: scoped, version: '1.0.0' })
  })

  it('installs a local tarball into a completely missing plugin root with the real npm CLI', async () => {
    const env = await makeEnv(false)
    const name = 'poi-plugin-real-npm-fixture'
    const packageDir = path.join(env.root, 'fixture-package')
    await writePlugin(packageDir, name, '1.0.0')
    await runNpm(['pack', '--pack-destination', env.root, '--silent'], packageDir)
    const tarball = path.join(env.root, `${name}-1.0.0.tgz`)
    await fs.access(tarball)

    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: tarball,
      npmCliPath: DEFAULT_NPM_CLI_PATH,
    })
    expect(prepared.packageName).toBe(name)
    await activate({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      operationId: prepared.operationId,
    })
    expect(
      await jsonFile(path.join(env.pluginsRoot, 'node_modules', name, 'package.json')),
    ).toMatchObject({ name, version: '1.0.0' })
  }, 30_000)

  it('applies trusted plugins/.npmrc and records the scoped registry', async () => {
    const env = await makeEnv()
    const name = '@scope/poi-plugin-fixture'
    await fs.writeFile(
      path.join(env.pluginsRoot, '.npmrc'),
      '@scope:registry=https://scope.example/\n',
      'utf8',
    )

    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${name}@1.0.0`,
      npmCliPath: env.npmCliPath,
      registry: 'https://default.example/',
      env: { FAKE_NAME: name },
    })

    expect(
      await fs.readFile(path.join(prepared.operationPath, 'stage', 'npmrc-seen'), 'utf8'),
    ).toBe('@scope:registry=https://scope.example/\n')
    await expect(fs.access(path.join(prepared.operationPath, 'stage', '.npmrc'))).rejects.toThrow()
    expect(await readPluginReceipt(prepared.candidatePath)).toMatchObject({
      packageName: name,
      source: { type: 'registry', registry: 'https://scope.example/' },
    })
  })

  it('rejects a scoped parent junction before activating or removing a missing target', async () => {
    const env = await makeEnv()
    const name = '@scope/poi-plugin-fixture'
    const outside = path.join(env.root, 'outside')
    await fs.mkdir(outside, { recursive: true })
    const scopeDir = path.join(env.pluginsRoot, 'node_modules', '@scope')
    await fs.symlink(outside, scopeDir, process.platform === 'win32' ? 'junction' : 'dir')

    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${name}@1.0.0`,
      npmCliPath: env.npmCliPath,
      env: { FAKE_NAME: name },
    })
    await expect(
      activate({
        pluginsRoot: env.pluginsRoot,
        workRoot: env.workRoot,
        operationId: prepared.operationId,
      }),
    ).rejects.toMatchObject({ code: 'EPATH' })
    // Failed pre-activation validation does not leave an abandoned stage.
    await expect(fs.access(prepared.operationPath)).rejects.toThrow()
    await expect(remove({ pluginsRoot: env.pluginsRoot, packageName: name })).rejects.toMatchObject(
      { code: 'EPATH' },
    )
    expect(await fs.readdir(outside)).toEqual([])
  })

  it('rejects cross-volume roots before removing the active plugin', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const target = path.join(env.pluginsRoot, 'node_modules', name)
    await writePlugin(target, name, '0.9.0')
    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${name}@1.0.0`,
      npmCliPath: env.npmCliPath,
    })

    const realPluginsRoot = await fs.realpath(env.pluginsRoot)
    const originalStat = fs.stat.bind(fs)
    const statSpy = jest.spyOn(fs, 'stat').mockImplementation(async (entry, options) => {
      const stats = await originalStat(entry, options)
      if (String(entry) === realPluginsRoot) {
        Object.defineProperty(stats, 'dev', {
          value: typeof stats.dev === 'number' ? stats.dev + 1 : stats.dev + 1n,
        })
      }
      return stats
    })
    try {
      await expect(
        activate({
          pluginsRoot: env.pluginsRoot,
          workRoot: env.workRoot,
          operationId: prepared.operationId,
        }),
      ).rejects.toMatchObject({ code: 'EPATH', message: expect.stringContaining('same volume') })
    } finally {
      statSpy.mockRestore()
    }

    expect((await jsonFile(path.join(target, 'package.json')))['version']).toBe('0.9.0')
  })

  it('keeps the old plugin gone after a failed activation and succeeds on normal retry', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const other = 'poi-plugin-other'
    const target = path.join(env.pluginsRoot, 'node_modules', name)
    const otherTarget = path.join(env.pluginsRoot, 'node_modules', other)
    await writePlugin(target, name, '0.9.0')
    await writePlugin(otherTarget, other, '1.0.0')
    const otherBefore = await fs.readFile(path.join(otherTarget, 'package.json'), 'utf8')

    const prepared = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${name}@1.0.0`,
      npmCliPath: env.npmCliPath,
    })
    const originalRename = fs.rename.bind(fs)
    const renameSpy = jest.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      if (String(to) === target && String(from).includes(`${path.sep}stage${path.sep}`)) {
        throw Object.assign(new Error('candidate locked'), { code: 'EBUSY' })
      }
      return originalRename(from, to)
    })
    try {
      await expect(
        activate({
          pluginsRoot: env.pluginsRoot,
          workRoot: env.workRoot,
          operationId: prepared.operationId,
        }),
      ).rejects.toMatchObject({ code: 'EPATH' })
    } finally {
      renameSpy.mockRestore()
    }

    expect(await pathExists(target)).toBe(false)
    expect(await fs.readFile(path.join(otherTarget, 'package.json'), 'utf8')).toBe(otherBefore)

    const retried = await prepare({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      spec: `${name}@1.0.0`,
      npmCliPath: env.npmCliPath,
    })
    await activate({
      pluginsRoot: env.pluginsRoot,
      workRoot: env.workRoot,
      operationId: retried.operationId,
    })
    expect((await jsonFile(path.join(target, 'package.json')))['version']).toBe('1.0.0')
    expect(await fs.readFile(path.join(otherTarget, 'package.json'), 'utf8')).toBe(otherBefore)
  })

  it('ignores a dangling trusted plugins/.npmrc link', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const missingTarget = path.join(env.root, 'missing-npmrc-target')
    await fs.symlink(
      missingTarget,
      path.join(env.pluginsRoot, '.npmrc'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )

    await installFixture(env, `${name}@1.0.0`)
    expect(await readPluginReceipt(path.join(env.pluginsRoot, 'node_modules', name))).toBeDefined()
  })

  it('allows explicit uninstall when the installer receipt is malformed', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const target = path.join(env.pluginsRoot, 'node_modules', name)
    await writePlugin(target, name, '1.0.0')
    await fs.writeFile(path.join(target, '.poi-plugin-installer.json'), '{not json', 'utf8')

    await expect(
      remove({ pluginsRoot: env.pluginsRoot, packageName: name }),
    ).resolves.toMatchObject({ removed: true })
    await expect(fs.access(target)).rejects.toThrow()
  })

  it('cleans a failed preparation without touching the active plugin', async () => {
    const env = await makeEnv(false)
    await fs.writeFile(env.workRoot, 'not a directory', 'utf8')

    await expect(
      prepare({
        pluginsRoot: env.pluginsRoot,
        workRoot: env.workRoot,
        spec: 'poi-plugin-fixture@1.0.0',
        npmCliPath: env.npmCliPath,
      }),
    ).rejects.toMatchObject({ code: 'EBADSTATE', stage: 'prepare' })
    expect((await fs.stat(env.workRoot)).isFile()).toBe(true)
  })

  it('removes a plugin and unlinks a development link without deleting its source', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const target = path.join(env.pluginsRoot, 'node_modules', name)
    await writePlugin(target, name, '1.0.0')
    await expect(
      remove({ pluginsRoot: env.pluginsRoot, packageName: name }),
    ).resolves.toMatchObject({ removed: true, linked: false })
    await expect(fs.access(target)).rejects.toThrow()

    const source = path.join(env.root, 'linked-source')
    await writePlugin(source, `${name}-linked`, '1.0.0')
    const linkName = `${name}-linked`
    const link = path.join(env.pluginsRoot, 'node_modules', linkName)
    await fs.symlink(source, link, process.platform === 'win32' ? 'junction' : 'dir')
    await expect(
      remove({ pluginsRoot: env.pluginsRoot, packageName: linkName }),
    ).resolves.toMatchObject({ removed: true, linked: true })
    expect((await jsonFile(path.join(source, 'package.json')))['version']).toBe('1.0.0')
  })

  it('refuses Git worktrees and cleans prepared stages on npm or lock failures', async () => {
    const env = await makeEnv()
    const name = 'poi-plugin-fixture'
    const target = path.join(env.pluginsRoot, 'node_modules', name)
    await writePlugin(target, name, '0.9.0', { git: true })
    await expect(remove({ pluginsRoot: env.pluginsRoot, packageName: name })).rejects.toMatchObject(
      { code: 'EPATH' },
    )

    await fs.rm(path.join(target, '.git'), { recursive: true, force: true })
    await expect(
      prepare({
        pluginsRoot: env.pluginsRoot,
        workRoot: env.workRoot,
        spec: `${name}@1.0.0`,
        npmCliPath: env.npmCliPath,
        env: { FAKE_FAIL: '1' },
      }),
    ).rejects.toMatchObject({ code: 'ENPM' })
    expect((await jsonFile(path.join(target, 'package.json')))['version']).toBe('0.9.0')
    expect(await fs.readdir(env.workRoot)).toEqual([])

    await expect(
      prepare({
        pluginsRoot: env.pluginsRoot,
        workRoot: env.workRoot,
        spec: `${name}@1.0.0`,
        npmCliPath: env.npmCliPath,
        env: { FAKE_HOIST: '1' },
      }),
    ).rejects.toMatchObject({ code: 'ELOCK' })
    expect(await fs.readdir(env.workRoot)).toEqual([])

    await expect(
      prepare({
        pluginsRoot: env.pluginsRoot,
        workRoot: env.workRoot,
        spec: `${name}@1.0.0`,
        npmCliPath: env.npmCliPath,
        env: { FAKE_NO_ENTRY: '1' },
      }),
    ).rejects.toMatchObject({ code: 'EBADPACKAGE' })
    expect(await fs.readdir(env.workRoot)).toEqual([])
  })
})
