jest.mock('views/env', () => ({
  config: { get: jest.fn() },
  ROOT: process.cwd(),
}))

import crypto from 'crypto'
import fs from 'fs-extra'
import http from 'http'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import * as tar from 'tar'

import type { NpmConfig } from '../types'

import { resolveRegistryPluginSpec, stagePluginPackage } from '../npm-utils'

interface TestPackage {
  name: string
  version: string
  dependencies?: Record<string, string>
}

interface TarballArtifact {
  buffer: Buffer
  shasum: string
  integrity: string
}

const packages: TestPackage[] = [
  { name: 'dep-shared', version: '1.0.0' },
  { name: 'dep-shared', version: '2.0.0' },
  { name: 'poi-plugin-a', version: '1.0.0', dependencies: { 'dep-shared': '1.0.0' } },
  { name: 'poi-plugin-a', version: '1.1.0', dependencies: { 'dep-shared': '1.0.0' } },
  { name: 'poi-plugin-b', version: '1.0.0', dependencies: { 'dep-shared': '2.0.0' } },
  {
    name: '@scope/poi-plugin-c',
    version: '1.0.0',
    dependencies: { 'dep-shared': '1.0.0' },
  },
]

const artifacts = new Map<string, TarballArtifact>()
const versionsByPackage = new Map<string, TestPackage[]>()
let server: http.Server
let registryUrl = ''
let workRoot = ''
let pluginRoot = ''
let npmConfig: NpmConfig

const packageKey = (name: string, version: string) => `${name}@${version}`

const startRegistry = async (): Promise<void> => {
  server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', registryUrl)

    if (requestUrl.pathname.startsWith('/-/tarballs/')) {
      const artifact = artifacts.get(
        decodeURIComponent(requestUrl.pathname.slice('/-/tarballs/'.length)),
      )
      if (!artifact) {
        response.statusCode = 404
        response.end('not found')
        return
      }
      response.setHeader('content-type', 'application/octet-stream')
      response.end(artifact.buffer)
      return
    }

    const name = decodeURIComponent(requestUrl.pathname.slice(1))
    const versions = versionsByPackage.get(name)
    if (!versions) {
      response.statusCode = 404
      response.end(JSON.stringify({ error: 'not found' }))
      return
    }

    const latest = versions[versions.length - 1]
    const packument = {
      name,
      'dist-tags': { latest: latest.version },
      versions: Object.fromEntries(
        versions.map((pkg) => {
          const artifact = artifacts.get(packageKey(pkg.name, pkg.version))
          if (!artifact) throw new Error(`missing artifact for ${pkg.name}@${pkg.version}`)
          return [
            pkg.version,
            {
              name,
              version: pkg.version,
              dependencies: pkg.dependencies ?? {},
              dist: {
                tarball: `${registryUrl}/-/tarballs/${encodeURIComponent(packageKey(pkg.name, pkg.version))}`,
                shasum: artifact.shasum,
                integrity: artifact.integrity,
              },
            },
          ]
        }),
      ),
    }
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(packument))
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('registry did not start')
  registryUrl = `http://127.0.0.1:${address.port}`
}

const buildTarball = async (pkg: TestPackage): Promise<void> => {
  const buildDir = path.join(workRoot, 'build', packageKey(pkg.name, pkg.version))
  const packageDir = path.join(buildDir, 'package')
  await fs.ensureDir(packageDir)
  await fs.writeJson(
    path.join(packageDir, 'package.json'),
    {
      name: pkg.name,
      version: pkg.version,
      main: 'index.js',
      ...(pkg.dependencies ? { dependencies: pkg.dependencies } : {}),
    },
    { spaces: 2 },
  )
  const moduleSource = pkg.dependencies
    ? `module.exports = { self: ${JSON.stringify(`${pkg.name}@${pkg.version}`)}, dependencyVersion: require('dep-shared').version }\n`
    : `module.exports = { self: ${JSON.stringify(`${pkg.name}@${pkg.version}`)}, version: ${JSON.stringify(pkg.version)} }\n`
  await fs.writeFile(path.join(packageDir, 'index.js'), moduleSource)

  const tarballPath = path.join(buildDir, 'package.tgz')
  await tar.c({ cwd: buildDir, file: tarballPath, gzip: true, portable: true }, ['package'])
  const buffer = await fs.readFile(tarballPath)
  artifacts.set(packageKey(pkg.name, pkg.version), {
    buffer,
    shasum: crypto.createHash('sha1').update(buffer).digest('hex'),
    integrity: `sha512-${crypto.createHash('sha512').update(buffer).digest('base64')}`,
  })
  const existing = versionsByPackage.get(pkg.name) ?? []
  existing.push(pkg)
  versionsByPackage.set(pkg.name, existing)
}

const installIntoRoot = async (packageName: string, spec: string): Promise<string> => {
  const staged = await stagePluginPackage(packageName, spec, npmConfig)
  try {
    const target = path.join(pluginRoot, 'node_modules', packageName)
    await fs.remove(target)
    await fs.ensureDir(path.dirname(target))
    await fs.move(staged.pluginPath, target)
    return target
  } finally {
    await staged.cleanup()
  }
}

const readVersion = async (packagePath: string): Promise<string> => {
  const data = await fs.readJson(path.join(packagePath, 'package.json'))
  if (typeof data !== 'object' || data === null || typeof data.version !== 'string') {
    throw new Error(`no version in ${packagePath}`)
  }
  return data.version
}

const nodeRequire = createRequire(__filename)

const loadedDependencyVersion = (pluginPath: string): string => {
  for (const cachedPath of Object.keys(nodeRequire.cache)) {
    if (cachedPath.startsWith(pluginRoot)) delete nodeRequire.cache[cachedPath]
  }
  const entryPath = path.join(pluginPath, 'index.js')
  const loaded: unknown = nodeRequire(entryPath)
  if (
    typeof loaded !== 'object' ||
    loaded === null ||
    !('dependencyVersion' in loaded) ||
    typeof loaded.dependencyVersion !== 'string'
  ) {
    throw new Error(`plugin ${pluginPath} did not load its dependency`)
  }
  return loaded.dependencyVersion
}

describe('isolated plugin installation with a local registry', () => {
  jest.setTimeout(180_000)

  beforeAll(async () => {
    workRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'poi-plugin-isolation-'))
    pluginRoot = path.join(workRoot, 'plugins')
    await fs.ensureDir(path.join(pluginRoot, 'node_modules'))
    npmConfig = {
      registry: '',
      prefix: pluginRoot,
      enableBetaPluginCheck: false,
    }
    await startRegistry()
    npmConfig.registry = registryUrl
    for (const pkg of packages) await buildTarball(pkg)
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await fs.remove(workRoot)
  })

  it('keeps differing dependency versions private to each plugin', async () => {
    const legacyDependency = path.join(pluginRoot, 'node_modules', 'legacy-shared')
    await fs.ensureDir(legacyDependency)
    await fs.writeJson(path.join(legacyDependency, 'package.json'), {
      name: 'legacy-shared',
      version: '9.9.9',
    })

    const pluginA = await installIntoRoot('poi-plugin-a', 'poi-plugin-a@1.0.0')
    expect(await readVersion(pluginA)).toBe('1.0.0')
    expect(await readVersion(path.join(pluginA, 'node_modules', 'dep-shared'))).toBe('1.0.0')
    expect(loadedDependencyVersion(pluginA)).toBe('1.0.0')
    expect(await fs.pathExists(path.join(pluginRoot, 'node_modules', 'dep-shared'))).toBe(false)

    const pluginB = await installIntoRoot('poi-plugin-b', 'poi-plugin-b@1.0.0')
    expect(await readVersion(path.join(pluginB, 'node_modules', 'dep-shared'))).toBe('2.0.0')
    expect(await readVersion(path.join(pluginA, 'node_modules', 'dep-shared'))).toBe('1.0.0')
    expect(loadedDependencyVersion(pluginA)).toBe('1.0.0')
    expect(loadedDependencyVersion(pluginB)).toBe('2.0.0')

    const scopedPlugin = await installIntoRoot('@scope/poi-plugin-c', '@scope/poi-plugin-c@1.0.0')
    expect(await readVersion(path.join(scopedPlugin, 'node_modules', 'dep-shared'))).toBe('1.0.0')

    // Updating A replaces only A's private tree.
    await fs.remove(pluginA)
    const updatedA = await installIntoRoot('poi-plugin-a', 'poi-plugin-a@1.1.0')
    expect(await readVersion(updatedA)).toBe('1.1.0')
    expect(await readVersion(path.join(updatedA, 'node_modules', 'dep-shared'))).toBe('1.0.0')
    expect(loadedDependencyVersion(updatedA)).toBe('1.0.0')
    expect(await readVersion(path.join(pluginB, 'node_modules', 'dep-shared'))).toBe('2.0.0')
    expect(loadedDependencyVersion(pluginB)).toBe('2.0.0')

    // Removing A leaves B and legacy shared dependencies untouched.
    await fs.remove(updatedA)
    expect(await fs.pathExists(pluginA)).toBe(false)
    expect(await readVersion(path.join(pluginB, 'node_modules', 'dep-shared'))).toBe('2.0.0')
    expect(loadedDependencyVersion(pluginB)).toBe('2.0.0')
    expect(await readVersion(legacyDependency)).toBe('9.9.9')
    expect(await fs.pathExists(path.join(pluginRoot, 'node_modules', 'dep-shared'))).toBe(false)
  })

  it('rejects non-registry specs before npm and propagates npm failures', async () => {
    expect(() => resolveRegistryPluginSpec('file:../poi-plugin-a')).toThrow()

    await expect(
      stagePluginPackage('poi-plugin-missing', 'poi-plugin-missing', npmConfig),
    ).rejects.toThrow(/npm failed with exit code/)

    const stagingRoot = path.join(pluginRoot, '.staging')
    expect(await fs.readdir(stagingRoot)).toEqual([])
  })
})
