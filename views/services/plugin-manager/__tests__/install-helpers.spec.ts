import path from 'path'

import { normalizeInstallSpec, validateInstallInput } from '../package-spec'
import { resolvePluginUpdate } from '../version'

describe('install spec handling', () => {
  it('keeps scoped names whole and appends an explicit version', () => {
    expect(normalizeInstallSpec('poi-plugin-a', '1.2.0')).toEqual({
      spec: 'poi-plugin-a@1.2.0',
      packageName: 'poi-plugin-a',
    })
    expect(normalizeInstallSpec('@scope/poi-plugin-a', '1.2.0')).toEqual({
      spec: '@scope/poi-plugin-a@1.2.0',
      packageName: '@scope/poi-plugin-a',
    })
  })

  it('extracts the package name from registry tags and ranges', () => {
    expect(normalizeInstallSpec('poi-plugin-a@next')).toEqual({
      spec: 'poi-plugin-a@next',
      packageName: 'poi-plugin-a',
    })
    expect(normalizeInstallSpec('@scope/poi-plugin-a@^2.0.0')).toEqual({
      spec: '@scope/poi-plugin-a@^2.0.0',
      packageName: '@scope/poi-plugin-a',
    })
  })

  it('resolves local tarball paths to absolute paths', () => {
    expect(normalizeInstallSpec('./offline-plugin.tgz')).toEqual({
      spec: path.resolve('./offline-plugin.tgz'),
    })
    const relative = `.${path.sep}${path.join('somewhere', 'offline-plugin.tgz')}`
    expect(normalizeInstallSpec(relative)).toEqual({ spec: path.resolve(relative) })
    expect(() => normalizeInstallSpec('offline-plugin.tgz')).toThrow(
      'Local tarball paths must be absolute or start with ./ or ../',
    )
  })

  it('accepts supported install input only', () => {
    expect(validateInstallInput('poi-plugin-a')).toBe(true)
    expect(validateInstallInput('@scope/poi-plugin-a')).toBe(true)
    expect(validateInstallInput('poi-plugin-a@1.2.3')).toBe(true)
    expect(validateInstallInput('poi-plugin-a@^1.2.0')).toBe(true)
    expect(validateInstallInput('poi-plugin-a@beta')).toBe(true)
    expect(validateInstallInput('./offline-plugin.tgz')).toBe(true)
    expect(validateInstallInput('file:./offline-plugin.tgz')).toBe(true)

    expect(validateInstallInput('')).toBe(false)
    expect(validateInstallInput('not-a-plugin')).toBe(false)
    expect(validateInstallInput('@scope/other-package')).toBe(false)
    expect(validateInstallInput('alias@npm:poi-plugin-a')).toBe(false)
    expect(validateInstallInput('git+https://example.com/poi-plugin-a.git')).toBe(false)
    expect(validateInstallInput('https://example.com/poi-plugin-a.tgz')).toBe(false)
    expect(validateInstallInput('offline-plugin.tgz')).toBe(false)
    expect(validateInstallInput('./some-directory')).toBe(false)
  })
})

describe('plugin update resolution', () => {
  const current = '1.0.0'
  const poi = '12.0.1'

  it('uses the newer latest dist-tag', () => {
    expect(resolvePluginUpdate(current, poi, { version: '1.2.0' }, undefined, false)).toEqual({
      latestVersion: '1.2.0',
      outdated: true,
      notCompatible: false,
    })
  })

  it('uses beta only when enabled and newer', () => {
    expect(
      resolvePluginUpdate(current, poi, { version: '1.1.0' }, { version: '1.3.0' }, true),
    ).toEqual({ latestVersion: '1.3.0', outdated: true, notCompatible: false })
    expect(
      resolvePluginUpdate(current, poi, { version: '1.1.0' }, { version: '1.3.0' }, false),
    ).toEqual({ latestVersion: '1.1.0', outdated: true, notCompatible: false })
  })

  it('honors the remote apiVer compatibility range', () => {
    expect(
      resolvePluginUpdate(
        '1.5.0',
        poi,
        { version: '2.0.0', poiPlugin: { apiVer: { 'v13.0.0': '1.4.0' } } },
        undefined,
        false,
      ),
    ).toEqual({ latestVersion: '1.4.0', outdated: false, notCompatible: true })
  })

  it('falls back to the local apiVer map', () => {
    expect(
      resolvePluginUpdate('1.0.0', poi, { version: '1.2.0' }, undefined, false, {
        'v13.0.0': '1.1.0',
      }),
    ).toEqual({ latestVersion: '1.1.0', outdated: true, notCompatible: true })
  })

  it('falls back when the remote apiVer map is empty', () => {
    expect(
      resolvePluginUpdate(
        '1.0.0',
        poi,
        { version: '1.2.0', poiPlugin: { apiVer: {} } },
        undefined,
        false,
        { 'v13.0.0': '1.1.0' },
      ),
    ).toEqual({ latestVersion: '1.1.0', outdated: true, notCompatible: true })
  })

  it('ignores malformed remote versions', () => {
    expect(resolvePluginUpdate(current, poi, { version: {} }, undefined, false)).toEqual({
      latestVersion: current,
      outdated: false,
      notCompatible: false,
    })
  })
})
