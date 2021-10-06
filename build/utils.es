import fs from 'fs-extra'
import path from 'path-extra'
import child_process from 'child_process'
import Seven from 'node-7z'
import sevenBin from '7zip-bin'
import { map } from 'lodash'

const pathTo7zip = sevenBin.path7za

const { ROOT } = global
export const NPM_EXEC_PATH = path.join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
export const PLUGIN_JSON_PATH = path.join(ROOT, 'assets', 'data', 'plugin.json')

export const compress7z = async (files, archive, options) => {
  options = {
    ...options,
    $bin: pathTo7zip,
  }
  try {
    await fs.remove(archive)
  } catch (e) {
    console.error(e.stack)
  }
  await Seven.add(archive, files, options)
}

// Run js script
export const runScript = (scriptPath, args, options) =>
  new Promise((resolve) => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
  })

const stringify = (str) => {
  if (typeof str === 'string') {
    return str
  }
  if (str.toString().startsWith('[object ')) {
    str = JSON.stringify(str)
  } else {
    str = str.toString()
  }
  return str
}

export function log(...str) {
  // eslint-disable-next-line no-console
  console.log('[INFO]', ...map(str, stringify))
}

export const npmInstall = async (tgtDir, args = [], ci = true) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgtDir}`)
  await fs.ensureDir(tgtDir)
  await runScript(NPM_EXEC_PATH, [ci ? 'ci' : 'i'].concat(process.argv.slice(3)).concat(args), {
    cwd: tgtDir,
  })
  log(`Finished installing npm for ${tgtDir}`)
}
