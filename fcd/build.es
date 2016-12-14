
import Promise from 'bluebird'
import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import request from 'request'
import CSON from 'cson'
Promise.promisifyAll(fs)
Promise.promisifyAll(path)
Promise.promisifyAll(request)
const DEST = '../assets/data/fcd'

async function writeJSON(fname, data) {
  const JSON_OPTIONS = { spaces: '' }
  await fs.writeJSONAsync(path.join(DEST, fname), data, JSON_OPTIONS)
}

async function CSON2JSON(name) {
  const data = await fs.readFileAsync(`${name}.cson`)
  await writeJSON(`${name}.json`, CSON.parse(data))
}

async function build_map() {
  const data= await fs.readJSONAsync('map.json')
  const meta = {
    name: "map",
    version: "2016/12/14/01",
  }
  await writeJSON('map.json', {meta, data})
}

async function build_meta() {
  const flist = fs.walkSync(DEST)
  const meta = await Promise.all(
    flist.map(async (fpath) => {
      const data = JSON.parse(await fs.readFileAsync(fpath))
      return data.meta
    })
  )
  await writeJSON('meta.json', meta)
}

(async () => {
  fs.emptyDirSync(DEST)

  await Promise.all([
    build_map(),
    CSON2JSON('mapspot'),
    CSON2JSON('maproute'),
    CSON2JSON('maphp'),
    CSON2JSON('shiptag'),
  ])

  await build_meta()
})()
