require('coffee-script/register')
require('babel-register')(require('./babel.config'))
const gulp = require('gulp')
const argv = require('yargs').argv

const {log} = require('./lib/utils')
const { buildAsync,
  installPluginsAsync,
  getFlashAsync,
  getFlashAllAsync,
  cleanFiles,
  installThemeAsync,
  packWinReleaseAsync,
  compileToJsAsync } = require('./build_detail')

const package_json = require('./package.json')

let poiVersion = null

gulp.task('getVersion', () => {
  const package_version = package_json.version
  poiVersion = package_version
  log(`*** Start building poi v${poiVersion} ***`)
})

gulp.task ('deploy', ['getVersion', 'get_flash'], async() => {
  await installThemeAsync(poiVersion)
})

gulp.task ('build', ['getVersion', 'get_flash_all'], async() => {
  await buildAsync(poiVersion)
})

gulp.task('get_flash', ['getVersion'], async() => {
  await getFlashAsync(poiVersion)
})

gulp.task('get_flash_all', ['getVersion'], async() => {
  await getFlashAllAsync(poiVersion)
})

gulp.task('build_plugins', ['getVersion'], async() => {
  await installPluginsAsync(poiVersion)
})

gulp.task('pack_win_release', ['getVersion'], async() => {
  await packWinReleaseAsync(poiVersion)
})

gulp.task('complie_plugin', async() => {
  if (argv.path) {
    await compileToJsAsync(argv.path, true)
  } else {
    log('Please specify plugin\'s path by --path parameter')
  }
})

gulp.task('clean', async () => {
  await cleanFiles()
})

gulp.task('default', () => {
  const _gulp = 'gulp'
  log("Usage:")
  log(`  ${_gulp} deploy          - Make this repo ready to use`)
  log(`  ${_gulp} complie_plugins - Precomplie plugin's es6+ codes`)
  log(`  ${_gulp} build           - Build release complete packages under ./dist/`)
  log(`  ${_gulp} build_plugins   - Pack up latest plugin tarballs under ./dist/`)
})
