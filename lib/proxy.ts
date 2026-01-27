import { app, session } from 'electron'

import config from './config'
import { log } from './utils'

const getProxyUri = () => {
  switch (config.get('proxy.use')) {
    // HTTP Request via SOCKS5 proxy
    case 'socks5': {
      const socksHost: string = config.get('proxy.socks5.host', '127.0.0.1')
      const socksPort: number = config.get('proxy.socks5.port', 1080)
      const uri = `${socksHost}:${socksPort}`
      return `socks://${uri},direct://`
    }
    // HTTP Request via HTTP proxy
    case 'http': {
      const host = config.get('proxy.http.host', '127.0.0.1')
      const port = config.get('proxy.http.port', 8118)
      const requirePassword = config.get('proxy.http.requirePassword', false)
      const username = config.get('proxy.http.username', '')
      const password = config.get('proxy.http.password', '')
      const useAuth = requirePassword && username !== '' && password !== ''
      const strAuth = `${username}:${password}@`
      return `http://${useAuth ? strAuth : ''}${host}:${port},direct://`
    }
    // PAC
    case 'pac': {
      return config.get('proxy.pacAddr')
    }
  }
  return 'direct://'
}

const BYPASS_RULES = '<local>;*.google-analytics.com;*.doubleclick.net'

const setProxyConfig = () => {
  const proxyUri = getProxyUri()
  if (config.get('proxy.use') === 'pac') {
    log(`Loading pac script: ${proxyUri}`)
    session.defaultSession.setProxy({
      pacScript: proxyUri,
      proxyBypassRules: BYPASS_RULES,
    })
  } else {
    log(`Loading proxy: ${proxyUri}`)
    session.defaultSession.setProxy({
      proxyRules: proxyUri,
      proxyBypassRules: BYPASS_RULES,
    })
  }
}

app.on('ready', () => {
  setProxyConfig()
})

config.on('config.set', (path: string) => {
  if (path.startsWith('proxy')) {
    setProxyConfig()
  }
})

// backward compatibility
export { default } from './game-api-broadcaster'
