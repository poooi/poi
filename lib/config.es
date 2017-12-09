import { set, get } from 'lodash'
import EventEmitter from 'events'
import CSON from 'cson'
import fs from 'fs-extra'
import path from 'path-extra'
import dbg from './debug'

const {ROOT, EXROOT} = global
const defaultConfigPath = path.join(ROOT, 'config.cson')
const configPath = path.join(EXROOT, 'config.cson')

class configClass extends EventEmitter {
  constructor () {
    super()
    this.configData = null
    try {
      fs.accessSync(configPath, fs.R_OK | fs.W_OK)
      this.configData = CSON.parseCSONFile(configPath)
      dbg.log(`Config loaded from: ${configPath}`)
    }
    catch (e) {
      dbg.log(e)
    }
    if (!this.configData) {
      try {
        fs.accessSync(defaultConfigPath, fs.R_OK)
        this.configData = CSON.parseCSONFile(defaultConfigPath) || {}
        dbg.log(`Config loaded from: ${defaultConfigPath}`)
      }
      catch (e) {
        this.configData = {}
        dbg.log(e)
      }
    }
    this.get = (path, value) => {
      if (path === '') {
        return this.configData
      }
      const ret = get(this.configData, path)
      if (ret !== undefined) {
        return ret
      } else {
        return value
      }
    }
    this.set = (path, value) => {
      if (get(this.configData, path) === value) {
        return
      }
      set(this.configData, path, value)
      this.emit('config.set', path, value)
      try {
        fs.writeFileSync(configPath, CSON.stringify(this.configData, null, 2))
      }
      catch (e) {
        console.warn(e)
      }
    }
    this.setDefault = (path, value) => {
      if (this.get(path) === undefined) {
        this.set(path, value)
      }
    }
  }
}

const config = new configClass()
config.setMaxListeners(100)

export default config
