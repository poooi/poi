import fs from 'fs-extra'
import path from 'path-extra'
import Promise, { promisify } from 'bluebird'
import { log } from '../lib/utils'
import { transformFile } from '@babel/core'
import BabelConfig from '../babel.config'
import walk from 'walk'

const { ROOT } = global

const changeExt = (srcPath, ext) => {
  const srcDir = path.dirname(srcPath)
  const srcBasename = path.basename(srcPath, path.extname(srcPath))
  return path.join(srcDir, srcBasename + ext)
}

const compileToJs = (appDir, dontRemove) => {
  log(`Compiling ${appDir}`)
  const targetExts = ['.es']

  const options = {
    followLinks: false,
    filters: ['node_modules', 'assets', path.join(ROOT, 'components')],
  }

  const { presets, plugins } = BabelConfig

  return new Promise ((resolve) => {
    const tasks = []
    walk.walk(appDir, options)
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
        resolve(await Promise.all(tasks.map(f => f())))
      })
  })
}

export default compileToJs
