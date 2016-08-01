# *** INCLUDE ***
require('babel-register')(require('./babel.config'));
os = require 'os'
path = require 'path-extra'
Promise = require 'bluebird'
{promisify} = Promise
request = Promise.promisifyAll require 'request'
requestAsync = promisify request, multiArgs: true
fs = Promise.promisifyAll require 'fs-extra'
gulp = require 'gulp'
async = Promise.coroutine
n7z = require 'node-7z'
semver = require 'semver'
babel = require 'babel-core'
{compile} = require 'coffee-react'
asar = require 'asar'
walk = require 'walk'
tar = require 'tar-fs'
child_process = require 'child_process'
unzip = require 'node-unzip-2'
glob = require 'glob'
rimraf = promisify require 'rimraf'
gitArchive = require 'git-archive'

{log} = require './lib/utils'

DONT_PACK_APP_IF_EXISTS=false
USE_GITHUB_FLASH_MIRROR=false

# *** CONSTANTS ***
build_dir_name = 'build'
download_dir_name = 'download'
release_dir_name = 'release'
platform_to_paths = {
  'win32-ia32': 'win-ia32',
  'win32-x64': 'win-x64',
  'darwin-x64': 'osx-x64',
  'linux-x64': 'linux-x64'
}
config = (->
  # global.* variables are assigned to adapt for requiring 'config'
  global.ROOT = __dirname
  system_appdata_path = process.env.APPDATA || (
    if process.platform == 'darwin'
    then path.join(process.env.HOME, 'Library/Application Support')
    else '/var/local')
  global.APPDATA_PATH = path.join system_appdata_path, 'poi'
  global.EXROOT = global.APPDATA_PATH
  require './lib/config')()

use_taobao_mirror = config.get 'buildscript.useTaobaoMirror', true
if process.env.TRAVIS
  use_taobao_mirror = false
npm_exec_path = path.join __dirname, 'node_modules', 'npm', 'bin', 'npm-cli.js'

plugin_json_path = path.join ROOT, 'assets', 'data', 'plugin.json'
mirror_json_path = path.join ROOT, 'assets', 'data', 'mirror.json'
npm_server = (->
  mirrors = fs.readJsonSync mirror_json_path
  # Don't want to mess with detecting system language here without window.navigator
  language = config.get 'poi.language', 'zh-CN'
  primaryServer = if language == 'zh-CN' then 'taobao' else 'npm'
  server = config.get "packageManager.mirrorName", primaryServer
  if process.env.TRAVIS
    server = 'npm'
  mirrors[server].server)()
log "Using npm mirror #{npm_server}"

theme_list =
  darkly:     'https://bootswatch.com/darkly/bootstrap.css'
  flatly:     'https://bootswatch.com/flatly/bootstrap.css'
  lumen:      'https://bootswatch.com/lumen/bootstrap.css'
  paper:      'https://bootswatch.com/paper/bootstrap.css'
  slate:      'https://bootswatch.com/slate/bootstrap.css'
  superhero:  'https://bootswatch.com/superhero/bootstrap.css'
  united:     'https://bootswatch.com/united/bootstrap.css'
  lumendark:  'https://raw.githubusercontent.com/PHELiOX/poi-theme-lumendark/master/lumendark.css'
  paperdark:  'https://raw.githubusercontent.com/ruiii/poi_theme_paper_dark/master/paperdark.css'
  papercyan:  'https://raw.githubusercontent.com/govizlora/theme-papercyan/master/papercyan.css'
  paperblack: 'https://raw.githubusercontent.com/PHELiOX/paperblack/master/css/paperblack.css'
  darklykai:  'https://raw.githubusercontent.com/magicae/sleepy/master/dist/sleepy.css'

get_flash_url = (platform) ->
  if process.env.TRAVIS || USE_GITHUB_FLASH_MIRROR
    "https://github.com/dkwingsmt/PepperFlashFork/releases/download/latest/#{platform}.zip"
  else
    "http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/#{platform}.zip"

target_list = [
  # Files
  'app.js',
  'index.html', 'index.js', 'LICENSE', 'package.json', 'babel.config.js',
  # Folders
  'assets',
  'lib',
  'views',
  'node_modules',
  'i18n']

# *** TOOLS & COMMON METHODS ***
downloadAsync = async (url, dest_dir, filename, description) ->
  log "Downloading #{description} from #{url}"
  fs.ensureDirSync dest_dir
  filename = filename || path.basename(url)
  dest_path = path.join(dest_dir, filename)
  try
    yield fs.accessAsync dest_path, fs.R_OK
    log "Use existing #{dest_path}"
  catch e
    [response, body] = yield requestAsync
      url: url
      encoding: null
    if response.statusCode != 200
      throw new Error("Response status code #{response.statusCode}")
    yield fs.writeFileAsync dest_path, body
    log "Successfully downloaded to #{dest_path}"
  dest_path

extractZipNodeAsync = (zip_file, dest_path, descript="") ->
  log "Extract #{descript}"
  new Promise (resolve) ->
    fs.ensureDirSync path.dirname dest_path
    fs.createReadStream(zip_file).pipe(unzip.Extract({ path: dest_path }))
    .on 'close', ->
      log "Extracting #{descript} finished"
      resolve()

extractZipCliAsync = (zip_file, dest_path, descript="") ->
  log "Extract #{descript}"
  fs.ensureDirSync dest_path
  new Promise (resolve, reject) ->
    command = "unzip '#{zip_file}'"
    child_process.exec command,
      cwd: dest_path
      (error) ->
        if error?
          reject error
        else
          log "Extracting #{descript} finished"
          resolve()

extractZipAsync =
  if process.platform == 'win32'
    extractZipNodeAsync
  else
    extractZipCliAsync

downloadExtractZipAsync = async (url, download_dir, filename, dest_path,
                                 description, useCli) ->
  while 1
    try
      zip_path = yield downloadAsync url, download_dir, filename, description
      yield extractZipAsync zip_path, dest_path, description
    catch e
      log "Downloading failed, retrying #{url}, reason: #{e}"
      try
        yield fs.removeAsync zip_path
      catch
      continue
    break

downloadThemesAsync = (theme_root) ->
  Promise.all (for theme, theme_url of theme_list
    downloadAsync theme_url, path.join(theme_root, theme, 'css'),
      "#{theme}.css", "#{theme} theme")

installFlashAsync = (platform, download_dir, flash_dir) ->
  flash_url = get_flash_url platform
  downloadExtractZipAsync flash_url, download_dir, "flash-#{platform}.zip",
      flash_dir, 'flash plugin'

compress7zAsync = async (files, archive, options) ->
  try
    yield fs.removeAsync archive
  catch e
  yield (new n7z()).add archive, files, options

changeExt = (src_path, ext) ->
  src_dir = path.dirname src_path
  src_basename = path.basename(src_path, path.extname src_path)
  path.join(src_dir, src_basename+ext)

gitArchiveAsync = async (tar_path, tgt_dir) ->
  log 'Archive file from git..'
  try
    fs.removeSync tar_path
  catch
  try
    yield promisify(gitArchive)
      commit: 'HEAD'
      outputPath: tar_path
      repoPath: __dirname
  catch e
    log e
    log "Error on git archive! Probably you haven't installed git or it does not exist in your PATH."
    process.exit 1
  log 'Archive complete! Extracting...'
  yield new Promise (resolve) ->
    fs.createReadStream(tar_path)
    .pipe(tar.extract tgt_dir)
    .on('finish', (e) ->
      log 'Extract complete!'
      resolve(e)
    )
    .on('error', (err) ->
      log err
      resolve()
    )

# Run js script
runScriptAsync = (script_path, args, options) ->
  new Promise (resolve) ->
    proc = child_process.fork script_path, args, options
    proc.on 'exit', -> resolve()

# Run js script, but suppress stdout and stores it into a string used to resolve
runScriptReturnStdoutAsync = (script_path, args, options) ->
  new Promise (resolve) ->
    proc = child_process.fork script_path, args, Object.assign({silent: true}, options)
    data = ''
    proc.stdout.on 'readable', ->
      while (chunk = proc.stdout.read()) != null
        data += chunk
    proc.on 'exit', -> resolve(data)

npmInstallAsync = async (tgt_dir, args=[]) ->
  # Can't use require('npm') module b/c we kept npm2 in node_modules for plugins
  log "Installing npm for #{tgt_dir}"
  fs.ensureDirSync tgt_dir
  yield runScriptAsync npm_exec_path, ['install', '--registry', npm_server].concat(args),
    cwd: tgt_dir
  log "Finished installing npm for #{tgt_dir}"


# *** METHODS ***
filterCopyAppAsync = async (stage1_app, stage2_app) ->
  yield Promise.all (for target in target_list
    fs.copyAsync path.join(stage1_app, target), path.join(stage2_app, target),
      clobber: true)

compileToJsAsync = (app_dir, dontRemove) ->
  log "Compiling #{app_dir}"
  targetExts = ['.coffee', '.cjsx', '.es']

  options =
    followLinks: false
    filters: ['node_modules', 'assets', path.join(__dirname, 'components')]

  new Promise (resolve) ->
    tasks = []
    walk.walk app_dir, options
    .on 'file', (root, fileStats, next) ->
      extname = path.extname(fileStats.name).toLowerCase()
      if extname in targetExts
        tasks.push (async ->
          src_path = path.join root, fileStats.name
          tgt_path = changeExt src_path, '.js'
          src = yield fs.readFileAsync src_path, 'utf-8'
          try
            if extname is '.es'
              {presets, plugins} = require('./babel.config')
              tgt = babel.transform(src, {presets, plugins}).code
            else
              tgt = compile src, {bare: true}
          catch e
            log "Compiling #{src_path} failed: #{e}"
            return
          yield fs.writeFileAsync tgt_path, tgt
          yield fs.removeAsync src_path unless dontRemove
          #log "Compiled #{tgt_path}"
          )()
      next()
    .on 'end', async ->
      log 'Compiling ended'
      resolve(yield Promise.all tasks)

checkNpmVersion = ->
  # Check npm version
  npm_version = (yield runScriptReturnStdoutAsync npm_exec_path, ['--version']).trim()
  log "You are using npm v#{npm_version}"
  if semver.major(npm_version) == 2
    log "*** USING npm 2 TO BUILD poi IS PROHIBITED ***"
    log "Aborted."
    false
  else
    true

installPluginsTo = async (plugin_names, install_root, tarball_root) ->
  try
    fs.removeSync install_root
    fs.removeSync tarball_root
  catch
  fs.ensureDirSync install_root
  fs.ensureDirSync tarball_root

  # Install plugins
  yield npmInstallAsync install_root, ['--production', '--prefix', '.'].concat(plugin_names)

  plugins_dir = (for name in plugin_names
    plugin_dir = path.join install_root, 'node_modules', name

    # Modify package.json
    plugin_package_json = path.join(plugin_dir, 'package.json')
    contents = require plugin_package_json
    # Delete this key, otherwise npm install won't succeed
    delete contents._requiredBy
    contents.bundledDependencies = (k for k of contents.dependencies)
    fs.writeFileSync plugin_package_json, JSON.stringify(contents)

    plugin_dir)

  yield Promise.all (for plugin_dir in plugins_dir
    npmInstallAsync plugin_dir, ['--no-bin-links', '--no-progress', '--production'])

  log "Now packing plugins into tarballs."
  yield runScriptAsync npm_exec_path, ['pack'].concat(plugins_dir),
    cwd: tarball_root

module.exports.installPluginsAsync = async (poi_version) ->
  build_root = path.join __dirname, 'dist'
  building_root = path.join build_root, "plugins"
  release_dir = build_root

  packages = fs.readJsonSync plugin_json_path

  plugin_names = (n for n of packages)

  install_root = path.join building_root, 'poi-plugins_install'
  gzip_root = path.join building_root, 'poi-plugins'
  yield installPluginsTo plugin_names, install_root, gzip_root

  d = new Date()
  str_date = "#{d.getUTCFullYear()}-#{d.getUTCMonth()+1}-#{d.getUTCDate()}"
  archive_path = path.join release_dir, "poi-plugins_#{str_date}.7z"
  yield compress7zAsync gzip_root, archive_path

  log "Successfully built tarballs at #{archive_path}"

# Build poi for use
module.exports.buildAsync = async (poi_version, dontRemove) ->
  return if !checkNpmVersion()

  build_root = path.join __dirname, build_dir_name
  download_dir = path.join build_root, download_dir_name
  building_root = path.join __dirname, 'app_compiled'
  stage1_app = path.join building_root, 'stage1'
  tar_path = path.join stage1_app, "app_stage1.tar"
  stage2_app = building_root
  theme_root = path.join stage1_app, 'assets', 'themes'

  # Clean files
  try
    fs.removeSync building_root if !dontRemove
  try
    fs.removeSync stage1_app
  fs.ensureDirSync stage1_app
  fs.ensureDirSync stage2_app
  fs.ensureDirSync path.join stage1_app, 'node_modules'

  # Stage1: Everything downloaded and translated
  yield gitArchiveAsync tar_path, stage1_app
  yield downloadThemesAsync theme_root
  yield compileToJsAsync(stage1_app, false)

  # Stage2: Filtered copy
  yield filterCopyAppAsync stage1_app, stage2_app
  yield npmInstallAsync(stage2_app, ['--production']) if !dontRemove

  # Clean files
  try
    fs.removeSync stage1_app

  # Rewrite package.json for build
  packagePath = path.join(stage2_app, 'package.json')
  packageData = fs.readJsonSync packagePath
  delete packageData.build
  delete packageData.devDependencies
  fs.removeSync packagePath
  fs.writeJsonSync packagePath, packageData

  log "Done."

module.exports.compileAsync = async ->
  yield compileToJsAsync __dirname, true

# Install flash
module.exports.getFlashAsync = async (poi_version) ->
  build_root = path.join __dirname, build_dir_name
  download_dir = path.join build_root, download_dir_name
  platform = "#{process.platform}-#{process.arch}"
  fs.removeSync path.join __dirname, 'PepperFlash'
  flash_dir = path.join __dirname, 'PepperFlash', platform_to_paths[platform]
  yield installFlashAsync platform, download_dir, flash_dir

module.exports.getFlashAllAsync = async (poi_version) ->
  build_root = path.join __dirname, build_dir_name
  download_dir = path.join build_root, download_dir_name
  platforms = ['win32-ia32', 'win32-x64', 'darwin-x64', 'linux-x64']
  fs.removeSync path.join __dirname, 'PepperFlash'
  tasks = []
  for platform in platforms
    flash_dir = path.join __dirname, 'PepperFlash', platform_to_paths[platform]
    tasks.push installFlashAsync platform, download_dir, flash_dir
  yield Promise.all tasks

module.exports.cleanFiles = () ->
  for file in glob.sync(path.join __dirname, "build", "!(icon)*")
    rimraf file, ()->
  rimraf path.join(__dirname, 'app_compiled'), ()->
  rimraf path.join(__dirname, 'dist'), ()->

module.exports.installThemeAsync = async ->
  theme_root = path.join __dirname, 'assets', 'themes'
  yield downloadThemesAsync theme_root

module.exports.packWinReleaseAsync = async (poi_version) ->
  target = path.join __dirname, 'dist', 'win-unpacked'
  dest = path.join __dirname, 'dist', 'win', "poi-#{poi_version}-win-x64.7z"
  yield compress7zAsync target, dest
  target = path.join __dirname, 'dist', 'win-ia32-unpacked'
  dest = path.join __dirname, 'dist', 'win-ia32', "poi-#{poi_version}-win-ia32.7z"
  yield compress7zAsync target, dest
  log "Release packed up"
