import CSON from 'cson'
import path from 'path'

export interface ThanksToEntry {
  name: string
  link: string
  avatar: string
  description: string
  extraCSS?: React.CSSProperties
}

export interface Constant {
  thanksTo: ThanksToEntry[]
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export default CSON.parseCSONFile(
  path.join(__dirname, '..', 'assets', 'data', 'constant.cson'),
) as Constant
