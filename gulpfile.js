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
  getFlash,
  getFlashAll,
  cleanFiles,
  packWinRelease,
} = require('./build')

const packageMeta = require('./package.json')

let poiVersion = null

gulp.task('getVersion', () => {
  const package_version = packageMeta.version
  poiVersion = package_version
  log(`*** Start building poi ${poiVersion} ***`)
})

gulp.task('deploy', ['getVersion', 'get_flash'], () => {})

gulp.task('build', ['getVersion', 'get_flash_all'], async() => {
  await build(poiVersion)
})

gulp.task('get_flash', ['getVersion'], async() => {
  await getFlash(poiVersion)
})

gulp.task('get_flash_all', ['getVersion'], async() => {
  await getFlashAll(poiVersion)
})

gulp.task('build_plugins', ['getVersion'], async() => {
  await installPlugins(poiVersion)
})

gulp.task('pack_win_release', ['getVersion'], async() => {
  await packWinRelease(poiVersion)
})

gulp.task('clean', async () => {
  await cleanFiles()
})

gulp.task('default', () => {
  const _gulp = 'gulp'
  log("Usage:")
  log(`  ${_gulp} deploy          - Make this repo ready to use`)
  log(`  ${_gulp} build           - Build release complete packages under ./dist/`)
  log(`  ${_gulp} build_plugins   - Pack up latest plugin tarballs under ./dist/`)
})
