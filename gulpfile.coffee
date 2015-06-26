POI_VERSION = '2.2.0'
ELECTRON_VERSION = '0.28.2'
SYSTEM_BIT =
  win32: 'ia32'
  linux: 'x64'
  darwin: 'x64'
PLATFORM = process.env.BUILD_PLATFORM || process.platform

path = require 'path-extra'
BUILD_ROOT = path.join(path.tempdir(), "poi-v#{POI_VERSION}-#{PLATFORM}-#{SYSTEM_BIT[PLATFORM]}", 'resources', 'app')

Promise = require 'bluebird'
gulp = require 'gulp'
del = Promise.promisifyAll require 'del'
delAsync = Promise.promisify del
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
fs = Promise.promisifyAll require 'fs-extra'
colors = require 'colors'
AdmZip = require 'adm-zip'
{execAsync} = Promise.promisifyAll require('child_process')

{log, warn, error} = require './lib/utils'


async = Promise.coroutine

gulp.task 'theme', async ->
  themes =
    darkly: 'https://bootswatch.com/darkly/bootstrap.css'
    flatly: 'https://bootswatch.com/flatly/bootstrap.css'
    lumen: 'https://bootswatch.com/lumen/bootstrap.css'
    paper: 'https://bootswatch.com/paper/bootstrap.css'
    slate: 'https://bootswatch.com/slate/bootstrap.css'
    superhero: 'https://bootswatch.com/superhero/bootstrap.css'
    united: 'https://bootswatch.com/united/bootstrap.css'
  for theme, url of themes
    dir = path.join(__dirname, 'assets', 'themes', theme, 'css')
    fs.ensureDirSync dir
    log "Downloding #{theme} theme."
    data = yield request.getAsync url,
      encoding: null
    yield fs.writeFileAsync path.join(dir, "#{theme}.css"), data

gulp.task 'flash', async ->
  plugins =
    win32: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/win32.zip'
    linux: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/linux.zip'
    darwin: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/darwin.zip'
  url = plugins[process.platform]
  dir = path.join(__dirname, 'PepperFlash')
  fs.ensureDirSync dir
  try
    yield fs.accessAsync path.join(path.tempdir(), "flashplayer-#{PLATFORM}.zip"), fs.R_OK
  catch e
    log "Downloading flash plugin #{PLATFORM}"
    [response, body] = yield requestAsync
      url: url
      encoding: null
    yield fs.writeFileAsync path.join(path.tempdir(), "flashplayer-#{PLATFORM}.zip"), body
  log "Extract flash plugin"
  zip = new AdmZip path.join(path.tempdir(), "flashplayer-#{PLATFORM}.zip")
  zip.extractAllTo dir, true

gulp.task 'download-electron', async ->
  electrons =
    win32: "https://npm.taobao.org/mirrors/electron/#{ELECTRON_VERSION}/electron-v#{ELECTRON_VERSION}-win32-ia32.zip"
    linux: "https://npm.taobao.org/mirrors/electron/#{ELECTRON_VERSION}/electron-v#{ELECTRON_VERSION}-linux-x64.zip"
    darwin: "https://npm.taobao.org/mirrors/electron/#{ELECTRON_VERSION}/electron-v#{ELECTRON_VERSION}-darwin-x64.zip"
  url = electrons[PLATFORM]
  log url
  dir = path.join(path.tempdir(), "poi-v#{POI_VERSION}-#{PLATFORM}-#{SYSTEM_BIT[PLATFORM]}")
  fs.ensureDirSync dir
  try
    yield fs.accessAsync path.join(path.homedir(), "electron-v#{ELECTRON_VERSION}-#{PLATFORM}.zip")
  catch e
    log "Downloding Electron #{PLATFORM} #{ELECTRON_VERSION}"
    [response, body] = yield requestAsync
      url: url
      encoding: null
    yield fs.writeFileAsync path.join(path.homedir(), "electron-v#{ELECTRON_VERSION}-#{PLATFORM}.zip"), body
  log "Extract Electron #{ELECTRON_VERSION}"
  zip = new AdmZip path.join(path.homedir(), "electron-v#{ELECTRON_VERSION}-#{PLATFORM}.zip")
  zip.extractAllTo dir, true

gulp.task 'copy-files', ['download-electron'], ->
  gulp.src(['app.coffee', 'bower.json', 'default-config.json', 'index.html', 'index.js', 'LICENSE', 'package.json'])
      .pipe(gulp.dest(BUILD_ROOT))
  gulp.src(['assets/**/*']).pipe(gulp.dest(path.join(BUILD_ROOT, 'assets')))
  gulp.src(['components/**/*']).pipe(gulp.dest(path.join(BUILD_ROOT, 'components')))
  gulp.src(['lib/**/*']).pipe(gulp.dest(path.join(BUILD_ROOT, 'lib')))
  gulp.src(['views/**/*']).pipe(gulp.dest(path.join(BUILD_ROOT, 'views')))
  gulp.src(['plugins/**/*']).pipe(gulp.dest(path.join(BUILD_ROOT, 'plugins')))

gulp.task 'install-dependencies', ['copy-files'], async ->
  log BUILD_ROOT
  fs.ensureDirSync BUILD_ROOT
  process.chdir BUILD_ROOT
  log 'Installing dependencies'
  yield execAsync 'npm install --production'

gulp.task 'get-flash-player', ['install-dependencies'], async ->
  plugins =
    win32: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/win32.zip'
    linux: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/linux.zip'
    darwin: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/darwin.zip'
  url = plugins[PLATFORM]
  dir = path.join(path.tempdir(), "poi-v#{POI_VERSION}-#{PLATFORM}-#{SYSTEM_BIT[PLATFORM]}", 'PepperFlash')
  fs.ensureDirSync dir
  try
    yield fs.accessAsync path.join(path.homedir(), "flashplayer-#{PLATFORM}.zip"), fs.R_OK
  catch e
    log "Downloading flash plugin #{PLATFORM}"
    [response, body] = yield requestAsync
      url: url
      encoding: null
    yield fs.writeFileAsync path.join(path.homedir(), "flashplayer-#{PLATFORM}.zip"), body
  log "Extract flash plugin"
  zip = new AdmZip path.join(path.homedir(), "flashplayer-#{PLATFORM}.zip")
  zip.extractAllTo dir, true

gulp.task 'build', ['get-flash-player'], async ->
  fs.renameSync path.join(BUILD_ROOT, 'default-config.json'), path.join(BUILD_ROOT, 'config.json')
  process.chdir path.join(path.tempdir(), "poi-v#{POI_VERSION}-#{PLATFORM}-#{SYSTEM_BIT[PLATFORM]}")
  if PLATFORM == 'linux'
    yield execAsync 'mv ./electron ./poi'
    yield execAsync 'chmod +x ./poi'
  else if PLATFORM == 'win32'
    yield execAsync 'mv ./electron.exe ./poi.exe'
  log "Build OK: #{path.join(path.tempdir(), "poi-v#{POI_VERSION}-#{PLATFORM}-#{SYSTEM_BIT[PLATFORM]}")}"

###
gulp.task 'electron-all', ->

gulp.task 'build', ['prepare-build', 'flash', 'electron'], ->
  gulp.start 'pack'

gulp.task 'build-all', ['prepare-build', 'flash-all', 'electron-all'], ->
  gulp.start 'pack-all'

gulp.task 'clean-build'
###

gulp.task 'default', ['theme', 'flash']
