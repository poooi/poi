import fs from 'fs-extra'
import path from 'path-extra'
import { log } from '../lib/utils'
import child_process from 'child_process'
import n7z from 'node-7z'

const { ROOT } = global
export const NPM_EXEC_PATH = path.join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
export const PLUGIN_JSON_PATH = path.join(ROOT, 'assets', 'data', 'plugin.json')

export const compress7z = async (files, archive, options) => {
  try {
    await fs.remove(archive)
  } catch (e) {
    console.error(e.stack)
  }
  await new n7z().add(archive, files, options)
}

// Run js script
export const runScript = (scriptPath, args, options) =>
  new Promise(resolve => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
  })

export const npmInstall = async (tgtDir, args = [], ci = true) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgtDir}`)
  await fs.ensureDir(tgtDir)
  await runScript(NPM_EXEC_PATH, [ci ? 'ci' : 'i'].concat(process.argv.slice(3)).concat(args), {
    cwd: tgtDir,
  })
  log(`Finished installing npm for ${tgtDir}`)
}
