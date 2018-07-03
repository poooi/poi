
/**
 * @overview
 * @author Matthew Caruana Galizia <m@m.cg>
 * @license MIT
 * @copyright Copyright (c) 2013, Matthew Caruana Galizia
 * @preserve
 */

/**
 * modernized based on https://github.com/mattcg/socks5-http-client
 */

import http from 'http'
import socksClient from 'socks5-client'

class Agent extends http.Agent {
  createConnection = socksClient.createConnection
}

export default Agent
