// Run as `babel --presets=es2017-node7 build.es | node`

import Promise from 'bluebird'
import fs from 'fs-extra'
import path from 'path'
import moment from 'moment'
import request from 'request'
import CSON from 'cson'
Promise.promisifyAll(path)
Promise.promisifyAll(request)
const DEST = '../assets/data/fcd'

const mapVersion = process.env.MAPVERSION

async function writeJSON(fname, data) {
  const JSON_OPTIONS = { spaces: '' }
  await fs.outputJSON(path.join(DEST, fname), data, JSON_OPTIONS)
}

async function CSON2JSON(name) {
  const data = await fs.readFile(`${name}.cson`)
  await writeJSON(`${name}.json`, CSON.parse(data))
}

async function build_map() {
  const data = await fs.readJSON('map.json')
  const stat = fs.statSync('map.json')
  const date = moment(stat.mtime).format('YYYY/MM/DD')
  const meta = {
    name: "map",
    version: mapVersion || `${date}/01`,
  }
  await writeJSON('map.json', {meta, data})
}

async function build_meta() {
  const flist = fs.readdirSync(DEST)
  const meta = await Promise.all(
    flist.map(async (fname) => {
      const fpath = path.join(DEST, fname)
      const data = JSON.parse(await fs.readFile(fpath))
      return data.meta
    })
  )
  await writeJSON('meta.json', meta)
}

(async () => {
  fs.emptyDirSync(DEST)

  await Promise.all([
    build_map(),
    CSON2JSON('maphp'),
    CSON2JSON('shiptag'),
  ])

  await build_meta()
})()
