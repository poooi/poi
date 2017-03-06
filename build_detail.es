// *** INCLUDE ***
require('babel-register')(require('./babel.config'))
const os = require('os')
const path = require('path-extra')
const Promise = require('bluebird')
const {promisify} = Promise
const request = Promise.promisifyAll(require('request'))
const requestAsync = promisify(request, {multiArgs: true})
const fs = Promise.promisifyAll(require('fs-extra'))
const gulp = require('gulp')
const n7z = require('node-7z')
const semver = require('semver')
const babel = Promise.promisifyAll(require('babel-core'))
const {compile} = require('coffee-react')
const asar = require('asar')
const walk = require('walk')
const tar = require('tar-fs')
const child_process = require('child_process')
const unzip = require('node-unzip-2')
const glob = require('glob')
const rimraf = promisify(require('rimraf'))
const gitArchive = require('git-archive')

const {log} = require('./lib/utils')

const DONT_PACK_APP_IF_EXISTS = false
const USE_GITHUB_FLASH_MIRROR = false

// *** CONSTANTS ***
const build_dir_name = 'build'
const download_dir_name = 'download'
const release_dir_name = 'release'
const platform_to_paths = {
  'win32-ia32': 'win-ia32',
  'win32-x64': 'win-x64',
  'darwin-x64': 'mac-x64',
  'linux-x64': 'linux-x64',
}
const config = (() => {
  // global.* variables are assigned to adapt for requiring 'config'
  global.ROOT = __dirname
  const system_appdata_path = process.env.APPDATA || (
    process.platform == 'darwin'
    ? path.join(process.env.HOME, 'Library/Application Support')
    : '/var/local')
  global.APPDATA_PATH = path.join(system_appdata_path, 'poi')
  global.EXROOT = global.APPDATA_PATH
  return require('./lib/config')
})()

let use_taobao_mirror = config.get('buildscript.useTaobaoMirror', true)
if (process.env.TRAVIS) {
  use_taobao_mirror = false
}
const npm_exec_path = path.join(__dirname, 'node_modules', 'npm', 'bin', 'npm-cli.js')

const plugin_json_path = path.join(global.ROOT, 'assets', 'data', 'plugin.json')
const mirror_json_path = path.join(global.ROOT, 'assets', 'data', 'mirror.json')

// see if async IIFE works
const npm_server = (() => {
  const mirrors = fs.readJsonSync(mirror_json_path)
  // Don't want to mess with detecting system language here without window.navigator
  const language = config.get('poi.language', 'zh-CN')
  const primaryServer = language == 'zh-CN' ? 'taobao' : 'npm'
  let server = config.get("packageManager.mirrorName", primaryServer)
  if (process.env.TRAVIS) {
    server = 'npm'
  }
  return mirrors[server].server
})()

log(`Using npm mirror ${npm_server}`)

const theme_list = {
  darkly:     'https://bootswatch.com/darkly/bootstrap.css',
  flatly:     'https://bootswatch.com/flatly/bootstrap.css',
  lumen:      'https://bootswatch.com/lumen/bootstrap.css',
  paper:      'https://bootswatch.com/paper/bootstrap.css',
  slate:      'https://bootswatch.com/slate/bootstrap.css',
  superhero:  'https://bootswatch.com/superhero/bootstrap.css',
  united:     'https://bootswatch.com/united/bootstrap.css',
  lumendark:  'https://raw.githubusercontent.com/PHELiOX/poi-theme-lumendark/master/lumendark.css',
  paperdark:  'https://raw.githubusercontent.com/ruiii/poi_theme_paper_dark/master/paperdark.css',
  papercyan:  'https://raw.githubusercontent.com/govizlora/theme-papercyan/master/papercyan.css',
  paperblack: 'https://raw.githubusercontent.com/PHELiOX/paperblack/master/css/paperblack.css',
  darklykai:  'https://raw.githubusercontent.com/magicae/sleepy/master/dist/sleepy.css',
}

const get_flash_url = (platform) =>
  USE_GITHUB_FLASH_MIRROR
  ? `https://github.com/dkwingsmt/PepperFlashFork/releases/download/latest/${platform}.zip`
  : `http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/${platform}.zip`

const target_list = [
  // Files
  'app.js',
  'index.html', 'index.js', 'LICENSE', 'package.json', 'babel.config.js',
  // Folders
  'assets',
  'lib',
  'views',
  'node_modules',
  'i18n',
]

// *** TOOLS & COMMON METHODS ***
const downloadAsync = async (url, dest_dir, filename = path.basename(url), description) => {
  log(`Downloading ${description} from ${url}`)
  await fs.ensureDirAsync(dest_dir)
  const dest_path = path.join(dest_dir, filename)
  try {
    await fs.accessAsync(dest_path, fs.R_OK)
    log(`Use existing ${dest_path}`)
  }catch (e) {
    const [response, body] = await requestAsync({
      url: url,
      encoding: null,
    })
    if (response.statusCode != 200) {
      throw new Error(`Response status code ${response.statusCode}`)
    }
    await fs.writeFileAsync(dest_path, body)
    log(`Successfully downloaded to ${dest_path}`)
  }
  return dest_path
}

const extractZipNodeAsync = (zip_file, dest_path, descript="") => {
  log(`Extract ${descript}`)
  return new Promise((resolve) => {
    fs.ensureDirSync(path.dirname(dest_path))
    fs.createReadStream(zip_file)
    .pipe(unzip.Extract({ path: dest_path }))
    .on('close', () => {
      log(`Extracting ${descript} finished`)
      return resolve()
    })
  })
}

const extractZipCliAsync = (zip_file, dest_path, descript="") => {
  log(`Extract ${descript}`)
  fs.ensureDirSync(dest_path)
  return new Promise ((resolve, reject) => {
    const command = `unzip '${zip_file}'`
    child_process.exec(command, {
      cwd: dest_path,
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

const downloadExtractZipAsync = async (url, download_dir, filename, dest_path,
                                 description, useCli) => {
  const max_retry = 5
  let zip_path
  for (let retry_count = 1; retry_count <= max_retry; retry_count++){
    try {
      zip_path = await downloadAsync(url, download_dir, filename, description)
      await extractZipAsync(zip_path, dest_path, description)
    } catch (e) {
      log(`Downloading failed, retrying ${url}, reason: ${e}`)
      try {
        await fs.removeAsync(zip_path)
      } catch (e) {
        console.log(e.stack)
      }
      if (retry_count === max_retry) {
        throw e
      }
      continue
    }
    break
  }
}

const downloadThemesAsync = (theme_root) =>
  Promise.all((() => {
    const jobs = []
    for (const theme of Object.keys(theme_list)){
      const theme_url = theme_list[theme]
      const download_dir = path.join(theme_root, theme, 'css')
      jobs.push(downloadAsync(theme_url, download_dir,`${theme}.css`, `${theme} theme`))
    }
    return jobs
  })())

const installFlashAsync = async (platform, download_dir, flash_dir) => {
  const flash_url = get_flash_url(platform)
  await downloadExtractZipAsync(flash_url, download_dir, `flash-${platform}.zip`, flash_dir, 'flash plugin')
}

const compress7zAsync = async (files, archive, options) => {
  try {
    await fs.removeAsync(archive)
  } catch (e) {
    console.log(e.stack)
  }
  await (new n7z()).add(archive, files, options)
}

const changeExt = (src_path, ext) => {
  const src_dir = path.dirname(src_path)
  const src_basename = path.basename(src_path, path.extname(src_path))
  return path.join(src_dir, src_basename + ext)
}

const gitArchiveAsync = async (tar_path, tgt_dir) => {
  log('Archive file from git..')
  try{
    await fs.removeAsync(tar_path)
  } catch (e) {
    console.log(e.stack)
  }
  try {
    await promisify(gitArchive)({
      commit: 'HEAD',
      outputPath: tar_path,
      repoPath: __dirname,
    })
  } catch (e) {
    log(e)
    log("Error on git archive! Probably you haven't installed git or it does not exist in your PATH.")
    process.exit(1)
  }
  log('Archive complete! Extracting...')
  await new Promise((resolve) => {
    fs.createReadStream(tar_path)
    .pipe(tar.extract(tgt_dir))
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
const runScriptAsync = (script_path, args, options) =>
  new Promise ((resolve) => {
    const proc = child_process.fork(script_path, args, options)
    proc.on('exit', () => resolve())
  })

// Run js script, but suppress stdout and stores it into a string used to resolve
const runScriptReturnStdoutAsync = (script_path, args, options) =>
  new Promise ((resolve) => {
    const proc = child_process.fork(script_path, args, Object.assign({silent: true}, options))
    let data = ''
    let chunk
    proc.stdout.on('readable', () => {
      while ((chunk = proc.stdout.read()) != null) {
        data += chunk
      }
    })
    proc.on('exit', () => resolve(data))
  })

const npmInstallAsync = async (tgt_dir, args=[]) => {
  // Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log(`Installing npm for ${tgt_dir}`)
  await fs.ensureDirAsync(tgt_dir)
  await runScriptAsync(npm_exec_path, ['install', '--registry', npm_server].concat(args),{
    cwd: tgt_dir,
  })
  log(`Finished installing npm for ${tgt_dir}`)
}

// *** METHODS ***
const filterCopyAppAsync = async (stage1_app, stage2_app) =>
  Promise.all((() => {
    const jobs = []
    for (const target of target_list) {
      jobs.push(fs.copyAsync(path.join(stage1_app, target), path.join(stage2_app, target), {
        clobber: true,
      }))
    }
    return jobs
  })())

const compileToJsAsync = (app_dir, dontRemove) => {
  log(`Compiling ${app_dir}`)
  const targetExts = ['.es']

  const options = {
    followLinks: false,
    filters: ['node_modules', 'assets', path.join(__dirname, 'components')],
  }

  const {presets, plugins} = require('./babel.config')

  return new Promise ((resolve) => {
    const tasks = []
    walk.walk(app_dir, options)
    .on('file', (root, fileStats, next) => {
      const extname = path.extname(fileStats.name).toLowerCase()
      if (targetExts.includes(extname)) {
        tasks.push(async () => {
          const src_path = path.join(root, fileStats.name)
          const tgt_path = changeExt(src_path, '.js')
          // const src = await fs.readFileAsync(src_path, 'utf-8')
          let tgt
          try {
            const result = await babel.transformFileAsync(src_path, {presets, plugins})
            tgt = result.code
          } catch (e) {
            log(`Compiling ${src_path} failed: ${e}`)
            return
          }
          await fs.writeFileAsync(tgt_path, tgt)
          if (!dontRemove) {
            await fs.removeAsync(src_path)
          }
          log(`Compiled ${tgt_path}`)
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
  const npm_version = (await runScriptReturnStdoutAsync(npm_exec_path, ['--version'])).trim()
  log(`You are using npm v${npm_version}`)
  if (semver.major(npm_version) == 2) {
    log("*** USING npm 2 TO BUILD poi IS PROHIBITED ***")
    log("Aborted.")
    return false
  } else {
    return true
  }
}



const installPluginsTo = async (plugin_names, install_root, tarball_root) => {
  try{
    await fs.removeAsync(install_root)
    await fs.removeAsync(tarball_root)
  } catch (e) {
    console.log(e.stack)
  }
  await fs.ensureDirAsync(install_root)
  await fs.ensureDirAsync(tarball_root)

  // Install plugins
  await npmInstallAsync(install_root, ['--production', '--prefix', '.'].concat(plugin_names))

  const plugins_dir = (() =>{
    const dirs = []
    for (const name of plugin_names) {
      const plugin_dir = path.join(install_root, 'node_modules', name)

      // Modify package.json
      const plugin_package_json = path.join(plugin_dir, 'package.json')
      const contents = require(plugin_package_json)
      // Delete this key, otherwise npm install won't succeed
      delete contents._requiredBy
      contents.bundledDependencies = Object.keys(contents.dependencies)
      fs.writeFileSync(plugin_package_json, JSON.stringify(contents))
      dirs.push(plugin_dir)
    }
    return dirs})()

  await Promise.all(plugins_dir.map(dir =>
    npmInstallAsync(dir, ['--no-bin-links', '--no-progress', '--production'])))

  log("Now packing plugins into tarballs.")
  await runScriptAsync(npm_exec_path, ['pack'].concat(plugins_dir), {
    cwd: tarball_root,
  })
}

export const installPluginsAsync = async (poi_version) => {
  const build_root = path.join(__dirname, 'dist')
  const building_root = path.join(build_root, "plugins")
  const release_dir = build_root

  const packages = await fs.readJsonAsync(plugin_json_path)

  const plugin_names = Object.keys(packages)

  const install_root = path.join(building_root, 'poi-plugins_install')
  const gzip_root = path.join(building_root, 'poi-plugins')
  await installPluginsTo(plugin_names, install_root, gzip_root)

  const d = new Date()
  const str_date = `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`
  const archive_path = path.join(release_dir, `poi-plugins_${str_date}.7z`)
  await compress7zAsync (gzip_root, archive_path)

  log(`Successfully built tarballs at ${archive_path}`)
}

// Build poi for use
export const buildAsync = async (poi_version, dontRemove) => {
  if (!checkNpmVersion()) {
    return
  }

  const build_root = path.join(__dirname, build_dir_name)
  const download_dir = path.join(build_root, download_dir_name)
  const building_root = path.join(__dirname, 'app_compiled')
  const stage1_app = path.join(building_root, 'stage1')
  const tar_path = path.join(stage1_app, "app_stage1.tar")
  const stage2_app = building_root
  const theme_root = path.join(stage1_app, 'assets', 'themes')

  // Clean files
  try {
    if (!dontRemove) {
      await fs.removeAsync(building_root)
    }
  } catch (e) {
    console.log(e.stack)
  }
  try {
    await fs.removeAsync(stage1_app)
  } catch (e) {
    console.log(e.stack)
  }
  await fs.ensureDirAsync(stage1_app)
  await fs.ensureDirAsync(stage2_app)
  await fs.ensureDirAsync(path.join(stage1_app, 'node_modules'))

  // Stage1: Everything downloaded and translated
  await gitArchiveAsync(tar_path, stage1_app)
  await downloadThemesAsync(theme_root)
  await compileToJsAsync(stage1_app, false)
  log('stage 1 finished')

  // Stage2: Filtered copy
  await filterCopyAppAsync(stage1_app, stage2_app)
  if (!dontRemove){
    await npmInstallAsync(stage2_app, ['--production'])
  }
  log('stage 2 finished')

  // Clean files

  await fs.removeAsync(stage1_app)
  log('file cleaned')

  // Rewrite package.json for build
  const packagePath = path.join(stage2_app, 'package.json')
  const packageData = await fs.readJsonAsync(packagePath)
  delete packageData.build
  delete packageData.devDependencies
  await fs.removeAsync(packagePath)
  await fs.writeJsonAsync(packagePath, packageData)
  log ("Done.")
}

export const compileAsync = async () =>
  await compileToJsAsync(__dirname, true)

// Install flash
export const getFlashAsync = async (poi_version) => {
  const build_root = path.join(__dirname, build_dir_name)
  const download_dir = path.join(build_root, download_dir_name)
  const platform = `${process.platform}-${process.arch}`
  await fs.removeAsync(path.join(__dirname, 'PepperFlash'))
  const flash_dir = path.join(__dirname, 'PepperFlash', platform_to_paths[platform])
  await installFlashAsync(platform, download_dir, flash_dir)
}

export const getFlashAllAsync = async (poi_version) => {
  const build_root = path.join(__dirname, build_dir_name)
  const download_dir = path.join(build_root, download_dir_name)
  const platforms = ['win32-ia32', 'win32-x64', 'darwin-x64', 'linux-x64']
  await fs.removeAsync(path.join (__dirname, 'PepperFlash'))
  const tasks = platforms.map(platform => {
    const flash_dir = path.join(__dirname, 'PepperFlash', platform_to_paths[platform])
    return installFlashAsync(platform, download_dir, flash_dir)
  })
  await Promise.all(tasks)
}

export const cleanFiles = () => {
  glob.sync(path.join(__dirname, "build", "!(icon)*")).forEach(file =>
    rimraf(file, () => {}))
  rimraf(path.join(__dirname, 'app_compiled'), () => {})
  rimraf(path.join(__dirname, 'dist'), () => {})
}

export const installThemeAsync = async () => {
  const theme_root = path.join(__dirname, 'assets', 'themes')
  await downloadThemesAsync(theme_root)
}

export const packWinReleaseAsync = async (poi_version) => {
  let target = path.join(__dirname, 'dist', 'win-unpacked')
  let dest = path.join(__dirname, 'dist', 'win', `poi-${poi_version}-win-x64.7z`)
  await compress7zAsync(target, dest)
  target = path.join(__dirname, 'dist', 'win-ia32-unpacked')
  dest = path.join(__dirname, 'dist', 'win-ia32', `poi-${poi_version}-win-ia32.7z`)
  await compress7zAsync(target, dest)
  log("Release packed up")
}
