import type * as FsExtra from 'fs-extra'
import type * as NodePath from 'path'
import type * as CreateStoreModule from 'views/create-store'
import type * as PluginsReducerModule from 'views/redux/plugins'

import type * as PluginManagerModule from '../index'
import type * as NpmUtilsModule from '../npm-utils'
import type * as PluginTypes from '../types'
import type { Plugin } from '../types'
import type * as PluginUtils from '../utils'

const mockTestRoot = require('fs').mkdtempSync(
  require('path').join(require('os').tmpdir(), 'poi-plugin-manager-tests-'),
)
const mockPluginPath = require('path').join(mockTestRoot, 'plugins')
const mockExtraPath = require('path').join(mockTestRoot, 'plugins-extra')
const mockPluginNodeModules = require('path').join(mockPluginPath, 'node_modules')
const mockPluginStore: { plugins: Plugin[] } = { plugins: [] }

jest.mock('views/env', () => ({
  config: { get: jest.fn((_key: string, fallback?: unknown) => fallback) },
  ROOT: process.cwd(),
  PLUGIN_PATH: mockPluginPath,
  PLUGIN_EXTRA_PATH: mockExtraPath,
}))

jest.mock('views/create-store', () => ({
  dispatch: jest.fn(),
  getStore: jest.fn((key: string) => (key === 'plugins' ? mockPluginStore.plugins : undefined)),
}))

jest.mock('../utils', () => {
  const npmUtils = jest.requireActual<typeof NpmUtilsModule>('../npm-utils')
  const types = jest.requireActual<typeof PluginTypes>('../types')
  return {
    ...npmUtils,
    isRecord: types.isRecord,
    getNpmConfig: jest.fn(() => ({
      registry: 'https://registry.example.test',
      prefix: require('os').tmpdir(),
      enableBetaPluginCheck: false,
    })),
    stagePluginPackage: jest.fn(),
    unloadPlugin: jest.fn((plugin: unknown) => plugin),
    readPlugin: jest.fn(),
    enablePlugin: jest.fn((plugin: unknown) => plugin),
    notifyFailed: jest.fn(),
  }
})

jest.mock('@electron/remote', () => ({
  getCurrentWebContents: () => ({ once: jest.fn() }),
  require: jest.fn(),
}))

jest.mock('node-fetch', () => jest.fn())

jest.mock('views/env-parts/i18next', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}))

Object.assign(globalThis, {
  window: { isSafeMode: false, toast: jest.fn() },
})

const fs = jest.requireActual<typeof FsExtra>('fs-extra')
const path = jest.requireActual<typeof NodePath>('path')
const { PluginManager } = jest.requireActual<typeof PluginManagerModule>('../index')
const utils = jest.requireMock<typeof PluginUtils>('../utils')
const store = jest.requireMock<typeof CreateStoreModule>('views/create-store')
const mockDispatch = jest.mocked(store.dispatch)
const { reducer: pluginsReducer } =
  jest.requireActual<typeof PluginsReducerModule>('views/redux/plugins')

const mockedStage = jest.mocked(utils.stagePluginPackage)
const mockedUnload = jest.mocked(utils.unloadPlugin)
const mockedRead = jest.mocked(utils.readPlugin)
const mockedEnable = jest.mocked(utils.enablePlugin)
const mockedNotify = jest.mocked(utils.notifyFailed)

const makePlugin = (packageName: string, overrides: Partial<Plugin> = {}): Plugin => ({
  packageData: { name: packageName, version: '1.0.0' },
  packageName,
  name: packageName,
  id: packageName,
  author: 'test',
  link: 'https://example.test',
  description: '',
  pluginPath: path.join(mockPluginNodeModules, packageName),
  icon: 'fa/th-large',
  version: '1.0.0',
  latestVersion: '1.0.0',
  earliestCompatibleMain: '0.0.0',
  lastApiVer: '1.0.0',
  priority: 10000,
  enabled: true,
  isExtra: false,
  isInstalled: true,
  isUpdating: false,
  needRollback: false,
  isOutdated: false,
  displayIcon: null,
  displayName: packageName,
  timestamp: 1,
  isRead: true,
  ...overrides,
})

const createStaged = async (
  packageName: string,
  version = '1.0.0',
): Promise<Awaited<ReturnType<typeof utils.stagePluginPackage>>> => {
  const stagingRoot = path.join(mockPluginPath, '.staging')
  await fs.ensureDir(stagingRoot)
  const stagingDir = await fs.mkdtemp(path.join(stagingRoot, 'tmp-'))
  const pluginPath = path.join(stagingDir, 'node_modules', packageName)
  await fs.ensureDir(pluginPath)
  await fs.writeJson(path.join(pluginPath, 'package.json'), {
    name: packageName,
    version,
  })
  return {
    stagingDir,
    pluginPath,
    cleanup: () => fs.remove(stagingDir),
  }
}

const createInstalledDirectory = async (packageName: string, marker = 'old'): Promise<string> => {
  const dir = path.join(mockPluginNodeModules, packageName)
  await fs.ensureDir(dir)
  await fs.writeFile(path.join(dir, marker), 'old')
  return dir
}

const getStoredPlugin = (packageName: string): Plugin | undefined =>
  mockPluginStore.plugins.find((plugin) => plugin.packageName === packageName)

beforeEach(async () => {
  await fs.remove(mockTestRoot)
  await fs.ensureDir(mockPluginNodeModules)
  await fs.ensureDir(path.join(mockExtraPath, 'node_modules'))
  mockPluginStore.plugins = []
  mockDispatch.mockClear()
  mockDispatch.mockImplementation((action) => {
    mockPluginStore.plugins = pluginsReducer(mockPluginStore.plugins, action)
    return action
  })
  mockedStage.mockReset()
  mockedUnload.mockReset()
  mockedRead.mockReset()
  mockedEnable.mockReset()
  mockedNotify.mockReset()
  mockedUnload.mockImplementation((plugin) => plugin)
  mockedEnable.mockImplementation(async (plugin) => plugin)
  mockedRead.mockImplementation(async (pluginPath: string) => {
    const baseName = path.basename(pluginPath)
    const parentName = path.basename(path.dirname(pluginPath))
    return makePlugin(parentName.startsWith('@') ? `${parentName}/${baseName}` : baseName, {
      isExtra: pluginPath.includes('plugins-extra'),
      pluginPath,
    })
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(async () => {
  await fs.remove(mockTestRoot)
})

describe('PluginManager isolated lifecycle', () => {
  it('unloads an existing plugin before replacing its directory', async () => {
    const existing = makePlugin('poi-plugin-a')
    mockPluginStore.plugins = [existing]
    const target = await createInstalledDirectory('poi-plugin-a')
    mockedStage.mockImplementation(async () => createStaged('poi-plugin-a', '2.0.0'))
    mockedUnload.mockImplementation((plugin) => {
      expect(fs.existsSync(path.join(target, 'old'))).toBe(true)
      return plugin
    })
    mockedRead.mockResolvedValue(makePlugin('poi-plugin-a', { version: '2.0.0' }))

    const manager = new PluginManager()
    await manager.installPlugin('poi-plugin-a')

    expect(mockedUnload).toHaveBeenCalledTimes(1)
    expect(await fs.pathExists(path.join(target, 'old'))).toBe(false)
    expect(await fs.pathExists(path.join(target, 'package.json'))).toBe(true)
    expect(getStoredPlugin('poi-plugin-a')).toMatchObject({
      packageName: 'poi-plugin-a',
      version: '2.0.0',
      isUpdating: false,
    })
  })

  it('cleans up a failed staging install and leaves the running plugin intact', async () => {
    const existing = makePlugin('poi-plugin-a')
    mockPluginStore.plugins = [existing]
    const target = await createInstalledDirectory('poi-plugin-a')
    mockedStage.mockRejectedValue(new Error('npm failed with exit code 1.'))

    const manager = new PluginManager()
    await expect(manager.installPlugin('poi-plugin-a', '2.0.0')).rejects.toThrow(
      'npm failed with exit code 1.',
    )

    expect(mockedUnload).not.toHaveBeenCalled()
    expect(await fs.pathExists(path.join(target, 'old'))).toBe(true)
    expect(getStoredPlugin('poi-plugin-a')).toMatchObject({
      packageName: 'poi-plugin-a',
      version: '1.0.0',
      isUpdating: false,
    })
  })

  it('rejects invalid sources before npm runs', async () => {
    const manager = new PluginManager()
    await expect(manager.installPlugin('file:../poi-plugin-a')).rejects.toThrow(
      /Only npm registry packages/,
    )
    expect(mockedStage).not.toHaveBeenCalled()
  })

  it('removes a vanished plugin from Redux when replacement fails', async () => {
    const existing = makePlugin('poi-plugin-a')
    mockPluginStore.plugins = [existing]
    const target = await createInstalledDirectory('poi-plugin-a')
    mockedStage.mockImplementation(async () => createStaged('poi-plugin-a', '2.0.0'))
    jest.spyOn(utils, 'safePhysicallyRemove').mockImplementation(async () => {
      await fs.remove(target)
      throw new Error('delete failed')
    })

    const manager = new PluginManager()
    await expect(manager.installPlugin('poi-plugin-a')).rejects.toThrow('delete failed')

    expect(await fs.pathExists(target)).toBe(false)
    expect(getStoredPlugin('poi-plugin-a')).toBeUndefined()
  })

  it('keeps a leftover directory represented as broken when replacement fails', async () => {
    const existing = makePlugin('poi-plugin-a')
    mockPluginStore.plugins = [existing]
    const target = await createInstalledDirectory('poi-plugin-a')
    mockedStage.mockImplementation(async () => createStaged('poi-plugin-a', '2.0.0'))
    jest.spyOn(utils, 'safePhysicallyRemove').mockRejectedValue(new Error('file is locked'))

    const manager = new PluginManager()
    await expect(manager.installPlugin('poi-plugin-a')).rejects.toThrow('file is locked')

    expect(await fs.pathExists(path.join(target, 'old'))).toBe(true)
    expect(getStoredPlugin('poi-plugin-a')).toMatchObject({
      packageName: 'poi-plugin-a',
      enabled: false,
      isBroken: true,
      isUpdating: false,
    })
  })

  it('reports an installed plugin that fails to load as broken, not enabled', async () => {
    mockedStage.mockImplementation(async () => createStaged('poi-plugin-a', '1.0.0'))
    mockedRead.mockResolvedValue(makePlugin('poi-plugin-a', { enabled: true }))
    mockedEnable.mockResolvedValue(
      makePlugin('poi-plugin-a', {
        enabled: false,
        isBroken: true,
        loadError: 'import exploded',
      }),
    )

    const manager = new PluginManager()
    await expect(manager.installPlugin('poi-plugin-a')).rejects.toThrow(
      /failed to load: import exploded/,
    )

    expect(getStoredPlugin('poi-plugin-a')).toMatchObject({
      packageName: 'poi-plugin-a',
      enabled: false,
      isBroken: true,
      isUpdating: false,
    })
  })

  it('uninstalls only the target plugin directory and preserves legacy dependencies', async () => {
    const plugin = makePlugin('poi-plugin-a')
    mockPluginStore.plugins = [plugin]
    const target = await createInstalledDirectory('poi-plugin-a')
    const legacy = path.join(mockPluginNodeModules, 'legacy-shared')
    await fs.ensureDir(legacy)

    const manager = new PluginManager()
    await manager.uninstallPlugin(plugin)

    expect(await fs.pathExists(target)).toBe(false)
    expect(await fs.pathExists(legacy)).toBe(true)
    expect(getStoredPlugin('poi-plugin-a')).toBeUndefined()
  })

  it('keeps a failed uninstall on disk as broken and retryable', async () => {
    const plugin = makePlugin('poi-plugin-a')
    mockPluginStore.plugins = [plugin]
    const target = await createInstalledDirectory('poi-plugin-a')
    jest.spyOn(utils, 'safePhysicallyRemove').mockRejectedValue(new Error('file is locked'))

    const manager = new PluginManager()
    await expect(manager.uninstallPlugin(plugin)).rejects.toThrow('file is locked')

    expect(await fs.pathExists(target)).toBe(true)
    expect(getStoredPlugin('poi-plugin-a')).toMatchObject({
      packageName: 'poi-plugin-a',
      enabled: false,
      isBroken: true,
      isUninstalling: false,
    })
  })

  it('repair-all unloads first, clears the directory, and continues after a failure', async () => {
    const pluginA = makePlugin('poi-plugin-a')
    const pluginB = makePlugin('poi-plugin-b')
    const pluginC = makePlugin('poi-plugin-c')
    const linkedPlugin = makePlugin('poi-plugin-linked', { linkedPlugin: true })
    const extraPlugin = makePlugin('poi-plugin-extra', { isExtra: true })
    mockPluginStore.plugins = [pluginA, pluginB, pluginC, linkedPlugin, extraPlugin]

    const dirs = new Map<string, string>()
    for (const plugin of [pluginA, pluginB, pluginC, linkedPlugin]) {
      dirs.set(plugin.packageName, await createInstalledDirectory(plugin.packageName))
    }
    const extraDir = path.join(mockExtraPath, 'node_modules', 'poi-plugin-extra')
    await fs.ensureDir(extraDir)
    await fs.writeFile(path.join(mockExtraPath, 'package.json'), '{}')

    mockedUnload.mockImplementation((plugin) => {
      expect(fs.existsSync(path.join(mockPluginNodeModules, plugin.packageName))).toBe(true)
      return plugin
    })
    mockedStage.mockImplementation(async (packageName: string) => {
      if (packageName === 'poi-plugin-b') throw new Error('install b failed')
      return createStaged(packageName)
    })

    const manager = new PluginManager()
    const result = await manager.gracefulRepair()

    expect(mockedUnload.mock.calls.map(([plugin]) => plugin.packageName)).toEqual([
      'poi-plugin-a',
      'poi-plugin-b',
      'poi-plugin-c',
      'poi-plugin-linked',
    ])
    expect(mockedStage.mock.calls.map(([packageName]) => packageName)).toEqual([
      'poi-plugin-a',
      'poi-plugin-b',
      'poi-plugin-c',
    ])
    expect(result.succeeded).toEqual(['poi-plugin-a', 'poi-plugin-c'])
    expect(result.failed).toEqual([{ packageName: 'poi-plugin-b', error: 'install b failed' }])
    expect(await fs.pathExists(path.join(mockPluginNodeModules, 'poi-plugin-a'))).toBe(true)
    expect(await fs.pathExists(path.join(mockPluginNodeModules, 'poi-plugin-b'))).toBe(false)
    expect(await fs.pathExists(path.join(mockPluginNodeModules, 'poi-plugin-c'))).toBe(true)
    expect(await fs.pathExists(extraDir)).toBe(true)
    expect(await fs.pathExists(path.join(mockPluginPath, 'package.json'))).toBe(false)
  })

  it('does not let a failed operation poison the queue', async () => {
    mockedStage.mockRejectedValue(new Error('npm failed'))
    const manager = new PluginManager()

    await expect(manager.installPlugin('poi-plugin-a')).rejects.toThrow('npm failed')

    const extraPlugin = makePlugin('poi-plugin-extra', { isExtra: true })
    mockPluginStore.plugins = [extraPlugin]
    const extraDir = path.join(mockExtraPath, 'node_modules', 'poi-plugin-extra')
    await fs.ensureDir(extraDir)

    await expect(manager.uninstallPlugin(extraPlugin)).resolves.toBeUndefined()
    expect(await fs.pathExists(extraDir)).toBe(false)
  })

  it('reports startup load failures from the post-enable plugin state', async () => {
    await fs.ensureDir(path.join(mockPluginNodeModules, 'poi-plugin-broken'))
    mockedEnable.mockResolvedValue(
      makePlugin('poi-plugin-broken', {
        enabled: false,
        isBroken: true,
        loadError: 'startup import failed',
      }),
    )

    const manager = new PluginManager()
    await manager.readPlugins()

    expect(mockedNotify).toHaveBeenCalledTimes(1)
    const notified = mockedNotify.mock.calls[0][0]
    expect(notified).toHaveLength(1)
    expect(notified[0]).toMatchObject({
      packageName: 'poi-plugin-broken',
      enabled: false,
      isBroken: true,
      loadError: 'startup import failed',
    })
  })

  it('discovers scoped and unscoped plugins under both plugin roots', async () => {
    await fs.ensureDir(path.join(mockPluginNodeModules, 'poi-plugin-unscoped'))
    await fs.ensureDir(path.join(mockPluginNodeModules, '@scope', 'poi-plugin-scoped'))
    await fs.ensureDir(path.join(mockExtraPath, 'node_modules', 'poi-plugin-extra'))

    const manager = new PluginManager()
    const plugins = await manager.readPlugins()

    expect(plugins.map((plugin) => plugin.packageName).sort()).toEqual([
      '@scope/poi-plugin-scoped',
      'poi-plugin-extra',
      'poi-plugin-unscoped',
    ])
    expect(mockedRead).toHaveBeenCalledWith(
      path.join(mockPluginNodeModules, '@scope', 'poi-plugin-scoped'),
      false,
    )
  })
})
