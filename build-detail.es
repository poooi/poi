import path from 'path-extra'
import Promise, { promisify } from 'bluebird'
import fs from 'fs-extra'
import n7z from 'node-7z'
import semver from 'semver'
import walk from 'walk'
import tar from 'tar-fs'
import child_process from 'child_process'
import unzip from 'node-unzip-2'
import glob from 'glob'
import gitArchive from 'git-archive'
import { log } from './lib/utils'
import _request from 'request'
import { transformFile } from 'babel-core'
import _rimraf from 'rimraf'
import BabelConfig from './babel.config'

const requestAsync = promisify(_request, { multiArgs: true })
const rimraf = promisify(_rimraf)
//const DONT_PACK_APP_IF_EXISTS = false

// *** CONSTANTS ***
const BUILD_DIR_NAME = 'build'
const DOWNLOADDIR_NAME = 'download'
//const REALEASE_DIR_NAME = 'release'
const PLATFORM_TO_PATHS = {
  'win32-ia32': 'win-ia32',
  'win32-x64': 'win-x64',
  'darwin-x64': 'mac-x64',
  'linux-x64': 'linux-x64',
}
const config = (() => {
  // global.* variables are assigned to adapt for requiring 'config'

  return require('./lib/config')
})()

// let USE_TAOBAO_MIRROR = config.get('buildscript.useTaobaoMirror', true)
// if (process.env.TRAVIS) {
//   USE_TAOBAO_MIRROR = false
// }
const NPM_EXEC_PATH = path.join(__dirname, 'node_modules', 'npm', 'bin', 'npm-cli.js')

const PLUGIN_JSON_PATH = path.join(global.ROOT, 'assets', 'data', 'plugin.json')
const MIRROR_JSON_PATH = path.join(global.ROOT, 'assets', 'data', 'mirror.json')

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

const getFlashUrl = (platform) =>
  `https://github.com/dkwingsmt/PepperFlashFork/releases/download/latest/${platform}.zip`

const TARGET_LIST = [
  // Files
  'app.js',
  'index.html',
  'index.js',
  'LICENSE',
  'package.json',
  'babel.config.js',
  'package-lock.json',
  // Folders
  'assets',
  'lib',
  'views',
  'node_modules',
  'i18n',
]

// *** TOOLS & COMMON METHODS ***
const downloadAsync = async (url, destDir, filename = path.basename(url), description) => {
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

const extractZipNodeAsync = (zipFile, destPath, descript="") => {
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

const extractZipCliAsync = (zipFile, destPath, descript="") => {
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

const extractZipAsync =
  process.platform == 'win32'
    ? extractZipNodeAsync
    : extractZipCliAsync

const downloadExtractZipAsync = async (url, downloadDir, filename, destPath,
  description, useCli) => {
  const MAX_RETRY = 5
  let zipPath
  for (let retryCount = 1; retryCount <= MAX_RETRY; retryCount++){
    try {
      zipPath = await downloadAsync(url, downloadDir, filename, description)
      await extractZipAsync(zipPath, destPath, description)
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

const installFlashAsync = async (platform, downloadDir, flashDir) => {
  const flash_url = getFlashUrl(platform)
  await downloadExtractZipAsync(flash_url, downloadDir, `flash-${platform}.zip`, flashDir, 'flash plugin')
}

const compress7zAsync = async (files, archive, options) => {
  try {
    await fs.remove(archive)
  } catch (e) {
    console.error(e.stack)
  }
  await (new n7z()).add(archive, files, options)
}

const changeExt = (srcPath, ext) => {
  const srcDir = path.dirname(srcPath)
  const srcBasename = path.basename(srcPath, path.extname(srcPath))
  return path.join(srcDir, srcBasename + ext)
}

const gitArchiveAsync = async (tarPath, tgtDir) => {
  log('Archive file from git..')
  try{
    await fs.remove(tarPath)
  } catch (e) {
    console.error(e.stack)
  }
  try {
    await promisify(gitArchive)({
      commit: 'HEAD',
      outputPath: tarPath,
      repoPath: __dirname,
    })
  } catch (e) {
    log(e)
    log("Error on git archive! Probably you haven't installed git or it does not exist in your PATH.")
    process.exit(1)
  }
  log('Archive complete! Extracting...')
  await new Promise((resolve) => {
    fs.createReadStream(tarPath)
      .pipe(tar.extract(tgtDir))
      .on('finish', (e) => {
        log ('Extract complete!')
        resolve(e)
      })
      .on('error', (err) => {
        log(err)
        resolve()
      }
      )})
}

// Run js script
const runScriptAsync = (scriptPath, args, options) =>
  new Promise ((resolve) => {
    const proc = child_process.fork(scriptPath, args, options)
    proc.on('exit', () => resolve())
  })

// Run js script, but suppress stdout and stores it into a string used to resolve
const runScriptReturnStdoutAsync = (scriptPath, args, options) =>
  new Promise ((resolve) => {
    const proc = child_process.fork(scriptPath, args, Object.assign({silent: true}, options))
    let data = ''
    let chunk
    proc.stdout.on('readable', () => {
      while ((chunk = proc.stdout.read()) != null) {
        data += chunk
      }
    })
    proc.on('exit', () => resolve(data))
  })

const npmInstallAsync = async (tgtDir, args=[]) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgtDir}`)
  await fs.ensureDir(tgtDir)
  await runScriptAsync(NPM_EXEC_PATH, ['install', '--registry', NPM_SERVER].concat(args),{
    cwd: tgtDir,
  })
  log(`Finished installing npm for ${tgtDir}`)
}

// *** METHODS ***
const filterCopyAppAsync = async (stage1App, stage2App) =>
  Promise.all((() => {
    const jobs = []
    for (const target of TARGET_LIST) {
      jobs.push(fs.copy(path.join(stage1App, target), path.join(stage2App, target), {
        overwrite: true,
      }))
    }
    return jobs
  })())

export const compileToJsAsync = (appDir, dontRemove) => {
  log(`Compiling ${appDir}`)
  const targetExts = ['.es']

  const options = {
    followLinks: false,
    filters: ['node_modules', 'assets', path.join(__dirname, 'components')],
  }

  const { presets, plugins } = BabelConfig

  return new Promise ((resolve) => {
    const tasks = []
    walk.walk(appDir, options)
      .on('file', (root, fileStats, next) => {
        const extname = path.extname(fileStats.name).toLowerCase()
        if (targetExts.includes(extname)) {
          tasks.push(async () => {
            const srcPath = path.join(root, fileStats.name)
            const tgtPath = changeExt(srcPath, '.js')
            // const src = await fs.readFile(srcPath, 'utf-8')
            let tgt
            try {
              const result = await promisify(transformFile)(srcPath, {
                presets: presets.map(p => require.resolve(`babel-preset-${p}`)),
                plugins: plugins.map(p => require.resolve(`babel-plugin-${p}`)),
              })
              tgt = result.code
            } catch (e) {
              log(`Compiling ${srcPath} failed: ${e}`)
              return
            }
            await fs.writeFile(tgtPath, tgt)
            if (!dontRemove) {
              await fs.remove(srcPath)
            }
            log(`Compiled ${tgtPath}`)
          })
        }
        next()
      })
      .on('end', async () => {
        log(`Files to compile: ${tasks.length} files`)
        resolve(await Promise.all(tasks.map(f => f())))
      })
  })
}

const checkNpmVersion = async () => {
  // Check npm version
  const npmVersion = (await runScriptReturnStdoutAsync(NPM_EXEC_PATH, ['--version'])).trim()
  log(`You are using npm v${npmVersion}`)
  if (semver.major(npmVersion) == 2) {
    log("*** USING npm 2 TO BUILD poi IS PROHIBITED ***")
    log("Aborted.")
    return false
  } else {
    return true
  }
}



const installPluginsTo = async (pluginNames, installRoot, tarRoot) => {
  try{
    await fs.remove(installRoot)
    await fs.remove(tarRoot)
  } catch (e) {
    console.error(e.stack)
  }
  await fs.ensureDir(installRoot)
  await fs.ensureDir(tarRoot)

  // Install plugins
  await npmInstallAsync(installRoot, ['--global-style', '--only=production', '--prefix', '.'].concat(pluginNames))

  const pluginDirs = (() =>{
    const dirs = []
    for (const name of pluginNames) {
      const dir = path.join(installRoot, 'node_modules', name)

      // Modify package.json
      const packageJsonPath = path.join(dir, 'package.json')
      const contents = fs.readJsonSync(packageJsonPath)
      // Delete this key, otherwise npm install won't succeed
      delete contents._requiredBy
      delete contents.scripts
      contents.bundledDependencies = Object.keys(contents.dependencies || {})
      fs.writeJsonSync(packageJsonPath, contents)
      dirs.push(dir)
    }
    return dirs
  })()

  log("Now packing plugins into tarballs.")
  await runScriptAsync(NPM_EXEC_PATH, ['pack'].concat(pluginDirs), {
    cwd: tarRoot,
  })
}

export const installPluginsAsync = async (poiVersion) => {
  const BUILD_ROOT = path.join(__dirname, 'dist')
  const BUILDING_ROOT = path.join(BUILD_ROOT, "plugins")
  const RELEASE_DIR = BUILD_ROOT

  const packages = await fs.readJson(PLUGIN_JSON_PATH)

  const pluginNames = Object.keys(packages)

  const installRoot = path.join(BUILDING_ROOT, 'poi-plugins_install')
  const gzip_root = path.join(BUILDING_ROOT, 'poi-plugins')
  await installPluginsTo(pluginNames, installRoot, gzip_root)

  const d = new Date()
  const str_date = `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`
  const archive_path = path.join(RELEASE_DIR, `poi-plugins_${str_date}.7z`)
  await compress7zAsync (gzip_root, archive_path)

  log(`Successfully built tarballs at ${archive_path}`)
}

// Build poi for use
export const buildAsync = async (poiVersion, dontRemove) => {
  if (!checkNpmVersion()) {
    return
  }

  // const BUILD_ROOT = path.join(__dirname, BUILD_DIR_NAME)
  // const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME)
  const BUILDING_ROOT = path.join(__dirname, 'app_compiled')
  const stage1App = path.join(BUILDING_ROOT, 'stage1')
  const tarPath = path.join(stage1App, "app_stage1.tar")
  const stage2App = BUILDING_ROOT

  // Clean files
  try {
    if (!dontRemove) {
      await fs.remove(BUILDING_ROOT)
    }
  } catch (e) {
    console.error(e.stack)
  }
  try {
    await fs.remove(stage1App)
  } catch (e) {
    console.error(e.stack)
  }
  await fs.ensureDir(stage1App)
  await fs.ensureDir(stage2App)
  await fs.ensureDir(path.join(stage1App, 'node_modules'))

  // Stage1: Everything downloaded and translated
  await gitArchiveAsync(tarPath, stage1App)
  await compileToJsAsync(stage1App, false)
  log('stage 1 finished')

  // Stage2: Filtered copy
  await filterCopyAppAsync(stage1App, stage2App)
  if (!dontRemove){
    await npmInstallAsync(stage2App, ['--only=production'])
    await runScriptAsync(NPM_EXEC_PATH, ['dedupe'], {
      cwd: path.join(stage2App, 'node_modules', 'npm'),
    })
  }
  log('stage 2 finished')

  // Clean files

  await fs.remove(stage1App)
  log('file cleaned')

  // Rewrite package.json for build
  const packagePath = path.join(stage2App, 'package.json')
  const packageData = await fs.readJson(packagePath)
  delete packageData.build
  delete packageData.devDependencies
  await fs.remove(packagePath)
  await fs.outputJson(packagePath, packageData)
  log ("Done.")
}

export const compileAsync = async () =>
  await compileToJsAsync(__dirname, true)

// Install flash
export const getFlashAsync = async (poiVersion) => {
  const BUILD_ROOT = path.join(__dirname, BUILD_DIR_NAME)
  const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME)
  const platform = `${process.platform}-${process.arch}`
  await fs.remove(path.join(__dirname, 'PepperFlash'))
  const flashDir = path.join(__dirname, 'PepperFlash', PLATFORM_TO_PATHS[platform])
  await installFlashAsync(platform, downloadDir, flashDir)
}

export const getFlashAllAsync = async (poiVersion) => {
  const BUILD_ROOT = path.join(__dirname, BUILD_DIR_NAME)
  const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME)
  const platforms = ['win32-ia32', 'win32-x64', 'darwin-x64', 'linux-x64']
  await fs.remove(path.join (__dirname, 'PepperFlash'))
  const tasks = platforms.map(platform => {
    const flashDir = path.join(__dirname, 'PepperFlash', PLATFORM_TO_PATHS[platform])
    return installFlashAsync(platform, downloadDir, flashDir)
  })
  await Promise.all(tasks)
}

export const cleanFiles = () => {
  glob.sync(path.join(__dirname, "build", "!(*.es)")).forEach(file =>
    rimraf(file, () => {}))
  rimraf(path.join(__dirname, 'app_compiled'), () => {})
  rimraf(path.join(__dirname, 'dist'), () => {})
}

export const packWinReleaseAsync = async (poiVersion) => {
  let target = path.join(__dirname, 'dist', 'win-unpacked')
  let dest = path.join(__dirname, 'dist', 'win', `poi-${poiVersion}-win-x64.7z`)
  await compress7zAsync(target, dest)
  target = path.join(__dirname, 'dist', 'win-ia32-unpacked')
  dest = path.join(__dirname, 'dist', 'win-ia32', `poi-${poiVersion}-win-ia32.7z`)
  await compress7zAsync(target, dest)
  log("Release packed up")
}
