import Promise from 'bluebird'

const request = Promise.promisifyAll(require('request'))
const requestAsync = Promise.promisify(request, {multiArgs: true})

const {POI_VERSION} = global
const {error} = require('./utils')


export const checkUpdate = async () => {
  try {
    const [response, body] = await requestAsync(`http://${global.SERVER_HOSTNAME}/update/latest.json`, {
      method: 'GET',
      json: true,
      headers:{
        'User-Agent': `poi v${POI_VERSION}`,
      },
    })
    if (response.statusCode == 200){
      return body
    } else {
      return 'error'
    }
  } catch (e) {
    error(e.stack)
    return 'error'
  }
}
