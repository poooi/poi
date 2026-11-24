import path from 'path'
import { dispatch, getStore } from 'views/create-store'

import type { Plugin } from '../types'

import { closePluginWindows, enablePlugin, unloadPlugin } from '../lifecycle'
import { removeExtraPackage } from '../npm-utils'
import { readPlugin } from '../read-plugin'

interface RepairResultLike {
  packageName: string
  status: 'repaired' | 'skipped' | 'failed'
}

interface ManagerLike {
  gracefulRepair(repair?: boolean): Promise<RepairResultLike[]>
  installPlugin(source: string, version?: string, registry?: string): Promise<void>
  uninstallPlugin(plugin: Plugin): Promise<void>
}

interface MockInstaller {
  activatePluginInstall: jest.Mock
  inspectPluginInstall: jest.Mock
  preparePluginInstall: jest.Mock
  removePluginDirectory: jest.Mock
  viewPackage: jest.Mock
}

jest.mock('@electron/remote', () => {
  const service = {
    activatePluginInstall: jest.fn(),
    inspectPluginInstall: jest.fn(async () => ({
      packageName: 'poi-plugin-x',
      installSource: 'registry',
    })),
    preparePluginInstall: jest.fn(),
    removePluginDirectory: jest.fn(),
    viewPackage: jest.fn(),
  }
  return {
    __esModule: true,
    __service: service,
    getCurrentWebContents: () => ({ once: jest.fn() }),
    require: () => service,
  }
})

jest.mock('fs-extra', () => ({
  existsSync: jest.fn(),
  readJsonSync: jest.fn(() => ({})),
}))

jest.mock('glob', () => ({ glob: jest.fn(async () => []) }))

jest.mock('views/create-store', () => ({
  dispatch: jest.fn(),
  getStore: jest.fn(),
}))

jest.mock('views/env', () => ({
  config: { get: jest.fn((_path: string, fallback?: unknown) => fallback) },
  PLUGIN_EXTRA_PATH: '/appdata/plugins-extra',
  PLUGIN_PATH: '/appdata/plugins',
  ROOT: '/poi',
}))

jest.mock('views/env-parts/i18next', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}))

jest.mock('../lifecycle', () => ({
  closePluginWindows: jest.fn(async () => undefined),
  disablePlugin: jest.fn(),
  enablePlugin: jest.fn(),
  notifyFailed: jest.fn(),
  unloadPlugin: jest.fn(),
}))

jest.mock('../npm-utils', () => ({
  getNpmConfig: jest.fn(() => ({
    registry: 'https://registry.example/',
    prefix: '/appdata/plugins',
    enableBetaPluginCheck: false,
  })),
  removeExtraPackage: jest.fn(),
}))

jest.mock('../read-plugin', () => ({
  readPlugin: jest.fn(),
}))

const { __service: installer } = jest.requireMock<{ __service: MockInstaller }>('@electron/remote')
const defaultPluginsPath = path.join('/appdata', 'plugins', 'node_modules')
const extraPluginsPath = path.join('/appdata', 'plugins-extra', 'node_modules')

const mockStore: { plugins: Plugin[] } = { plugins: [] }

function makePlugin(overrides: Partial<Plugin>): Plugin {
  return {
    packageData: {},
    packageName: 'poi-plugin-x',
    name: 'Plugin X',
    id: 'plugin-x',
    author: 'author',
    link: 'https://example.com',
    description: 'description',
    pluginPath: path.join(defaultPluginsPath, 'poi-plugin-x'),
    icon: 'fa/th-large',
    version: '1.0.0',
    latestVersion: '1.0.0',
    earliestCompatibleMain: '0.0.0',
    lastApiVer: '1.0.0',
    priority: 10_000,
    enabled: true,
    isExtra: false,
    isInstalled: true,
    isUpdating: false,
    needRollback: false,
    isOutdated: false,
    displayIcon: null,
    displayName: null,
    timestamp: 0,
    isRead: true,
    ...overrides,
  }
}

function dispatchPayloads(type: string): unknown[] {
  return jest
    .mocked(dispatch)
    .mock.calls.map(([action]) => action)
    .filter((action) => isRecord(action))
    .filter((action) => action['type'] === type)
    .map((action) => action['payload'])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function loadManager(): ManagerLike {
  return jest.requireActual<{ default: ManagerLike }>('../index').default
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(globalThis, {
    window: { isSafeMode: false, toast: jest.fn() },
  })
  mockStore.plugins = []
  jest
    .mocked(getStore)
    .mockImplementation((key?: string) => (key === 'plugins' ? mockStore.plugins : undefined))
  jest.mocked(closePluginWindows).mockResolvedValue(undefined)
  jest.mocked(unloadPlugin).mockImplementation((plugin) => plugin)
  jest.mocked(enablePlugin).mockImplementation(async (plugin) => ({
    ...plugin,
    isRead: true,
    enabled: true,
  }))
  jest.mocked(removeExtraPackage).mockResolvedValue({ removed: true, linked: false })
  jest.mocked(installer.preparePluginInstall).mockReset()
  jest.mocked(installer.activatePluginInstall).mockReset()
  jest.mocked(installer.inspectPluginInstall).mockResolvedValue({
    packageName: 'poi-plugin-x',
    installSource: 'registry',
  })
  window.toast = jest.fn()
})

describe('plugin manager install paths', () => {
  it('installs an offered update from the registry that supplied it', async () => {
    const registry = 'https://mirror.example/'
    jest.mocked(installer.preparePluginInstall).mockRejectedValue(new Error('offline'))
    await expect(loadManager().installPlugin('poi-plugin-a', '2.0.0', registry)).rejects.toThrow(
      'offline',
    )
    expect(installer.preparePluginInstall).toHaveBeenCalledWith(
      expect.objectContaining({ spec: 'poi-plugin-a@2.0.0', registry }),
    )
  })

  it('drops stale UI when activation removed the old plugin, then retries normally', async () => {
    const previous = makePlugin({
      packageName: 'poi-plugin-a',
      pluginPath: path.join(defaultPluginsPath, 'poi-plugin-a'),
      version: '1.0.0',
    })
    mockStore.plugins = [previous]
    jest.mocked(installer.preparePluginInstall).mockResolvedValue({
      operationId: 'a'.repeat(24),
      packageName: 'poi-plugin-a',
      version: '2.0.0',
      candidatePath: '/candidate',
      operationPath: '/operation',
    })
    jest.mocked(installer.activatePluginInstall).mockRejectedValue(new Error('rename failed'))
    const { existsSync } = jest.requireMock<{ existsSync: jest.Mock }>('fs-extra')
    existsSync.mockReturnValue(false)

    const pluginManager = loadManager()
    await expect(pluginManager.installPlugin('poi-plugin-a', '2.0.0')).rejects.toThrow(
      'rename failed',
    )

    expect(unloadPlugin).toHaveBeenCalledWith(previous)
    expect(
      dispatchPayloads('@@Plugin/remove').some(
        (payload) => isRecord(payload) && payload['packageName'] === 'poi-plugin-a',
      ),
    ).toBe(true)
    expect(enablePlugin).not.toHaveBeenCalled()

    jest.mocked(installer.preparePluginInstall).mockResolvedValue({
      operationId: 'b'.repeat(24),
      packageName: 'poi-plugin-a',
      version: '2.0.0',
      candidatePath: '/candidate',
      operationPath: '/operation',
    })
    jest.mocked(installer.activatePluginInstall).mockResolvedValue({
      operationId: 'b'.repeat(24),
      packageName: 'poi-plugin-a',
      version: '2.0.0',
      path: previous.pluginPath,
    })
    jest.mocked(readPlugin).mockResolvedValue(
      makePlugin({
        packageName: 'poi-plugin-a',
        pluginPath: previous.pluginPath,
        version: '2.0.0',
      }),
    )

    await pluginManager.installPlugin('poi-plugin-a', '2.0.0')
    expect(
      dispatchPayloads('@@Plugin/add').some(
        (payload) =>
          isRecord(payload) &&
          payload['packageName'] === 'poi-plugin-a' &&
          payload['version'] === '2.0.0',
      ),
    ).toBe(true)
  })

  it('reports the unload before replacement, then restores the surviving instance after failure', async () => {
    const previous = makePlugin({ enabled: true })
    const inactive = { ...previous, enabled: false, isRead: false, isUpdating: true }
    mockStore.plugins = [previous]
    jest
      .mocked(installer.preparePluginInstall)
      .mockResolvedValue({ packageName: previous.packageName, operationId: 'a'.repeat(24) })
    jest.mocked(closePluginWindows).mockImplementation(async () => {
      expect(unloadPlugin).toHaveBeenCalledWith(previous)
      expect(dispatchPayloads('@@Plugin/add')).toEqual([inactive])
    })
    jest.mocked(installer.activatePluginInstall).mockImplementation(async () => {
      expect(closePluginWindows).toHaveBeenCalledWith(previous)
      throw new Error('target is protected')
    })
    jest.requireMock<{ existsSync: jest.Mock }>('fs-extra').existsSync.mockReturnValue(true)
    jest.mocked(readPlugin).mockResolvedValue(previous)
    await expect(loadManager().installPlugin(previous.packageName)).rejects.toThrow(
      'target is protected',
    )
    expect(dispatchPayloads('@@Plugin/remove')).toEqual([])
    expect(enablePlugin).toHaveBeenCalledWith(
      expect.objectContaining({ packageName: previous.packageName }),
      false,
    )
    expect(dispatchPayloads('@@Plugin/add').at(-1)).toMatchObject({ enabled: true, isRead: true })
    expect(dispatchPayloads('@@Plugin/changeStatus').at(-1)).toEqual({
      packageName: previous.packageName,
      option: [{ path: 'isUpdating', status: false }],
    })
  })

  it('keeps an extra shadow selected when a normal install shares its id', async () => {
    const extra = makePlugin({
      id: 'shared-id',
      packageName: '@scope/poi-plugin-extra',
      pluginPath: path.join(extraPluginsPath, '@scope', 'poi-plugin-extra'),
      isExtra: true,
    })
    mockStore.plugins = [extra]
    jest.mocked(installer.preparePluginInstall).mockResolvedValue({
      operationId: 'b'.repeat(24),
      packageName: 'poi-plugin-normal',
      version: '1.0.0',
      candidatePath: '/candidate',
      operationPath: '/operation',
    })
    jest.mocked(installer.activatePluginInstall).mockResolvedValue({
      operationId: 'b'.repeat(24),
      packageName: 'poi-plugin-normal',
      version: '1.0.0',
      path: path.join(defaultPluginsPath, 'poi-plugin-normal'),
    })
    jest.mocked(readPlugin).mockResolvedValue(
      makePlugin({
        id: 'shared-id',
        packageName: 'poi-plugin-normal',
        pluginPath: path.join(defaultPluginsPath, 'poi-plugin-normal'),
      }),
    )

    const pluginManager = loadManager()
    await pluginManager.installPlugin('poi-plugin-normal')

    expect(unloadPlugin).not.toHaveBeenCalled()
    expect(enablePlugin).not.toHaveBeenCalled()
    expect(
      dispatchPayloads('@@Plugin/add').some(
        (payload) => isRecord(payload) && payload['packageName'] === 'poi-plugin-normal',
      ),
    ).toBe(false)
  })

  it('skips repair targets before any prepare or unload', async () => {
    const extra = makePlugin({
      packageName: 'poi-plugin-extra',
      pluginPath: path.join(extraPluginsPath, 'poi-plugin-extra'),
      isExtra: true,
    })
    const linked = makePlugin({
      packageName: 'poi-plugin-linked',
      pluginPath: path.join(defaultPluginsPath, 'poi-plugin-linked'),
      linkedPlugin: true,
    })
    const unknown = makePlugin({
      packageName: 'poi-plugin-unknown',
      pluginPath: path.join(defaultPluginsPath, 'poi-plugin-unknown'),
      installSource: 'unknown',
    })
    mockStore.plugins = [extra, linked, unknown]
    jest.mocked(installer.inspectPluginInstall).mockImplementation(async (name: string) => ({
      packageName: name,
      installSource: 'unknown',
    }))
    const { existsSync } = jest.requireMock<{ existsSync: jest.Mock }>('fs-extra')
    existsSync.mockImplementation((target: string) => !target.endsWith('.git'))

    const pluginManager = loadManager()
    const results = await pluginManager.gracefulRepair()

    expect(results.map((result) => [result.packageName, result.status])).toEqual([
      ['poi-plugin-extra', 'skipped'],
      ['poi-plugin-linked', 'skipped'],
      ['poi-plugin-unknown', 'skipped'],
    ])
    expect(unloadPlugin).not.toHaveBeenCalled()
    expect(installer.preparePluginInstall).not.toHaveBeenCalled()
  })

  it('records a corrupt repair target as failed and keeps repairing', async () => {
    const corrupt = makePlugin({
      packageName: 'poi-plugin-corrupt',
      pluginPath: path.join(defaultPluginsPath, 'poi-plugin-corrupt'),
    })
    const good = makePlugin({
      packageName: 'poi-plugin-good',
      pluginPath: path.join(defaultPluginsPath, 'poi-plugin-good'),
    })
    mockStore.plugins = [corrupt, good]
    jest.mocked(installer.inspectPluginInstall).mockImplementation(async (name: string) => {
      if (name === 'poi-plugin-corrupt') throw new Error('invalid package.json')
      return {
        packageName: name,
        installSource: 'registry',
        spec: `${name}@1.0.0`,
      }
    })
    jest.mocked(installer.preparePluginInstall).mockResolvedValue({
      operationId: 'c'.repeat(24),
      packageName: 'poi-plugin-good',
      version: '1.0.0',
      candidatePath: '/candidate',
      operationPath: '/operation',
    })
    jest.mocked(installer.activatePluginInstall).mockResolvedValue({
      operationId: 'c'.repeat(24),
      packageName: 'poi-plugin-good',
      version: '1.0.0',
      path: path.join(defaultPluginsPath, 'poi-plugin-good'),
    })
    jest.mocked(readPlugin).mockResolvedValue(good)
    const { existsSync } = jest.requireMock<{ existsSync: jest.Mock }>('fs-extra')
    existsSync.mockImplementation((target: string) => !target.endsWith('.git'))

    const pluginManager = loadManager()
    const results = await pluginManager.gracefulRepair()

    expect(results.map((result) => [result.packageName, result.status])).toEqual([
      ['poi-plugin-corrupt', 'failed'],
      ['poi-plugin-good', 'repaired'],
    ])
    expect(installer.preparePluginInstall).toHaveBeenCalledTimes(1)
    expect(installer.preparePluginInstall).toHaveBeenCalledWith(
      expect.objectContaining({ spec: 'poi-plugin-good@1.0.0' }),
    )
  })

  it.each([true, false])(
    'clears a missing directory from the store (extra=%s)',
    async (isExtra) => {
      const plugin = makePlugin({ isExtra })
      jest
        .mocked(removeExtraPackage)
        .mockResolvedValue({ removed: false, missing: true, linked: false })
      installer.removePluginDirectory.mockResolvedValue({ removed: false })
      await loadManager().uninstallPlugin(plugin)
      expect(dispatchPayloads('@@Plugin/remove')).toEqual([plugin])
      expect(enablePlugin).not.toHaveBeenCalled()
    },
  )

  it('reveals the normal install after removing an extra override', async () => {
    const extra = makePlugin({
      packageName: 'poi-plugin-x',
      pluginPath: path.join(extraPluginsPath, 'poi-plugin-x'),
      isExtra: true,
    })
    const normal = makePlugin({
      packageName: 'poi-plugin-normal',
      pluginPath: path.join(defaultPluginsPath, 'poi-plugin-normal'),
      isRead: false,
    })
    mockStore.plugins = [extra]
    jest
      .mocked(dispatch)
      .mockImplementationOnce((action) => action)
      .mockImplementationOnce((action) => {
        mockStore.plugins = []
        return action
      })
    jest
      .requireMock<{ glob: jest.Mock }>('glob')
      .glob.mockResolvedValueOnce([normal.pluginPath])
      .mockResolvedValueOnce([])
    jest.mocked(readPlugin).mockResolvedValue(normal)
    const { existsSync } = jest.requireMock<{ existsSync: jest.Mock }>('fs-extra')
    existsSync.mockReturnValue(true)

    const pluginManager = loadManager()
    await pluginManager.uninstallPlugin(extra)

    expect(removeExtraPackage).toHaveBeenCalledWith(path.join(extraPluginsPath, 'poi-plugin-x'))
    expect(readPlugin).toHaveBeenCalledWith(
      path.join(defaultPluginsPath, 'poi-plugin-normal'),
      false,
    )
    expect(enablePlugin).toHaveBeenCalledWith(
      expect.objectContaining({ packageName: 'poi-plugin-normal', isExtra: false }),
    )
    expect(
      dispatchPayloads('@@Plugin/add').some(
        (payload) => isRecord(payload) && payload['packageName'] === 'poi-plugin-normal',
      ),
    ).toBe(true)
  })
})
