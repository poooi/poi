import fs from 'fs-extra'
import path from 'path-extra'
import { log } from '../lib/utils'
import child_process from 'child_process'
import n7z from 'node-7z'

const { ROOT } = global
export const NPM_EXEC_PATH = path.join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
export const MIRROR_JSON_PATH = path.join(ROOT, 'assets', 'data', 'mirror.json')
export const PLUGIN_JSON_PATH = path.join(ROOT, 'assets', 'data', 'plugin.json')

const config = (() => {
  // global.* variables are assigned to adapt for requiring 'config'

  return require('../lib/config')
})()

const NPM_SERVER = (() => {
  const mirrors = fs.readJsonSync(MIRROR_JSON_PATH)
  // Don't want to mess with detecting system language here without window.navigator
  const language = config.get('poi.language', 'zh-CN')
  const primaryServer = language === 'zh-CN' ? 'taobao' : 'npm'
  let server = config.get("packageManager.mirrorName", primaryServer)
  if (process.env.TRAVIS || process.env.APPVEYOR) {
    server = 'npm'
  }
  return mirrors[server].server
})()

log(`Using npm mirror ${NPM_SERVER}`)

export const compress7z = async (files, archive, options) => {
  try {
    await fs.remove(archive)
  } catch (e) {
    console.error(e.stack)
  }
  await (new n7z()).add(archive, files, options)
}

// Run js script
export const runScript = (scriptPath, args, options) => new Promise ((resolve) => {
  const proc = child_process.fork(scriptPath, args, options)
  proc.on('exit', () => resolve())
})


export const npmInstall = async (tgtDir, args=[], ci=true) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgtDir}`)
  await fs.ensureDir(tgtDir)
  await runScript(NPM_EXEC_PATH, [ci ? 'ci' : 'i', '--registry', NPM_SERVER].concat(args),{
    cwd: tgtDir,
  })
  log(`Finished installing npm for ${tgtDir}`)
}
