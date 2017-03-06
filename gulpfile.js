require('coffee-script/register')
require('babel-register')(require('./babel.config'))
const Promise = require('bluebird')
const gulp = require('gulp')

const {log} = require('./lib/utils')
const {buildAsync,
  installPluginsAsync,
  getFlashAsync,
  getFlashAllAsync,
  cleanFiles,
  installThemeAsync,
  packWinReleaseAsync,
  compileAsync} = require('./build_detail')

const package_json = require('./package.json')

const build_all_platforms = ['win32-ia32', 'win32-x64', 'linux-x64', 'darwin-x64']
let poi_version = null

gulp.task('getVersion', () => {
  const package_version = package_json.version
  poi_version = package_version
  log(`*** Start building poi v${poi_version} ***`)
})

gulp.task ('deploy', ['getVersion', 'get_flash'], async() => {
  await installThemeAsync(poi_version)
})

gulp.task ('build', ['getVersion', 'get_flash_all'], async() => {
  await buildAsync(poi_version)
})

gulp.task('get_flash', ['getVersion'], async() => {
  await getFlashAsync(poi_version)
})

gulp.task('get_flash_all', ['getVersion'], async() => {
  await getFlashAllAsync(poi_version)
})

gulp.task('build_plugins', ['getVersion'], async() => {
  await installPluginsAsync(poi_version)
})

gulp.task('pack_win_release', ['getVersion'], async() => {
  await packWinReleaseAsync(poi_version)
})

gulp.task('clean', async () => {
  await cleanFiles()
})

gulp.task('default', () => {
  const _gulp = 'gulp'
  log("Usage:")
  log(`  ${_gulp} build         - Build release complete packages under ./dist/`)
  log(`  ${_gulp} build_plugins - Pack up latest plugin tarballs under ./dist/`)
})
