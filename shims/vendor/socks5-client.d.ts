declare module 'socks5-client' {
  import net from 'net'
  interface ConnectionOptions {
    socksHost: string
    socksPort: string | number
    host: string
    port: string | number
  }
  export const createConnection: (options: ConnectionOptions) => net.Socket
}
