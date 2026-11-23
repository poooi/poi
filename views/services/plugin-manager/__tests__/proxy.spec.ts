import { buildHttpProxyUrl, proxyEnvironment } from '../proxy'

describe('http proxy configuration', () => {
  it('encodes credentials that contain url delimiters', () => {
    expect(
      buildHttpProxyUrl({
        host: 'proxy.example',
        port: 8080,
        requirePassword: true,
        username: 'dummy@user:/',
        password: 'dummy:pass@/',
      }),
    ).toBe('http://dummy%40user%3A%2F:dummy%3Apass%40%2F@proxy.example:8080')
  })

  it('handles a user or a password alone', () => {
    expect(
      buildHttpProxyUrl({
        host: 'proxy.example',
        port: 8080,
        requirePassword: true,
        username: 'dummy@user',
        password: '',
      }),
    ).toBe('http://dummy%40user:@proxy.example:8080')
    expect(
      buildHttpProxyUrl({
        host: 'proxy.example',
        port: 8080,
        requirePassword: true,
        username: '',
        password: 'dummy@pass',
      }),
    ).toBe('http://:dummy%40pass@proxy.example:8080')
  })

  it('omits credentials unless password auth is enabled', () => {
    expect(
      buildHttpProxyUrl({
        host: 'proxy.example',
        port: 8080,
        requirePassword: false,
        username: 'dummy',
        password: 'dummy',
      }),
    ).toBe('http://proxy.example:8080')
  })

  it('maps the proxy to npm environment keys', () => {
    const proxy = 'http://dummy:dummy@proxy.example:8080'
    expect(proxyEnvironment(proxy)).toEqual({
      npm_config_proxy: proxy,
      npm_config_https_proxy: proxy,
    })
    expect(proxyEnvironment(undefined)).toEqual({})
  })
})
