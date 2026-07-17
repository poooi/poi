import { transformFileAsync } from '@babel/core'
import fs from 'fs-extra'
import path from 'path'
import walk from 'walk'

import BabelConfig from '../babel.config'
import { log } from './utils'

const changeExt = (srcPath: string, ext: string) => {
  const srcDir = path.dirname(srcPath)
  const srcBasename = path.basename(srcPath, path.extname(srcPath))
  return path.join(srcDir, srcBasename + ext)
}

const compileToJs = (appDir: string, dontRemove: boolean) => {
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

  return new Promise<void>((resolve) => {
    const tasks: (() => Promise<void>)[] = []
    const walker = walk.walk(appDir, options)
    walker.on('file', (root, fileStats, next) => {
      const extname = path.extname(fileStats.name).toLowerCase()
      if (targetExts.includes(extname)) {
        tasks.push(async () => {
          const srcPath = path.join(root, fileStats.name)
          const tgtPath = changeExt(srcPath, '.js')
          let tgt
          try {
            const result = await transformFileAsync(srcPath, {
              presets,
              plugins,
              assumptions,
              overrides,
            })
            tgt = result?.code
          } catch (e) {
            log(`Compiling ${srcPath} failed: ${e}`)
            log(e instanceof Error ? e.stack : e)
            return
          }
          if (tgt == null) {
            log(`Compiling ${srcPath} produced no output`)
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
    walker.on('end', async () => {
      log(`Files to compile: ${tasks.length} files`)
      await Promise.all(tasks.map((f) => f()))
      resolve()
    })
  })
}

export default compileToJs
