Promise = require 'bluebird'
gulp = require 'gulp'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
fs = Promise.promisifyAll require 'fs-extra'
path = require 'path-extra'
colors = require 'colors'
unzip = require 'unzip'

async = Promise.coroutine

gulp.task 'theme', async ->
  themes =
    cerulean: 'https://bootswatch.com/cerulean/bootstrap.css'
    cosmo: 'https://bootswatch.com/cosmo/bootstrap.css'
    cyborg: 'https://bootswatch.com/cyborg/bootstrap.css'
    darkly: 'https://bootswatch.com/darkly/bootstrap.css'
    flatly: 'https://bootswatch.com/flatly/bootstrap.css'
    journal: 'https://bootswatch.com/journal/bootstrap.css'
    lumen: 'https://bootswatch.com/lumen/bootstrap.css'
    paper: 'https://bootswatch.com/paper/bootstrap.css'
    readable: 'https://bootswatch.com/readable/bootstrap.css'
    sandstone: 'https://bootswatch.com/sandstone/bootstrap.css'
    simplex: 'https://bootswatch.com/simplex/bootstrap.css'
    slate: 'https://bootswatch.com/slate/bootstrap.css'
    spacetab: 'https://bootswatch.com/spacelab/bootstrap.css'
    superhero: 'https://bootswatch.com/superhero/bootstrap.css'
    united: 'https://bootswatch.com/united/bootstrap.css'
    yeti: 'https://bootswatch.com/yeti/bootstrap.css'
  for theme, url of themes
    dir = path.join(__dirname, 'assets', 'themes', theme, 'css')
    fs.ensureDirSync dir
    console.log "Downloding #{theme} theme.".blue
    data = yield request.getAsync url,
      encoding: null
    yield fs.writeFileAsync path.join(dir, "#{theme}.css"), data

gulp.task 'flash', ->
  console.log "Downloading flash plugin".blue
  plugins =
    win32: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/win32.zip'
    linux: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/linux.zip'
    darwin: 'http://7xj6zx.com1.z0.glb.clouddn.com/poi/PepperFlash/darwin.zip'
  url = plugins[process.platform]
  dir = path.join(__dirname, 'PepperFlash')
  fs.ensureDirSync dir
  data = request.get url
    .pipe unzip.Extract({path: dir})

gulp.task 'default', [
  'theme',
  'flash'
]
