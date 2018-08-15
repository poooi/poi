require('@babel/register')(require('./babel.config'))
const gulp = require('gulp')
const path = require('path')

global.ROOT = __dirname
const SYS_APPDATA_PATH = process.env.APPDATA || (
  process.platform == 'darwin'
    ? path.join(process.env.HOME, 'Library/Application Support')
    : '/var/local')
global.APPDATA_PATH = path.join(SYS_APPDATA_PATH, 'poi')
global.EXROOT = global.APPDATA_PATH

const { log } = require('./lib/utils')
const {
  build,
  installPlugins,
  cleanFiles,
  packWinRelease,
} = require('./build')

const packageMeta = require('./package.json')

let poiVersion = null

gulp.task('getVersion', (done) => {
  const package_version = packageMeta.version
  poiVersion = package_version
  log(`*** Start building poi ${poiVersion} ***`)
  done()
})

gulp.task('deploy', gulp.series('getVersion'))

gulp.task('build', gulp.series('getVersion', () => build(poiVersion)))

gulp.task('build_plugins', gulp.series('getVersion', () => installPlugins(poiVersion)))

gulp.task('pack_win_release', gulp.series('getVersion', () => packWinRelease(poiVersion)))

gulp.task('clean', () => cleanFiles())

gulp.task('default', (done) => {
  const _gulp = 'gulp'
  log("Usage:")
  log(`  ${_gulp} deploy          - Make this repo ready to use`)
  log(`  ${_gulp} build           - Build release complete packages under ./dist/`)
  log(`  ${_gulp} build_plugins   - Pack up latest plugin tarballs under ./dist/`)
  done()
})
