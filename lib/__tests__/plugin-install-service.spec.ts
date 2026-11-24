import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { createPluginInstallService, type PluginInstallService } from '../plugin-install-service'

const FAKE_NPM = String.raw`
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const prefix = opt('--prefix') || process.cwd()
const logFile = process.env.FAKE_NPM_LOG
const record = (entry) => {
  if (logFile) fs.appendFileSync(logFile, JSON.stringify(entry) + '\n')
}
const fail = (message, code = 1) => {
  process.stderr.write(message)
  process.exit(code)
}

if (args[0] === 'config' && args[1] === 'get') {
  process.stdout.write(process.env.FAKE_NPM_REGISTRY || 'https://registry.example/')
  process.exit(0)
}

if (args[0] === 'view') {
  record({
    command: 'view',
    target: args[1],
    argv: args,
    proxy: process.env.npm_config_proxy || null,
    httpsProxy: process.env.npm_config_https_proxy || null,
  })
  const manifests = JSON.parse(process.env.FAKE_NPM_VIEW || '{}')
  const manifest = manifests[args[1]]
  if (!manifest) fail('E404')
  process.stdout.write(JSON.stringify(manifest))
  process.exit(0)
}

if (args[0] === 'uninstall') {
  const name = args[args.length - 1]
  fs.rmSync(path.join(prefix, 'node_modules', name), { recursive: true, force: true })
  process.exit(0)
}

if (args[0] === 'install') {
  const target = args[args.length - 1]
  const packages = JSON.parse(process.env.FAKE_NPM_PACKAGES || '{}')
  const pkg = packages[target]
  if (!pkg) fail('E404: ' + target)

  const lockPath = process.env.FAKE_NPM_LOCKFILE
  let lock
  try {
    if (lockPath) lock = fs.openSync(lockPath, 'wx')
  } catch (e) {
    fail('overlapping npm install', 2)
  }
  try {
    if (process.env.FAKE_NPM_STARTED_FILE) {
      fs.writeFileSync(process.env.FAKE_NPM_STARTED_FILE, '')
    }
    const gate = process.env.FAKE_NPM_INSTALL_GATE
    if (gate) {
      const deadline = Date.now() + 10_000
      while (!fs.existsSync(gate) && Date.now() < deadline) {
        const busyUntil = Date.now() + 10
        while (Date.now() < busyUntil) {}
      }
      if (!fs.existsSync(gate)) fail('gate timeout')
    }
    const busyUntil = Date.now() + Number(process.env.FAKE_NPM_DELAY || 20)
    while (Date.now() < busyUntil) {}

    const dir = path.join(prefix, 'node_modules', pkg.name)
    fs.mkdirSync(path.dirname(dir), { recursive: true })
    fs.mkdirSync(dir, { recursive: true })
    const manifest = Object.assign(
      { name: pkg.name, version: pkg.version, main: 'index.js' },
      pkg.manifest || {},
    )
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest, null, 2))
    fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = {}\n')

    const npmrcPath = path.join(prefix, '.npmrc')
    record({
      command: 'install',
      target,
      prefix,
      argv: args,
      npmrc: fs.existsSync(npmrcPath) ? fs.readFileSync(npmrcPath, 'utf8') : null,
      userconfig: process.env.npm_config_userconfig || null,
      proxy: process.env.npm_config_proxy || null,
      httpsProxy: process.env.npm_config_https_proxy || null,
    })
    fs.writeFileSync(
      path.join(prefix, 'package-lock.json'),
      JSON.stringify(
        {
          name: 'poi-plugin-install-stage',
          version: '0.0.0',
          lockfileVersion: 3,
          requires: true,
          packages: {
            '': { name: 'poi-plugin-install-stage', version: '0.0.0', dependencies: { [pkg.name]: pkg.version } },
            ['node_modules/' + pkg.name]: {
              version: pkg.version,
              resolved: 'https://registry.example/' + pkg.name + '/-/' + pkg.name + '-' + pkg.version + '.tgz',
              integrity: 'sha512-ZmFrZQ==',
            },
          },
        },
        null,
        2,
      ),
    )
  } finally {
    if (lock !== undefined) {
      fs.closeSync(lock)
      if (lockPath) fs.rmSync(lockPath, { force: true })
    }
  }
  process.exit(0)
}

fail('unsupported command: ' + args.join(' '))
`

interface TestContext {
  root: string
  pluginsRoot: string
  workRoot: string
  npmCliPath: string
  logPath: string
  env: Record<string, string>
}

let context: TestContext

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target)
    return true
  } catch {
    return false
  }
}

function packagesEnv(packages: Record<string, unknown>): Record<string, string> {
  return { ...context.env, FAKE_NPM_PACKAGES: JSON.stringify(packages) }
}

function createService(env: Record<string, string> = context.env): PluginInstallService {
  return createPluginInstallService({
    pluginsRoot: context.pluginsRoot,
    workRoot: context.workRoot,
    npmCliPath: context.npmCliPath,
    env,
    timeoutMs: 10_000,
  })
}

async function install(
  service: PluginInstallService,
  spec: string,
): Promise<{ packageName: string; version: string; path: string }> {
  const prepared = await service.prepare({ spec, registry: 'https://registry.example/' })
  const installed = await service.activate(prepared.operationId)
  return { packageName: installed.packageName, version: installed.version, path: installed.path }
}

beforeEach(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'poi-install-service-'))
  const pluginsRoot = path.join(root, 'plugins')
  const workRoot = path.join(root, '.plugin-install')
  await fs.mkdir(pluginsRoot, { recursive: true })
  const npmCliPath = path.join(root, 'fake-npm.js')
  await fs.writeFile(npmCliPath, FAKE_NPM, 'utf8')
  context = {
    root,
    pluginsRoot,
    workRoot,
    npmCliPath,
    logPath: path.join(root, 'npm.log'),
    env: { FAKE_NPM_LOG: path.join(root, 'npm.log') },
  }
})

afterEach(async () => {
  await fs.rm(context.root, { recursive: true, force: true })
})

describe('plugin install service', () => {
  it('prepares, swaps and inspects a registry install', async () => {
    const service = createService(
      packagesEnv({
        'poi-plugin-a@1.2.0': { name: 'poi-plugin-a', version: '1.2.0' },
      }),
    )

    const prepared = await service.prepare({
      spec: 'poi-plugin-a@1.2.0',
      registry: 'https://registry.example/',
    })
    expect(prepared.packageName).toBe('poi-plugin-a')
    const installed = await service.activate(prepared.operationId)

    expect(installed.version).toBe('1.2.0')
    expect(await pathExists(installed.path)).toBe(true)
    const info = await service.inspectPlugin('poi-plugin-a')
    expect(info.installSource).toBe('registry')
    expect(info.spec).toBe('poi-plugin-a@1.2.0')
    expect(info.receipt?.source).toMatchObject({
      type: 'registry',
      registry: 'https://registry.example/',
      integrity: 'sha512-ZmFrZQ==',
    })
    // Completed operations remove their work directory.
    expect(await fs.readdir(context.workRoot).catch(() => [])).toEqual([])
  })

  it('handles scoped plugin names', async () => {
    const service = createService(
      packagesEnv({
        '@scope/poi-plugin-b@2.0.0': { name: '@scope/poi-plugin-b', version: '2.0.0' },
      }),
    )
    const installed = await install(service, '@scope/poi-plugin-b@2.0.0')
    expect(installed.path).toBe(
      path.join(context.pluginsRoot, 'node_modules', '@scope', 'poi-plugin-b'),
    )
    expect((await service.inspectPlugin('@scope/poi-plugin-b')).installSource).toBe('registry')
  })

  it('serializes concurrent preparations', async () => {
    const env = {
      ...packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
        'poi-plugin-b@1.0.0': { name: 'poi-plugin-b', version: '1.0.0' },
      }),
      FAKE_NPM_LOCKFILE: path.join(context.root, 'npm.lock'),
    }
    const service = createService(env)

    const [first, second] = await Promise.all([
      service.prepare({ spec: 'poi-plugin-a@1.0.0' }),
      service.prepare({ spec: 'poi-plugin-b@1.0.0' }),
    ])
    await service.activate(first.operationId)
    await service.activate(second.operationId)
    expect(await fs.readdir(context.workRoot)).toEqual([])
  })

  it('replaces a plugin and keeps a single active tree', async () => {
    const env = packagesEnv({
      'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
      'poi-plugin-a@1.1.0': { name: 'poi-plugin-a', version: '1.1.0' },
    })
    const service = createService(env)
    await install(service, 'poi-plugin-a@1.0.0')
    await install(service, 'poi-plugin-a@1.1.0')

    const manifest: unknown = JSON.parse(
      await fs.readFile(
        path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-a', 'package.json'),
        'utf8',
      ),
    )
    expect(isRecord(manifest) ? manifest['version'] : undefined).toBe('1.1.0')
    expect((await service.inspectPlugin('poi-plugin-a')).spec).toBe('poi-plugin-a@1.1.0')
  })

  it('removes one package and unlinks links without touching siblings', async () => {
    const service = createService(
      packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
        'poi-plugin-b@1.0.0': { name: 'poi-plugin-b', version: '1.0.0' },
      }),
    )
    await install(service, 'poi-plugin-a@1.0.0')
    await install(service, 'poi-plugin-b@1.0.0')

    const removed = await service.remove('poi-plugin-a')
    expect(removed).toEqual({ packageName: 'poi-plugin-a', removed: true, linked: false })
    expect(await pathExists(path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-b'))).toBe(
      true,
    )

    const source = path.join(context.root, 'dev-plugin')
    await fs.mkdir(source, { recursive: true })
    await fs.writeFile(
      path.join(source, 'package.json'),
      JSON.stringify({ name: 'poi-plugin-link', version: '1.0.0' }),
    )
    const linkPath = path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-link')
    await fs.symlink(source, linkPath, 'junction')
    const linked = await service.remove('poi-plugin-link')
    expect(linked).toEqual({ packageName: 'poi-plugin-link', removed: true, linked: true })
    expect(await pathExists(linkPath)).toBe(false)
    expect(await pathExists(source)).toBe(true)
  })

  it('describes legacy registry and file installs', async () => {
    await fs.writeFile(
      path.join(context.pluginsRoot, 'package.json'),
      JSON.stringify({ dependencies: { 'poi-plugin-legacy': '^1.0.0' } }),
    )
    const legacyDir = path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-legacy')
    await fs.mkdir(legacyDir, { recursive: true })
    await fs.writeFile(
      path.join(legacyDir, 'package.json'),
      JSON.stringify({ name: 'poi-plugin-legacy', version: '1.4.0' }),
    )

    const service = createService()
    expect(await service.inspectPlugin('poi-plugin-legacy')).toMatchObject({
      installSource: 'legacy-registry',
      spec: 'poi-plugin-legacy@1.4.0',
    })
    await fs.unlink(path.join(legacyDir, 'package.json'))
    expect(await service.inspectPlugin('poi-plugin-legacy')).toMatchObject({
      installSource: 'legacy-registry',
      spec: 'poi-plugin-legacy@^1.0.0',
    })

    await fs.writeFile(
      path.join(context.pluginsRoot, 'package-lock.json'),
      JSON.stringify({
        packages: {
          'node_modules/poi-plugin-locked': {
            resolved: 'https://registry.example/poi-plugin-locked/-/poi-plugin-locked-1.0.0.tgz',
          },
        },
      }),
    )
    const lockedDir = path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-locked')
    await fs.mkdir(lockedDir, { recursive: true })
    await fs.writeFile(
      path.join(lockedDir, 'package.json'),
      JSON.stringify({ name: 'poi-plugin-locked', version: '1.0.0' }),
    )
    expect(await service.inspectPlugin('poi-plugin-locked')).toMatchObject({
      installSource: 'legacy-registry',
      spec: 'poi-plugin-locked@1.0.0',
    })
  })

  it('queries registry metadata through npm view', async () => {
    const service = createService({
      ...context.env,
      FAKE_NPM_VIEW: JSON.stringify({
        'poi-plugin-a@latest': { version: '1.3.0', poiPlugin: { apiVer: { 'v13.0.0': '1.2.0' } } },
      }),
    })
    const proxy = 'http://dummy:dummy@proxy.example:8080'
    await expect(
      service.view({
        name: 'poi-plugin-a',
        tag: 'latest',
        registry: 'https://registry.example/',
        proxy,
      }),
    ).resolves.toEqual({
      version: '1.3.0',
      poiPlugin: { apiVer: { 'v13.0.0': '1.2.0' } },
    })
    const viewEntry = (await fs.readFile(context.logPath, 'utf8'))
      .trim()
      .split('\n')
      .map((line): unknown => JSON.parse(line))
      .filter(isRecord)
      .find((entry) => entry['command'] === 'view')
    expect(viewEntry).toMatchObject({ proxy, httpsProxy: proxy })
    expect(viewEntry?.['argv']).not.toContain('--proxy')
    await expect(
      service.view({ name: 'poi-plugin-missing', tag: 'latest' }),
    ).resolves.toBeUndefined()
  })

  it('passes the proxy through the npm environment, never argv', async () => {
    const proxy = 'http://dummy%40user%3A%2F:dummy%3Apass%40%2F@proxy.example:8080'
    const service = createService(
      packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
      }),
    )
    const prepared = await service.prepare({ spec: 'poi-plugin-a@1.0.0', proxy })
    await service.activate(prepared.operationId)

    const entry: unknown = JSON.parse(
      (await fs.readFile(context.logPath, 'utf8')).trim().split('\n')[0] ?? '',
    )
    expect(entry).toMatchObject({ command: 'install', proxy, httpsProxy: proxy })
    const argv = isRecord(entry) ? entry['argv'] : undefined
    expect(argv).not.toContain('--proxy')
    expect(JSON.stringify(argv)).not.toContain('dummy')
  })

  it('runs update lookups outside the write queue', async () => {
    const gate = path.join(context.root, 'install.gate')
    const started = path.join(context.root, 'install.started')
    const service = createService({
      ...packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
      }),
      FAKE_NPM_INSTALL_GATE: gate,
      FAKE_NPM_STARTED_FILE: started,
      FAKE_NPM_VIEW: JSON.stringify({ 'poi-plugin-a@latest': { version: '1.1.0' } }),
    })

    const prepare = service.prepare({ spec: 'poi-plugin-a@1.0.0' })
    for (let attempt = 0; attempt < 200 && !(await pathExists(started)); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(await pathExists(started)).toBe(true)

    // The install holds the write queue and the npm child. A view must still
    // complete instead of waiting for the gate to open.
    await expect(service.view({ name: 'poi-plugin-a', tag: 'latest' })).resolves.toEqual({
      version: '1.1.0',
    })

    await fs.writeFile(gate, '')
    const prepared = await prepare
    await service.activate(prepared.operationId)
  })

  it('retries normally after activation fails and removes the old plugin', async () => {
    const service = createService(
      packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
        'poi-plugin-a@2.0.0': { name: 'poi-plugin-a', version: '2.0.0' },
        'poi-plugin-b@1.0.0': { name: 'poi-plugin-b', version: '1.0.0' },
      }),
    )
    await install(service, 'poi-plugin-a@1.0.0')
    await install(service, 'poi-plugin-b@1.0.0')
    const targetA = path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-a')
    const targetB = path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-b')
    const bBefore = await fs.readFile(path.join(targetB, 'package.json'), 'utf8')

    const prepared = await service.prepare({ spec: 'poi-plugin-a@2.0.0' })
    const originalRename = fs.rename.bind(fs)
    const renameSpy = jest.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      if (String(to) === targetA && String(from).includes(`${path.sep}stage${path.sep}`)) {
        throw Object.assign(new Error('candidate locked'), { code: 'EBUSY' })
      }
      return originalRename(from, to)
    })
    try {
      await expect(service.activate(prepared.operationId)).rejects.toMatchObject({
        code: 'EPATH',
      })
    } finally {
      renameSpy.mockRestore()
    }

    expect(await pathExists(targetA)).toBe(false)
    expect(await fs.readFile(path.join(targetB, 'package.json'), 'utf8')).toBe(bBefore)

    // The ordinary install entry point is enough to recover; no journal or
    // rollback state is involved.
    const reinstalled = await install(service, 'poi-plugin-a@2.0.0')
    expect(reinstalled.version).toBe('2.0.0')
    expect(await fs.readFile(path.join(targetB, 'package.json'), 'utf8')).toBe(bBefore)
  })

  it('copies trusted project npmrc through the installer, not a second userconfig', async () => {
    const projectNpmrc = path.join(context.pluginsRoot, '.npmrc')
    await fs.writeFile(projectNpmrc, '//registry.example/:_authToken=secret\n')
    const service = createService(
      packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
      }),
    )
    const prepared = await service.prepare({ spec: 'poi-plugin-a@1.0.0' })

    const firstLogLine = (await fs.readFile(context.logPath, 'utf8')).trim().split('\n')[0] ?? ''
    const firstEntry: unknown = JSON.parse(firstLogLine)
    expect(firstEntry).toMatchObject({
      command: 'install',
      npmrc: '//registry.example/:_authToken=secret\n',
    })
    // The service must not replace npm's userconfig with a merged copy of its own.
    expect(String(isRecord(firstEntry) ? (firstEntry['userconfig'] ?? '') : '')).not.toContain(
      '.plugin-install',
    )
    // The trusted config is not left inside the plugin tree.
    expect(await pathExists(path.join(prepared.candidatePath, '.npmrc'))).toBe(false)
    await service.activate(prepared.operationId)
  })

  it('rejects a repair source that changed since installation', async () => {
    const tarball = path.join(context.root, 'offline.tgz')
    await fs.writeFile(tarball, 'first')
    const spec = `file:${tarball}`
    const service = createService(
      packagesEnv({
        [spec]: { name: 'poi-plugin-offline', version: '1.0.0' },
      }),
    )
    const prepared = await service.prepare({ spec })
    const integrity =
      prepared.receipt.source.type === 'file' ? prepared.receipt.source.integrity : ''
    await service.activate(prepared.operationId)

    await fs.writeFile(tarball, 'changed')
    await expect(
      service.prepare({ spec, expected: { type: 'file', integrity } }),
    ).rejects.toMatchObject({ code: 'EIDENTITY' })
    await expect(
      service.prepare({ spec, expected: { type: 'file', integrity: 'sha512-wrong' } }),
    ).rejects.toMatchObject({ code: 'EIDENTITY' })
    expect(await fs.readdir(context.workRoot)).toEqual([])
  })

  it('allows reselecting a local tarball through the normal install entry point', async () => {
    const tarball = path.join(context.root, 'offline-reselect.tgz')
    await fs.writeFile(tarball, 'first')
    const spec = `file:${tarball}`
    const service = createService(
      packagesEnv({
        [spec]: { name: 'poi-plugin-offline', version: '1.0.0' },
      }),
    )
    await install(service, spec)

    await fs.writeFile(tarball, 'reselect')
    const prepared = await service.prepare({ spec })
    await service.activate(prepared.operationId)
    expect(
      await pathExists(path.join(context.pluginsRoot, 'node_modules', 'poi-plugin-offline')),
    ).toBe(true)
  })

  it('accepts an unchanged recorded registry integrity', async () => {
    const service = createService(
      packagesEnv({
        'poi-plugin-a@1.0.0': { name: 'poi-plugin-a', version: '1.0.0' },
      }),
    )
    const repaired = await service.prepare({
      spec: 'poi-plugin-a@1.0.0',
      expected: { type: 'registry', integrity: 'sha512-ZmFrZQ==' },
    })
    await service.activate(repaired.operationId)

    await expect(
      service.prepare({
        spec: 'poi-plugin-a@1.0.0',
        expected: { type: 'registry', integrity: 'sha512-other' },
      }),
    ).rejects.toMatchObject({ code: 'EIDENTITY' })
  })
})
