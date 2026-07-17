import Promise, { promisify } from 'bluebird'
import fs from 'fs-extra'
import gitArchive from 'git-archive'
import path from 'path'
import tar from 'tar-fs'

import compileToJs from './compile-to-js'
import { log, npmInstall } from './utils'

const { ROOT } = global

export { default as cleanFiles } from './clean-files'
export { default as packWinRelease } from './pack-win-release'
export { default as installPlugins } from './install-plugins'
export { default as deployNightlies } from './deploy-nightlies'

const TARGET_LIST = [
  // Files
  'app.js',
  'index.html',
  'index-plugin.html',
  'index.js',
  'LICENSE',
  'package.json',
  'babel.config.js',
  'babel-register.config.js',
  'babel-hook.js',
  'package-lock.json',
  '.npmrc',
  // Folders
  'assets',
  'lib',
  'views',
  'node_modules',
  'i18n',
]

const gitArchiveAndClone = async (tarPath: string, tgtDir: string) => {
  log('Archive file from git..')
  try {
    await fs.remove(tarPath)
  } catch (e) {
    console.error(e instanceof Error ? e.stack : e)
  }
  try {
    await promisify(gitArchive)({
      commit: 'HEAD',
      outputPath: tarPath,
      repoPath: ROOT,
    })
  } catch (e) {
    log(e)
    log(
      "Error on git archive! Probably you haven't installed git or it does not exist in your PATH.",
    )
    process.exit(1)
  }
  log('Archive complete! Extracting...')
  await new Promise<void>((resolve) => {
    fs.createReadStream(tarPath)
      .pipe(tar.extract(tgtDir))
      .on('finish', () => {
        log('Extract complete!')
        resolve()
      })
      .on('error', (err) => {
        log(err)
        resolve()
      })
  })
}

// *** METHODS ***
const filterCopyApp = async (stage1App: string, stage2App: string) =>
  Promise.map(TARGET_LIST, (target) =>
    fs.copy(path.join(stage1App, target), path.join(stage2App, target), {
      overwrite: true,
      filter: (src) => ['__tests__', '__mocks__'].every((p) => !src.includes(p)),
    }),
  )

// Build poi for use
export const build = async (poiVersion: string, dontRemove?: boolean) => {
  // const BUILD_ROOT = path.join(ROOT, BUILD_DIR_NAME)
  // const downloadDir = path.join(BUILD_ROOT, DOWNLOADDIR_NAME)
  const BUILDING_ROOT = path.join(ROOT, 'app_compiled')
  const stage1App = path.join(BUILDING_ROOT, 'stage1')
  const tarPath = path.join(stage1App, 'app_stage1.tar')
  const stage2App = BUILDING_ROOT

  // Clean files
  try {
    if (!dontRemove) {
      await fs.remove(BUILDING_ROOT)
    }
  } catch (e) {
    console.error(e instanceof Error ? e.stack : e)
  }
  try {
    await fs.remove(stage1App)
  } catch (e) {
    console.error(e instanceof Error ? e.stack : e)
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
  if (!dontRemove) {
    await npmInstall(stage2App, ['--only=production'])
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
  packageData.latestCommit = global.latestCommit
  await fs.remove(packagePath)
  await fs.outputJson(packagePath, packageData)
  log('Done.')
}

export const compile = async () => await compileToJs(ROOT, true)
