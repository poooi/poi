import glob from 'glob'
import path from 'path-extra'
import { rimraf } from 'rimraf'

const { ROOT } = global

const cleanFiles = () => {
  glob.sync(path.join(ROOT, 'build', '!(*.es)')).forEach((file) => rimraf(file))
  rimraf(path.join(ROOT, 'app_compiled'))
  rimraf(path.join(ROOT, 'dist'))
}

export default cleanFiles
