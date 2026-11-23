export interface HttpProxyConfig {
  host?: string
  port?: number
  requirePassword?: boolean
  username?: string
  password?: string
}

/**
 * Builds the proxy URL passed to npm through its environment. Credentials are
 * encoded individually so `@`, `:`, `/` and friends cannot change the URL
 * structure.
 */
export function buildHttpProxyUrl(config: HttpProxyConfig): string {
  const host = config.host || '127.0.0.1'
  const port = config.port ?? 8118
  const username = config.username ?? ''
  const password = config.password ?? ''
  const auth =
    config.requirePassword && (username !== '' || password !== '')
      ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
      : ''
  return `http://${auth}${host}:${port}`
}

/** npm reads the same value for both http and https traffic. */
export function proxyEnvironment(proxy?: string): Record<string, string> {
  if (!proxy) return {}
  return {
    npm_config_proxy: proxy,
    npm_config_https_proxy: proxy,
  }
}
