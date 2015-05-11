gulp = require 'gulp'
request = require 'request'
fs = require 'fs-extra'
path = require 'path-extra'
colors = require 'colors'

gulp.task 'theme', ->
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
    request.get url
      .pipe fs.createWriteStream path.join(dir, "#{theme}.css")
gulp.task 'default', [
  'theme'
]
