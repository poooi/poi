build_all_platforms = ['win32-ia32', 'win32-x64', 'linux-x64', 'darwin-x64']
require('babel-register')(require('./babel.config'))
Promise = require 'bluebird'
async = Promise.coroutine
gulp = require 'gulp'

{log} = require './lib/utils'
{buildAsync, installPluginsAsync, getFlashAsync, getFlashAllAsync, cleanFiles, installThemeAsync, packWinReleaseAsync, compileAsync} = require './build_detail'

package_json = require './package.json'

poi_version = null

gulp.task 'getVersion', ->
  package_version = package_json.version
  poi_version = package_version
  log "*** Start building poi v#{poi_version} ***"

gulp.task 'deploy', ['getVersion', 'get_flash'], async ->
  yield installThemeAsync poi_version

gulp.task 'build', ['getVersion', 'get_flash_all'], async ->
  yield buildAsync poi_version

gulp.task 'get_flash', ['getVersion'], async ->
  yield getFlashAsync poi_version

gulp.task 'get_flash_all', ['getVersion'], async ->
  yield getFlashAllAsync poi_version

gulp.task 'build_plugins', ['getVersion'], async ->
  yield installPluginsAsync poi_version

gulp.task 'pack_win_release', ['getVersion'], async ->
  yield packWinReleaseAsync poi_version

gulp.task 'clean', async ->
  yield cleanFiles()

gulp.task 'default', ->
  _gulp = 'gulp'
  log "Usage:"
  log "  #{_gulp} build         - Build release complete packages under ./dist/"
  log "  #{_gulp} build_plugins - Pack up latest plugin tarballs under ./dist/"
