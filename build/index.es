import path from 'path-extra'
import Promise, { promisify } from 'bluebird'
import fs from 'fs-extra'
import tar from 'tar-fs'
import gitArchive from 'git-archive'
import { log } from '../lib/utils'

import compileToJs from './compile-to-js'
import { runScript, npmInstall, NPM_EXEC_PATH } from './utils'

const { ROOT } = global

export cleanFiles from './clean-files'
export packWinRelease from './pack-win-release'
export installPlugins from './install-plugins'

const TARGET_LIST = [
  // Files
  'app.js',
  'index.html',
  'index-plugin.html',
  'index.js',
  'LICENSE',
  'package.json',
  'babel.config.js',
  'package-lock.json',
  // Folders
  'assets',
  'lib',
  'views',
  'node_modules',
  'i18n',
]

const gitArchiveAndClone = async (tarPath, tgtDir) => {
  log('Archive file from git..')
  try{
    await fs.remove(tarPath)
  } catch (e) {
    console.error(e.stack)
  }
  try {
    await promisify(gitArchive)({
      commit: 'HEAD',
      outputPath: tarPath,
      repoPath: ROOT,
    })
  } catch (e) {
    log(e)
    log("Error on git archive! Probably you haven't installed git or it does not exist in your PATH.")
    process.exit(1)
  }
  log('Archive complete! Extracting...')
  await new Promise((resolve) => {
    fs.createReadStream(tarPath)
      .pipe(tar.extract(tgtDir))
      .on('finish', (e) => {
        log ('Extract complete!')
        resolve(e)
      })
      .on('error', (err) => {
        log(err)
        resolve()
      }
      )})
}

// *** METHODS ***
const filterCopyApp = async (stage1App, stage2App) => Promise.map(TARGET_LIST, target =>
  fs.copy(path.join(stage1App, target), path.join(stage2App, target), {
    overwrite: true,
  })
)

// Build poi for use
export const build = async (poiVersion, dontRemove) => {
  // const BUILD_ROOT = path.join(ROOT, BUILD_DIR_NAME)
  // const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME)
  const BUILDING_ROOT = path.join(ROOT, 'app_compiled')
  const stage1App = path.join(BUILDING_ROOT, 'stage1')
  const tarPath = path.join(stage1App, "app_stage1.tar")
  const stage2App = BUILDING_ROOT

  // Clean files
  try {
    if (!dontRemove) {
      await fs.remove(BUILDING_ROOT)
    }
  } catch (e) {
    console.error(e.stack)
  }
  try {
    await fs.remove(stage1App)
  } catch (e) {
    console.error(e.stack)
  }
  await fs.ensureDir(stage1App)
  await fs.ensureDir(stage2App)
  await fs.ensureDir(path.join(stage1App, 'node_modules'))

  // Stage1: Everything downloaded and translated
  await gitArchiveAndClone(tarPath, stage1App)
  await compileToJs(stage1App, false)
  log('stage 1 finished')

  // Stage2: Filtered copy
  await filterCopyApp(stage1App, stage2App)
  if (!dontRemove){
    await npmInstall(stage2App, ['--only=production'])
    await runScript(NPM_EXEC_PATH, ['dedupe', '--no-package-lock'], {
      cwd: path.join(stage2App, 'node_modules', 'npm'),
    })
  }
  log('stage 2 finished')

  // Clean files

  await fs.remove(stage1App)
  log('file cleaned')

  // Rewrite package.json for build
  const packagePath = path.join(stage2App, 'package.json')
  const packageData = await fs.readJson(packagePath)
  delete packageData.build
  delete packageData.devDependencies
  await fs.remove(packagePath)
  await fs.outputJson(packagePath, packageData)
  log ("Done.")
}

export const compile = async () =>
  await compileToJs(ROOT, true)
