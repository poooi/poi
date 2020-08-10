import glob from 'glob'
import Promise from 'bluebird'
import path from 'path'
import child_process from 'child_process'

import { log } from '../lib/utils'

const runShell = (scriptPath, args, options) =>
  new Promise((resolve, reject) => {
    const proc = child_process.spawn(scriptPath, args, options)

    proc.stdout.on('data', (data) => {
      log(`stdout: ${data}`)
    })

    proc.stderr.on('data', (data) => {
      log(`stderr: ${data}`)
    })
    proc.on('exit', (code) => {
      if (code > 0) {
        reject(new Error('deploy fails'))
      } else {
        resolve()
      }
    })
  })

const deployNightlies = async () => {
  const { ROOT } = global
  const { TRAVIS_BUILD_NUMBER } = process.env

  const files = glob.sync(path.join(ROOT, 'dist', '*.{dmg,7z,yml}'))
  if (!TRAVIS_BUILD_NUMBER) {
    return Promise.reject(new Error('nightly deployment only runs on ci mode'))
  }

  await Promise.each(files, async (file) => {
    await runShell('rsync', [
      '-r',
      '-q',
      file,
      `poi@citrus.dazzyd.org:/data/nightly/${TRAVIS_BUILD_NUMBER}/`,
    ])
    log(`deployed nightly file ${path.basename(file)}`)
  })

  log(`deploy complete for build ${TRAVIS_BUILD_NUMBER}`)
}

export default deployNightlies
