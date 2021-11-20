import path from 'path-extra'
import CSON from 'cson'
export default CSON.parseCSONFile(path.join(__dirname, '..', 'assets', 'data', 'constant.cson'))
