require('@babel/register')(require('./babel-register.config'))
const gulp = require('gulp')
const childProcess = require('child_process')
const { trim } = require('lodash')

global.ROOT = __dirname

const { log } = require('./build/utils')
const { build, installPlugins, cleanFiles, packWinRelease, deployNightlies } = require('./build')

const packageMeta = require('./package.json')

let poiVersion = null

gulp.task('getVersion', (done) => {
  const package_version = packageMeta.version
  poiVersion = package_version
  childProcess.exec('git rev-parse HEAD', (err, stdout) => {
    if (!err) {
      global.latestCommit = trim(stdout)
    } else {
      console.error(err)
    }
    log(`*** Start building poi ${poiVersion} at ${global.latestCommit} ***`)
    done()
  })
})

gulp.task(
  'build',
  gulp.series('getVersion', () => build(poiVersion)),
)

gulp.task(
  'build_plugins',
  gulp.series('getVersion', () => installPlugins(poiVersion)),
)

gulp.task(
  'pack_win_release',
  gulp.series('getVersion', () => packWinRelease(poiVersion)),
)

gulp.task('deploy_nightlies', () => deployNightlies())

gulp.task('clean', () => cleanFiles())

gulp.task('default', (done) => {
  log`
  Usage:
  gulp deploy          - Make this repo ready to use
  gulp build           - Build release complete packages under ./dist/
  gulp build_plugins   - Pack up latest plugin tarballs under ./dist/

  extra arguments will be passed to npm if it is used
  `
  done()
})
