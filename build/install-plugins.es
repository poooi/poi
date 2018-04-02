
import fs from 'fs-extra'
import path from 'path-extra'

import { compress7z, npmInstall, runScript, PLUGIN_JSON_PATH, NPM_EXEC_PATH } from './utils'
import { log } from '../lib/utils'

const { ROOT } = global

const installPluginsTo = async (pluginNames, installRoot, tarRoot) => {
  try{
    await fs.remove(installRoot)
    await fs.remove(tarRoot)
  } catch (e) {
    console.error(e.stack)
  }
  await fs.ensureDir(installRoot)
  await fs.ensureDir(tarRoot)

  // Install plugins
  await npmInstall(installRoot, ['--global-style', '--only=production', '--prefix', '.'].concat(pluginNames), false)

  const pluginDirs = (() =>{
    const dirs = []
    for (const name of pluginNames) {
      const dir = path.join(installRoot, 'node_modules', name)

      // Modify package.json
      const packageJsonPath = path.join(dir, 'package.json')
      const contents = fs.readJsonSync(packageJsonPath)
      // Delete this key, otherwise npm install won't succeed
      delete contents._requiredBy
      delete contents.scripts
      contents.bundledDependencies = Object.keys(contents.dependencies || {})
      fs.writeJsonSync(packageJsonPath, contents)
      dirs.push(dir)
    }
    return dirs
  })()

  log("Now packing plugins into tarballs.")
  await runScript(NPM_EXEC_PATH, ['pack'].concat(pluginDirs), {
    cwd: tarRoot,
  })
}

const installPlugins = async (poiVersion) => {
  const BUILD_ROOT = path.join(ROOT, 'dist')
  const BUILDING_ROOT = path.join(BUILD_ROOT, "plugins")
  const RELEASE_DIR = BUILD_ROOT

  const packages = await fs.readJson(PLUGIN_JSON_PATH)

  const pluginNames = Object.keys(packages)

  const installRoot = path.join(BUILDING_ROOT, 'poi-plugins_install')
  const gzip_root = path.join(BUILDING_ROOT, 'poi-plugins')
  await installPluginsTo(pluginNames, installRoot, gzip_root)

  const d = new Date()
  const str_date = `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`
  const archive_path = path.join(RELEASE_DIR, `poi-plugins_${str_date}.7z`)
  await compress7z (gzip_root, archive_path)

  log(`Successfully built tarballs at ${archive_path}`)
}

export default installPlugins
