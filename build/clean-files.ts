import { globSync } from 'glob'
import path from 'path'
import { rimraf } from 'rimraf'

const { ROOT } = global

const cleanFiles = () => {
  globSync(path.join(ROOT, 'build', '!(*.ts)'), { windowsPathsNoEscape: true }).forEach((file) =>
    rimraf(file),
  )
  rimraf(path.join(ROOT, 'app_compiled'))
  rimraf(path.join(ROOT, 'dist'))
}

export default cleanFiles
