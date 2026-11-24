jest.mock('views/env', () => ({
  config: { get: jest.fn() },
  ROOT: process.cwd(),
}))

import { resolveRegistryPluginSpec } from '../npm-utils'

describe('resolveRegistryPluginSpec', () => {
  it('accepts unscoped registry plugins with an optional version', () => {
    expect(resolveRegistryPluginSpec('poi-plugin-foo')).toEqual({
      packageName: 'poi-plugin-foo',
      spec: 'poi-plugin-foo',
    })
    expect(resolveRegistryPluginSpec('poi-plugin-foo', '1.2.3')).toEqual({
      packageName: 'poi-plugin-foo',
      spec: 'poi-plugin-foo@1.2.3',
    })
    expect(resolveRegistryPluginSpec('poi-plugin-foo@^1.2.0')).toEqual({
      packageName: 'poi-plugin-foo',
      spec: 'poi-plugin-foo@^1.2.0',
    })
  })

  it('accepts scoped registry plugins', () => {
    expect(resolveRegistryPluginSpec('@scope/poi-plugin-bar@latest')).toEqual({
      packageName: '@scope/poi-plugin-bar',
      spec: '@scope/poi-plugin-bar@latest',
    })
    expect(resolveRegistryPluginSpec('@scope/poi-plugin-bar', '~2.0.0')).toEqual({
      packageName: '@scope/poi-plugin-bar',
      spec: '@scope/poi-plugin-bar@~2.0.0',
    })
  })

  it.each([
    'git+https://github.com/poooi/poi-plugin-foo.git',
    'https://example.com/poi-plugin-foo.tgz',
    'file:../poi-plugin-foo',
    '../poi-plugin-foo',
    'npm:poi-plugin-foo@1.0.0',
    'lodash',
  ])('rejects non-registry or non-plugin source %s', (source) => {
    expect(() => resolveRegistryPluginSpec(source)).toThrow()
  })

  it('does not let a version argument bypass registry-only validation', () => {
    expect(() => resolveRegistryPluginSpec('poi-plugin-foo@file:../foo', '1.0.0')).toThrow(
      /Only npm registry packages/,
    )
    expect(() => resolveRegistryPluginSpec('https://example.com/foo.tgz', '1.0.0')).toThrow()
  })
})
