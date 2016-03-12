# *** INCLUDE ***
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
_ = require 'underscore'
semver = require 'semver'
{compile} = require 'coffee-react'
asar = require 'asar'
walk = require 'walk'
tar = require 'tar-fs'
child_process = require 'child_process'
unzip = require 'node-unzip-2'

{log} = require './lib/utils'

DONT_PACK_APP_IF_EXISTS=false
USE_GITHUB_FLASH_MIRROR=false

# *** CONSTANTS ***
build_dir_name = 'build'
download_dir_name = 'download'
release_dir_name = 'release'
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

# If !use_taobao_mirror, download Electron from GitHub.
#config.set 'buildscript.useTaobaoMirror', false
use_taobao_mirror = config.get 'buildscript.useTaobaoMirror', true
if process.env.TRAVIS
  use_taobao_mirror = false
log "Download electron from #{if use_taobao_mirror then 'taobao mirror' else 'github'}"
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

get_electron_url = (platform, electron_version) ->
  electron_fullname = "electron-v#{electron_version}-#{platform}.zip"
  if use_taobao_mirror
    "https://npm.taobao.org/mirrors/electron/#{electron_version}/#{electron_fullname}"
  else
    "https://github.com/atom/electron/releases/download/v#{electron_version}/#{electron_fullname}"

get_flash_url = (platform) ->
  if process.env.TRAVIS || USE_GITHUB_FLASH_MIRROR
    "https://github.com/dkwingsmt/PepperFlashFork/releases/download/latest/#{platform}.zip"
  else
    "http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/#{platform}.zip"

target_list = [
  # Files
  'app.js', 'config.cson',
  'index.html', 'index.js', 'LICENSE', 'package.json', 'babel.config.js',
  # Folders
  'assets',
  'lib',
  'views',
  'node_modules',
  'i18n']

# *** TOOLS & COMMON METHODS ***
subdirListAsync = async (root) ->
  files = yield fs.readdirAsync root
  subdirs = []
  for file, index in files
    if file[0] != '.'
      subdir = path.join root, file
      stat = yield fs.statAsync subdir
      if stat.isDirectory()
        subdirs.push [file, subdir]
  subdirs

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

copyNoOverwriteAsync = async (src, tgt, options) ->
  try
    yield fs.accessAsync tgt, fs.R_OK
  catch e
    yield fs.copyAsync src, tgt

compress7zAsync = async (files, archive, options) ->
  try
    yield fs.removeAsync archive
  catch e
  yield (new n7z()).add archive, files, options

changeExt = (src_path, ext) ->
  src_dir = path.dirname src_path
  src_basename = path.basename(src_path, path.extname src_path)
  path.join(src_dir, src_basename+ext)

gitArchiveAsync = (tar_path, tgt_dir) ->
  try
    fs.removeSync tar_path
  catch
  try
    proc = child_process.spawn 'git', ['archive', 'HEAD']
  catch e
    log e
    log "Error on git archive! Probably you haven't installed git or it does not exist in your PATH."
    process.exit 1
  new Promise (resolve) ->
    proc.stdout
    .pipe(tar.extract tgt_dir)
    .on('finish', resolve)

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

packageAsarAsync = (app_folder, app_asar) ->
  try
    fs.removeSync app_asar
  catch
  promisify(asar.createPackage)(app_folder, app_asar)

translateCoffeeAsync = (app_dir) ->
  log "Compiling #{app_dir}"
  targetExts = ['.coffee', '.cjsx']

  options =
    followLinks: false
    filters: ['node_modules', 'assets', path.join(__dirname, 'components')]

  new Promise (resolve) ->
    tasks = []
    walk.walk app_dir, options
    .on 'file', (root, fileStats, next) ->
      if path.extname(fileStats.name).toLowerCase() in targetExts
        tasks.push (async ->
          src_path = path.join root, fileStats.name
          tgt_path = changeExt src_path, '.js'
          src = yield fs.readFileAsync src_path, 'utf-8'
          try
            tgt = compile src
          catch e
            log "Compiling #{src_path} failed: #{e}"
            return
          yield fs.writeFileAsync tgt_path, tgt
          yield fs.removeAsync src_path
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

packageAppAsync = async (poi_version, building_root, release_dir) ->
  tar_path = path.join building_root, "app_stage1.tar"
  stage1_app = path.join building_root, 'stage1'
  stage2_app = path.join building_root, 'app'
  theme_root = path.join stage1_app, 'assets', 'themes'
  asar_path = path.join building_root, "app.asar"
  release_path = path.join release_dir, "app-#{poi_version}.7z"

  try
    if !DONT_PACK_APP_IF_EXISTS
      throw true
    yield fs.accessAsync asar_path, fs.R_OK
  catch
    try
      fs.removeSync stage1_app
      fs.removeSync stage2_app
    catch e
    fs.ensureDirSync stage1_app
    fs.ensureDirSync stage2_app

    # Stage1: Everything downloaded and translated
    yield gitArchiveAsync tar_path, stage1_app
    download_themes = downloadThemesAsync theme_root
    prepare_app = (async ->
      yield fs.moveAsync path.join(stage1_app, 'default-config.cson'),
        path.join(stage1_app, 'config.cson')
      yield Promise.join(
        translateCoffeeAsync(stage1_app),
        npmInstallAsync(stage1_app, ['--production']))
      )()
    yield Promise.join download_themes, prepare_app

    # Stage2: Filtered copy
    yield filterCopyAppAsync stage1_app, stage2_app

    # Pack stage2 into app.asar
    log "Packaging app.asar."
    yield packageAsarAsync stage2_app, asar_path
    log "Compressing app.asar into #{release_path}"
    yield compress7zAsync asar_path, release_path
    log "Compression completed."
  asar_path

packageReleaseAsync = async (poi_fullname, electron_dir, release_dir) ->
  log "Packaging #{poi_fullname}."
  release_path = path.join(release_dir, poi_fullname+'.7z')
  try
    yield fs.removeAsync release_path
  catch e
  yield compress7zAsync electron_dir, release_path
  release_path

packageStage3Async = async (platform, poi_version, electron_version,
            download_dir, building_root, release_dir) ->
  platform_prefix = platform.split('-')[0]
  if platform_prefix == 'darwin' && process.platform != 'darwin'
    log "Can not package darwin on platform #{process.platform}."
    return Promise.resolve
      todo: ->
        log "#{platform} is not supported to be packaged under your platform \"#{process.platform}\""

  poi_fullname = "poi-v#{poi_version}-#{platform}"
  stage3_electron = path.join building_root, poi_fullname
  if platform_prefix == 'darwin'
    # Copying app.asar is done after moving Electron.app to Poi.app
    stage3_app = path.join stage3_electron, 'Poi.app', 'Contents', 'Resources', 'app.asar'
    flash_dir = path.join stage3_electron, 'Electron.app', 'Contents', 'MacOS', 'PepperFlash'
  else
    stage3_app = path.join stage3_electron, 'resources', 'app.asar'
    flash_dir = path.join stage3_electron, 'PepperFlash'

  try
    yield fs.removeAsync stage3_electron
  catch e

  install_flash = installFlashAsync platform, download_dir, flash_dir

  electron_url = get_electron_url platform, electron_version
  useCliUnzip = process.platform != 'win32'
  install_electron = downloadExtractZipAsync electron_url, download_dir, '',
      stage3_electron, 'electron', useCliUnzip

  yield Promise.join install_flash, install_electron

  if platform_prefix == 'darwin'
    poi_app_path = path.join(stage3_electron, 'Poi.app')
    yield fs.moveAsync path.join(stage3_electron, 'Electron.app'), poi_app_path,
     clobber: true

  if platform_prefix == 'win32'
    raw_poi_exe = path.join(building_root, "#{platform}.raw.poi.exe")
    poi_exe = path.join(building_root, "#{platform}.poi.exe")
    yield Promise.join(
      fs.copyAsync(path.join(stage3_electron, 'electron.exe'), raw_poi_exe),
      copyNoOverwriteAsync(path.join(stage3_electron, 'electron.exe'), poi_exe))
    yield fs.moveAsync path.join(stage3_electron, 'electron.exe'),
      path.join(stage3_electron, 'poi.exe'),
      clobber: true
    Promise.resolve
      app_path: stage3_app
      log: " To complete packaging #{platform}, you need to:\n
            (1) Modify #{raw_poi_exe} and save as #{platform}.poi.exe by\n
            ...(a) changing its icon into poi\n
            ...(b) changing its version into #{poi_version}\n
            * The target file is not overwritten if you build poi again."
      todo: async ->
        yield fs.copyAsync poi_exe, path.join(stage3_electron, 'poi.exe')
        release_path = yield packageReleaseAsync poi_fullname, stage3_electron,
          release_dir
        log "#{platform} successfully packaged to #{release_path}"

  else if platform_prefix == 'linux'
    yield fs.moveAsync path.join(stage3_electron, 'electron'),
      path.join(stage3_electron, 'poi'),
      clobber: true
    Promise.resolve
      app_path: stage3_app
      log: null
      todo: async ->
        release_path = yield packageReleaseAsync poi_fullname, stage3_electron,
          release_dir
        log "#{platform} successfully packaged to #{release_path}"

  else if platform_prefix == 'darwin'
    Promise.resolve
      app_path: stage3_app
      log: null
      todo: ->
        new Promise (resolve, reject) ->
          command = 'bash'
          command += ' "' + path.join(__dirname, 'pack_osx.sh') + '"'
          command += ' ' + poi_version
          command += ' "' + poi_app_path + '"'
          command += ' "' + path.join(stage3_electron, 'tmp') + '"'
          command += ' "' + path.join(__dirname, 'assets', 'icons') + '"'
          child_process.exec command, async (error, stdout, stderr) ->
            if error
              log stdout
              log stderr
              log error
              reject(error)
            else
              # The last line is dmg_path, but stdout has another blank line
              dmg_path  = stdout.split('\n').reverse()[1]
              release_path = path.join release_dir, path.basename(dmg_path)
              yield fs.removeAsync release_path
              yield fs.moveAsync dmg_path, release_path
              log "#{platform} successfully packaged to #{release_path}"
              resolve()

  else
    Promise.resolve
      log: "Unsupported platform #{platform_prefix}."

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
  build_root = path.join __dirname, build_dir_name
  building_root = path.join build_root, "building_#{poi_version}"
  release_dir = path.join build_root, release_dir_name

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


# Download dependencies in order to run ``electron .`` right at the poi repo
module.exports.buildLocalAsync = ->
  download_dir = path.join __dirname, build_dir_name, download_dir_name
  theme_root = path.join __dirname, 'assets', 'themes'
  flash_dir = path.join __dirname, 'PepperFlash'

  download_theme = downloadThemesAsync theme_root
  install_flash = installFlashAsync "#{os.platform()}-#{os.arch()}", download_dir,
    flash_dir
  install_npm = npmInstallAsync __dirname, ['--production']

  Promise.join download_theme, install_flash, install_npm

module.exports.buildAppAsync = (poi_version) ->
  module.exports.buildAsync (poi_version)

# Package release archives of poi, on multiple platforms
module.exports.buildAsync = async (poi_version, electron_version, platform_list) ->
  build_root = path.join __dirname, build_dir_name

  download_dir = path.join build_root, download_dir_name
  building_root = path.join build_root, "building_#{poi_version}"
  release_dir = path.join build_root, release_dir_name

  return if !checkNpmVersion()

  app_path_promise = packageAppAsync poi_version, building_root, release_dir
  if !electron_version?
    yield app_path_promise
    return

  fs.ensureDirSync release_dir
  # Stage3: Package each platform
  stage3_info = yield Promise.all (
    for platform in platform_list
      packageStage3Async(platform, poi_version, electron_version,
        download_dir, building_root, release_dir))

  # Copy app
  for info in stage3_info when info
    if info.app_path?
      fs.copySync (yield app_path_promise), info.app_path

  # Finishing work of stage 3
  stage3_logs = (for [platform, info] in _.zip(
    platform_list, stage3_info) when info.log
    [platform, info.log])
  if stage3_logs.length != 0
    log " "
    log "*** BUILDING IS NOT COMPLETED: See log below ***"
    log " "
    for [platform_arch, stage3_log] in stage3_logs when stage3_log
      log "Info when packaging #{platform_arch}:"
      for line in stage3_log.split '\n'
        log "  "+line
      log " "
    log "*** Follow the instructions above and press Enter to finish ***"
    if process.env.TRAVIS
      log "Using Travis.ci. The instructions are skipped."
    else
      yield new Promise (resolve) ->
        process.stdin.once 'data', ->
          process.stdin.unref()   # Allows the program to terminate
          resolve()
  yield Promise.all (info.todo() for info in stage3_info when info.todo)
  log "All platforms are successfully built."


# Remove everything in "build" except the archived release
module.exports.cleanTempFiles = async ->
  build_root = path.join __dirname, build_dir_name
  try
    yield fs.accessAsync build_root, fs.R_OK
  catch e
    log "Nothing to delete."
    return
  subdirs = yield subdirListAsync build_root
  try
    yield Promise.all (
      for [dirname, dirpath] in subdirs when dirname != release_dir_name
        log "Removed #{dirpath}"
        fs.removeAsync dirpath)
  catch
  log "Done."
