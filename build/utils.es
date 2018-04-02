import fs from 'fs-extra'
import path from 'path-extra'
import unzip from 'node-unzip-2'
import { log } from '../lib/utils'
import _request from 'request'
import { promisify } from 'bluebird'
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

const requestAsync = promisify(_request, { multiArgs: true })

const getFlashUrl = (platform) =>
  `https://github.com/dkwingsmt/PepperFlashFork/releases/download/latest/${platform}.zip`

const download = async (url, destDir, filename = path.basename(url), description) => {
  log(`Downloading ${description} from ${url}`)
  await fs.ensureDir(destDir)
  const destPath = path.join(destDir, filename)
  try {
    await fs.access(destPath, fs.R_OK)
    log(`Use existing ${destPath}`)
  } catch (e) {
    const [response, body] = await requestAsync({
      url: url,
      encoding: null,
    })
    if (response.statusCode != 200) {
      throw new Error(`Response status code ${response.statusCode}`)
    }
    await fs.writeFile(destPath, body)
    log(`Successfully downloaded to ${destPath}`)
  }
  return destPath
}

const extractZipNode = (zipFile, destPath, descript="") => {
  log(`Extract ${descript}`)
  return new Promise((resolve) => {
    fs.ensureDirSync(path.dirname(destPath))
    fs.createReadStream(zipFile)
      .pipe(unzip.Extract({ path: destPath }))
      .on('close', () => {
        log(`Extracting ${descript} finished`)
        return resolve()
      })
  })
}

const extractZipCli = (zipFile, destPath, descript="") => {
  log(`Extract ${descript}`)
  fs.ensureDirSync(destPath)
  return new Promise ((resolve, reject) => {
    const command = `unzip '${zipFile}'`
    child_process.exec(command, {
      cwd: destPath,
    },
    (error) => {
      if (error != null) {
        return reject(error)
      } else {
        log(`Extracting ${descript} finished`)
        return resolve()
      }
    }
    )
  })
}


const extractZip = process.platform == 'win32'
  ? extractZipNode
  : extractZipCli

const downloadExtractZip = async (url, downloadDir, filename, destPath,
  description, useCli) => {
  const MAX_RETRY = 5
  let zipPath
  for (let retryCount = 1; retryCount <= MAX_RETRY; retryCount++){
    try {
      zipPath = await download(url, downloadDir, filename, description)
      await extractZip(zipPath, destPath, description)
    } catch (e) {
      log(`Downloading failed, retrying ${url}, reason: ${e}`)
      try {
        await fs.remove(zipPath)
      } catch (e) {
        console.error(e.stack)
      }
      if (retryCount === MAX_RETRY) {
        throw e
      }
      continue
    }
    break
  }
}

export const installFlash = async (platform, downloadDir, flashDir) => {
  const flash_url = getFlashUrl(platform)
  return downloadExtractZip(flash_url, downloadDir, `flash-${platform}.zip`, flashDir, 'flash plugin')
}

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


export const npmInstall = async (tgtDir, args=[]) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgtDir}`)
  await fs.ensureDir(tgtDir)
  await runScript(NPM_EXEC_PATH, ['ci', '--registry', NPM_SERVER].concat(args),{
    cwd: tgtDir,
  })
  log(`Finished installing npm for ${tgtDir}`)
}
