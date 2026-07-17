import type { SevenZipOptions } from 'node-7z'

import { path7za } from '7zip-bin'
import child_process from 'child_process'
import fs from 'fs-extra'
import { map } from 'lodash'
import Seven from 'node-7z'
import path from 'path'

const { ROOT } = global
export const NPM_EXEC_PATH = path.join(ROOT, 'node_modules', 'npm', 'bin', 'npm-cli.js')
export const PLUGIN_JSON_PATH = path.join(ROOT, 'assets', 'data', 'plugin.json')

export const compress7z = async (
  files: string | string[],
  archive: string,
  options?: SevenZipOptions,
) => {
  options = {
    ...options,
    $bin: path7za,
  }
  try {
    await fs.remove(archive)
  } catch (e) {
    console.error(e instanceof Error ? e.stack : e)
  }
  await Seven.add(archive, files, options)
}

// Run js script
export const runScript = (scriptPath: string, args: string[], options: child_process.ForkOptions) =>
  new Promise<void>((resolve) => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
  })

const stringify = (str: unknown): string => {
  if (typeof str === 'string') {
    return str
  }
  const asString = String(str)
  return asString.startsWith('[object ') ? JSON.stringify(str) : asString
}

export function log(...str: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[INFO]', ...map(str, stringify))
}

export const npmInstall = async (tgtDir: string, args: string[] = [], ci = true) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgtDir}`)
  await fs.ensureDir(tgtDir)
  await runScript(NPM_EXEC_PATH, ['set-script', 'prepare', ''].concat(process.argv.slice(3)), {
    cwd: tgtDir,
  })
  await runScript(NPM_EXEC_PATH, [ci ? 'ci' : 'i'].concat(process.argv.slice(3)).concat(args), {
    cwd: tgtDir,
  })
  log(`Finished installing npm for ${tgtDir}`)
}
