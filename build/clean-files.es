import glob from 'glob'
import _rimraf from 'rimraf'
import { promisify } from 'bluebird'
import path from 'path-extra'

const { ROOT } = global

const rimraf = promisify(_rimraf)

const cleanFiles = () => {
  glob.sync(path.join(ROOT, "build", "!(*.es)")).forEach(file =>
    rimraf(file, () => {}))
  rimraf(path.join(ROOT, 'app_compiled'), () => {})
  rimraf(path.join(ROOT, 'dist'), () => {})
}

export default cleanFiles
