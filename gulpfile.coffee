electron_version = '0.36.7'
build_all_platforms = ['win32-ia32', 'win32-x64', 'linux-x64', 'darwin-x64']

Promise = require 'bluebird'
async = Promise.coroutine
gulp = require 'gulp'

{log} = require './lib/utils'
{buildLocalAsync, buildAsync, buildAppAsync, cleanTempFiles, installPluginsAsync} = require './build_detail'

package_json = require './package.json'

poi_version = null

gulp.task 'getVersion', ->
  package_version = package_json.version
  poi_version = package_version
  log "*** Start building poi v#{poi_version} ***"

gulp.task 'install', async ->
  yield buildLocalAsync()

gulp.task 'build', ['getVersion'], async ->
  yield buildAsync poi_version, electron_version, build_all_platforms

gulp.task 'build_app', ['getVersion'], async ->
  yield buildAppAsync poi_version

gulp.task 'clean', async ->
  yield cleanTempFiles()

gulp.task 'build_plugins', ['getVersion'], async ->
  yield installPluginsAsync poi_version

gulp.task 'default', ->
  _gulp = 'gulp'
  log "Usage:"
  log "  #{_gulp} install       - Install dependencies to run poi locally"
  log "  #{_gulp} build         - Build release complete packages under ./build/release/"
  log "  #{_gulp} build_app     - Build release app.asar under ./build/release/"
  log "  #{_gulp} build_plugins - Pack up latest plugin tarballs under ./build/release/"
  log "  #{_gulp} clean         - Clean up temporary files. Does not remove release packages"
