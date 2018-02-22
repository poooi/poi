const Promise = require('bluebird')
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')
const CSON = require('cson')
const { isEqual, last, padStart } = require('lodash')

const DEST = path.resolve(__dirname, '../assets/data/fcd')

// current: currentData in forms of {meta, data}
// next: data part
// if current.data different with next, bump meta's version
const getMeta = (current, next) => {
  if (isEqual(current.data, next)) {
    return current.meta
  }

  const { version } = current.meta
  const today = moment().format('YYYY/MM/DD')

  if (version.slice(0, 10) === today) {
    const v = parseInt(last(version.split('/')), 10) + 1
    return {
      ...current.meta,
      version: `${today}/${padStart(v, 2, '0')}`,
    }
  }

  return {
    ...current.meta,
    version: `${today}/01`,
  }
}

async function writeJSON(fname, data) {
  const JSON_OPTIONS = { spaces: '' }
  await fs.outputJSON(path.join(DEST, fname), data, JSON_OPTIONS)
}

async function CSON2JSON(name) {
  const data = await fs.readFile(`${name}.cson`)
  await writeJSON(`${name}.json`, CSON.parse(data))
}

async function buildData(name) {
  const current = await fs.readJSON(path.join(DEST, name))
  const data = await fs.readJSON(name)
  const meta = getMeta(current, data)
  await writeJSON(name, {meta, data})
}

async function build_meta(flist) {
  const meta = await Promise.map(flist, async (fname) => {
    const fpath = path.join(DEST, fname)
    const data = JSON.parse(await fs.readFile(fpath))
    return data.meta
  })
  await writeJSON('meta.json', meta)
}

(async () => {
  await Promise.all([
    buildData('map.json'),
    buildData('shipavatar.json'),
    CSON2JSON('maphp'),
    CSON2JSON('shiptag'),
  ])

  await build_meta([
    'map.json',
    'shipavatar.json',
    'maphp.json',
    'shiptag.json',
  ].sort())
})()
