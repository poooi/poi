import CSON from 'cson'
import path from 'path'
export default CSON.parseCSONFile(path.join(__dirname, '..', 'assets', 'data', 'constant.cson'))
