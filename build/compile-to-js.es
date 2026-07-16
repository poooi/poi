import { transformFile } from '@babel/core'
import Promise, { promisify } from 'bluebird'
import fs from 'fs-extra'
import path from 'path-extra'
import walk from 'walk'

import BabelConfig from '../babel.config'
import { log } from './utils'

const changeExt = (srcPath, ext) => {
  const srcDir = path.dirname(srcPath)
  const srcBasename = path.basename(srcPath, path.extname(srcPath))
  return path.join(srcDir, srcBasename + ext)
}

const compileToJs = (appDir, dontRemove) => {
  log(`Compiling ${appDir}`)
  const targetExts = ['.es', '.ts', '.tsx']

  const options = {
    followLinks: false,
    filters: ['node_modules', 'assets', '__tests__', '__mocks__'],
  }

  // `overrides` carries the preset-react config (scoped away from plain .ts files).
  // Its external-plugin-files entry never matches here: staged files live under
  // the repo root, which that entry's `test` excludes.
  const { presets, plugins, assumptions, overrides } = BabelConfig

  return new Promise((resolve) => {
    const tasks = []
    walk
      .walk(appDir, options)
      .on('file', (root, fileStats, next) => {
        const extname = path.extname(fileStats.name).toLowerCase()
        if (targetExts.includes(extname)) {
          tasks.push(async () => {
            const srcPath = path.join(root, fileStats.name)
            const tgtPath = changeExt(srcPath, '.js')
            // const src = await fs.readFile(srcPath, 'utf-8')
            let tgt
            try {
              const result = await promisify(transformFile)(srcPath, {
                presets,
                plugins,
                assumptions,
                overrides,
              })
              tgt = result.code
            } catch (e) {
              log(`Compiling ${srcPath} failed: ${e}`)
              log(e.stack)
              return
            }
            await fs.writeFile(tgtPath, tgt)
            if (!dontRemove) {
              await fs.remove(srcPath)
            }
            log(`Compiled ${tgtPath}`)
          })
        }
        next()
      })
      .on('end', async () => {
        log(`Files to compile: ${tasks.length} files`)
        resolve(await Promise.all(tasks.map((f) => f())))
      })
  })
}

export default compileToJs
