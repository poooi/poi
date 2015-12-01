electron_version = '0.35.2'
build_all_platforms = [['win32', 'ia32'], ['win32', 'x64'], ['linux', 'x64']]

Promise = require 'bluebird'
async = Promise.coroutine
gulp = require 'gulp'

{log} = require './lib/utils'
{buildLocalAsync, buildAsync, cleanTempFiles} = require './build_detail'

package_json = require './package.json'
bower_json = require './bower.json'

poi_version = null

gulp.task 'getVersion', ->
  package_version = package_json.version
  bower_version = bower_json.version
  poi_version = package_version
  log "*** Start building poi v#{poi_version} with electron v#{electron_version} ***"
  if package_version != bower_version
    log "WARNING: package.json has version #{package_version} while bower.json has version #{bower_version}"

gulp.task 'install', async ->
  yield buildLocalAsync()

gulp.task 'build', ['getVersion'], async ->
  yield buildAsync poi_version, electron_version, build_all_platforms

gulp.task 'clean', async ->
  yield cleanTempFiles()

gulp.task 'default', ->
  gulp_command = 'gulp'
  log "Usage:"
  log "  #{gulp_command} install - Install dependencies to run poi locally"
  log "  #{gulp_command} build   - Build release packages under ./build/release/"
  log "  #{gulp_command} clean   - Clean up temporary files except for release packages"
