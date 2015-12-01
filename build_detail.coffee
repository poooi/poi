use_taobao_mirror = false

# *** INCLUDE ***
os = require 'os'
path = require 'path-extra'
Promise = require 'bluebird'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
fs = Promise.promisifyAll require 'fs-extra'
gulp = require 'gulp'
AdmZip = require 'adm-zip'
async = Promise.coroutine
n7z = require 'node-7z'
_ = require 'underscore'
semver = require 'semver'
{execAsync} = Promise.promisifyAll require('child_process')
{compile} = require 'coffee-react'
through2 = require 'through2'
asar = require 'asar'

{log} = require './lib/utils'

# *** CONSTANTS ***
build_dir_name = 'build'
download_dir_name = 'download'
release_dir_name = 'release'

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

get_electron_url = (platform, arch, electron_version) ->
  electron_fullname = "electron-v#{electron_version}-#{platform}-#{arch}.zip"
  if use_taobao_mirror
    "https://npm.taobao.org/mirrors/electron/#{electron_version}/#{electron_fullname}"
  else
    "https://github.com/atom/electron/releases/download/v#{electron_version}/#{electron_fullname}"

get_flash_url = (platform, arch) ->
  "http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/#{platform}.zip"

target_list = [
  # Files
  'app.js', 'bower.json', 'config.cson', 'constant.cson',
  'index.html', 'index.js', 'LICENSE', 'package.json',
  'mirror.json', 'plugin.json',
  # Folders
  'assets',
  'components',
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
    yield fs.writeFileAsync dest_path, body
    log "Successfully downloaded to #{dest_path}"
  dest_path

extractZip = (zip_file, dest_path, descript="") ->
  log "Extract #{descript}"
  fs.ensureDirSync path.dirname dest_path
  zip = new AdmZip zip_file
  zip.extractAllTo dest_path, true
  log "Extracting #{descript} finished"

downloadThemesAsync = (theme_root, download_dir) ->
  Promise.all (for theme, theme_url of theme_list
    downloadAsync theme_url, path.join(theme_root, theme, 'css'), "#{theme}.css", "#{theme} theme")

installFlashAsync = async (platform, arch, download_dir, flash_dir) ->
  flash_url = get_flash_url platform, arch
  flash_path = yield downloadAsync flash_url, download_dir, "flash-#{platform}-#{arch}.zip", 'flash plugin'
  extractZip flash_path, flash_dir, 'flash plugin'

copyNoOverwriteAsync = async (src, tgt, options) ->
  try
    yield fs.accessAsync tgt, fs.R_OK
  catch e
    yield fs.copyAsync src, tgt

add7z = async (archive, files, options) ->
  try
    yield fs.removeAsync archive
  catch e
  yield (new n7z()).add archive, files, options

changeExt = (src_path, ext) -> 
  src_dir = path.dirname src_path
  src_basename = path.basename(src_path, path.extname src_path)
  path.join(src_dir, src_basename+ext)

# *** METHODS ***
npmInstallAsync = async (npm_path, tgt_dir) ->
  command = "'#{npm_path}' install --production"
  log "Installing npm for #{tgt_dir}"
  cwd = process.cwd()
  fs.ensureDirSync tgt_dir
  process.chdir tgt_dir
  yield execAsync command
  process.chdir cwd
  log "Finished installing npm for #{tgt_dir}"

bowerInstallAsync = async (bower_path, tgt_dir) ->
  command = "'#{bower_path}' install"
  log command
  cwd = process.cwd()
  fs.ensureDirSync tgt_dir
  process.chdir tgt_dir
  yield execAsync command
  process.chdir cwd

filterCopyAppAsync = async (stage1_app, stage2_app) ->
  yield Promise.all (for target in target_list
    fs.copyAsync path.join(stage1_app, target), path.join(stage2_app, target), 
      clobber: true)

packageAsarAsync = (app_folder, app_asar) ->
  Promise.promisify(asar.createPackage)(app_folder, app_asar)

translateCoffeeAsync = (app_dir) ->
  log "Compiling #{app_dir}"
  ignoreFolders = ['node_modules', 'assets', 'components']
  excludeDirectoriesFilter = through2.obj (item, enc, next) ->
    if item.stats.isDirectory() && path.basename(item.path) in ignoreFolders
    else
      @push item
    next()

  onlyCoffeescriptsFilter = through2.obj (item, enc, next) ->
    if item.stats.isFile() && path.extname(item.path).toLowerCase() in ['.coffee', '.cjsx']
      @push item
    next()

  new Promise (resolve) ->
    tasks = []
    fs.walk app_dir
    .pipe excludeDirectoriesFilter
    .pipe onlyCoffeescriptsFilter
    .on 'data', (item) ->
      tasks.push (async ->
        src_path = item.path
        tgt_path = changeExt src_path, '.js'
        src = yield fs.readFileAsync src_path, 'utf-8'
        tgt = compile src
        yield fs.writeFileAsync tgt_path, tgt
        yield fs.removeAsync src_path
        log "Compiled #{tgt_path}"
        )()
    .on 'end', async ->
      resolve(yield Promise.all tasks)

packageAppAsync = async (poi_version, app_dir, release_dir) ->
  log "Packaging app.asar."
  release_path = path.join(release_dir, "app-#{poi_version}", "app.asar")
  try
    yield fs.removeAsync release_path
  catch e
  yield packageAsarAsync app_dir, release_path
  release_path

packageReleaseAsync = async (poi_fullname, electron_dir, release_dir) ->
  log "Packaging #{poi_fullname}."
  release_path = path.join(release_dir, poi_fullname+'.7z')
  try
    yield fs.removeAsync release_path
  catch e
  yield add7z release_path, electron_dir
  release_path

packageStage3Async = async (platform, arch, poi_version, electron_version, 
            download_dir, app_path, building_root, release_dir) ->
  platform_arch = "#{platform}-#{arch}"
  poi_fullname = "poi-v#{poi_version}-#{platform_arch}"
  stage3_electron = path.join building_root, poi_fullname
  stage3_app = path.join stage3_electron, 'resources', 'app.asar'
  flash_dir = path.join stage3_electron, 'PepperFlash'

  try
    yield fs.removeAsync stage3_electron
  catch e

  copy_app = fs.copyAsync app_path, stage3_app
  install_flash = installFlashAsync platform, arch, download_dir, flash_dir

  electron_url = get_electron_url platform, arch, electron_version
  install_electron = (async ->
    electron_path = yield downloadAsync electron_url, download_dir, '', 'electron'
    extractZip electron_path, stage3_electron, 'electron'
  )()

  yield Promise.join copy_app, install_flash, install_electron

  if platform == 'win32'
    raw_poi_exe = path.join(building_root, "#{platform_arch}.raw.poi.exe")
    poi_exe = path.join(building_root, "#{platform_arch}.poi.exe")
    yield Promise.join(
      fs.copyAsync(path.join(stage3_electron, 'electron.exe'), raw_poi_exe),
      copyNoOverwriteAsync(path.join(stage3_electron, 'electron.exe'), poi_exe))
    yield fs.moveAsync path.join(stage3_electron, 'electron.exe'), path.join(stage3_electron, 'poi.exe'),
      clobber: true
    Promise.resolve 
      log: " To complete packaging #{platform}-#{arch}, you need to:\n
            (1) Modify #{raw_poi_exe} and save as #{platform_arch}.poi.exe after\n
            ...(a) changing its icon into poi\n
            ...(b) changing its version into #{poi_version}\n
            * The target file is not overwritten if you build poi again."
      todo: async ->
        yield fs.copyAsync poi_exe, path.join(stage3_electron, 'poi.exe')
        release_path = yield packageReleaseAsync poi_fullname, stage3_electron, release_dir
        log "#{platform}-#{arch} successfully packaged to #{release_path}."

  else if platform == 'linux'

    yield fs.moveAsync path.join(stage3_electron, 'electron'), path.join(stage3_electron, 'poi'),
      clobber: true
    package_release = packageReleaseAsync poi_fullname, stage3_electron, release_dir
    Promise.resolve 
      log: null
      todo: async ->
        release_path = yield package_release
        log "#{platform}-#{arch} successfully packaged to #{release_path}."

  else if platform == 'darwin'
    Promise.resolve
      log: "This is chiba's guo, I no bei."
      todo: ->
  else
    Promise.resolve
      log: "Unsupported platform #{platform}."
      todo: ->


module.exports =
  buildLocalAsync: ->
    download_dir = path.join __dirname, build_dir_name, download_dir_name
    theme_root = path.join __dirname, 'assets', 'themes'
    flash_dir = path.join __dirname, 'PepperFlash'
    npm_path = 'npm'
    bower_path = path.join(__dirname, 'node_modules', 'bower', 'bin', 'bower')

    download_theme = downloadThemesAsync theme_root, download_dir
    install_flash = installFlashAsync os.platform(), os.arch(), download_dir, flash_dir
    install_npm_bower = npmInstallAsync npm_path, __dirname
    .then -> (async -> yield bowerInstallAsync bower_path, __dirname)()

    Promise.join download_theme, install_flash, install_npm_bower


  buildAsync: async (poi_version, electron_version, platform_arch_list) ->
    build_root = path.join __dirname, build_dir_name

    download_dir = path.join build_root, download_dir_name
    building_root = path.join build_root, "building_#{poi_version}"
    release_dir = path.join build_root, release_dir_name

    stage1_app = path.join building_root, 'stage1'
    stage2_app = path.join building_root, 'app'

    theme_root = path.join stage1_app, 'assets', 'themes'

    npm_path = 'npm'
    bower_path = path.join(__dirname, 'node_modules', 'bower', 'bin', 'bower')

    try
      yield Promise.join \
        (fs.removeAsync stage1_app), 
        (fs.removeAsync stage2_app)
    catch e
    fs.ensureDirSync stage1_app
    fs.ensureDirSync stage2_app

    # Check npm version
    npm_version = (yield execAsync "'#{npm_path}' --version")[0].trim()
    log "You are using npm v#{npm_version}"
    if semver.major(npm_version) == 2
      log "*** USING npm 2 TO BUILD poi IS PROHIBITED ***"
      log "Aborted."
      return

    # Prepare stage1
    download_themes = downloadThemesAsync theme_root, download_dir
    archive_app = execAsync "git archive HEAD | tar -x -C '#{stage1_app}'"
    yield Promise.join download_themes, 
      (async -> 
        yield archive_app
        yield fs.moveAsync path.join(stage1_app, 'default-config.cson'), path.join(stage1_app, 'config.cson')
        yield Promise.join(
          translateCoffeeAsync(stage1_app),
          (async -> 
            yield npmInstallAsync npm_path, stage1_app
            yield bowerInstallAsync bower_path, stage1_app
            )())
        )()

    # Prepare stage2
    yield filterCopyAppAsync stage1_app, stage2_app

    # Pack app.asar
    app_path = yield packageAppAsync poi_version, stage2_app, release_dir

    # Prepare stage 3
    stage3_info = yield Promise.all (
      for [platform, arch] in platform_arch_list
        packageStage3Async(platform, arch, poi_version, electron_version, 
          download_dir, app_path, building_root, release_dir))

    # Finishing work of stage 3
    stage3_logs = (for [[platform, arch], info] in _.zip(platform_arch_list, stage3_info) when info
      ["#{platform}-#{arch}", info.log])
    if stage3_logs
      log " "
      log "*** BUILDING IS NOT COMPLETED: See log below ***"
      log " "
      for [platform_arch, stage3_log] in stage3_logs when stage3_log
        log "Info when packaging #{platform_arch}:"
        for line in stage3_log.split '\n'
          log "  "+line
        log " "
      log "*** Press Enter AFTER fulfilling the requirements above to finish ***"
      yield new Promise (resolve) ->
        process.stdin.once 'data', ->
          process.stdin.unref()   # Allows the program to terminate 
          resolve()
      yield Promise.all (info.todo() for info in stage3_info when info.todo)
    log "All platforms are successfully built."

  cleanTempFiles: async ->
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
