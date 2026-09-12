const assert = require('assert')
const Promise = require('bluebird')
const CSON = require('cson')
const fs = require('fs-extra')
const { isEqual, last, padStart, size } = require('lodash')
const moment = require('moment')
const path = require('path')

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
  await fs.outputJSON(path.resolve(DEST, fname), data, JSON_OPTIONS)
}

async function readCSON(name) {
  const data = await fs.readFile(name)
  return CSON.parse(data)
}

// `src` is read relative to this directory; `outName` is the file written into
// assets/data/fcd, and defaults to the source's own name with a .json extension.
async function buildData(src, outName = path.basename(src).replace('.cson', '.json')) {
  const dest = path.resolve(DEST, outName)
  const name = outName.replace('.json', '')
  // A data file that has never been built yet has no version to bump from.
  const current = (await fs.readJSON(dest).catch(() => undefined)) || {
    meta: { name, version: '1970/01/01/01' },
  }
  const data = src.endsWith('cson') ? await readCSON(src) : await fs.readJSON(src)
  const meta = getMeta(current, data)
  await writeJSON(outName, { meta, data })
}

// Every built data file belongs in meta.json: it is the index poi and the CDN
// mirrors read to decide what to fetch, so a file left out simply never updates.
async function buildMeta() {
  const flist = (await fs.readdir(DEST)).filter((fname) => fname !== 'meta.json').sort()
  const meta = await Promise.map(flist, async (fname) => {
    const fpath = path.resolve(DEST, fname)
    const data = JSON.parse(await fs.readFile(fpath))
    return data.meta
  })
  await writeJSON('meta.json', meta)
}

const validateShipTag = async () => {
  const file = await fs.readFile('shiptag.cson', 'utf-8')
  const data = CSON.parse(file)

  const count = size(data.mapname)

  assert(count > 0)
  assert(size(data.color) === count)
  assert(size(data.fleetname['zh-CN']) === count)
  assert(size(data.fleetname['zh-TW']) === count)
  assert(size(data.fleetname['ja-JP']) === count)
  assert(size(data.fleetname['en-US']) === count)
}

// quest_goal.cson lives in assets/ because the build bundles it as the fallback
// used when fcd has nothing newer; this only mirrors it into the fcd payload.
const QUEST_GOAL_SRC = '../assets/data/quest_goal.cson'

const validateQuestGoal = async () => {
  const data = await readCSON(QUEST_GOAL_SRC)

  assert(size(data) > 0, 'quest_goal.cson parsed to nothing')

  for (const [id, goal] of Object.entries(data)) {
    assert(/^\d+$/.test(id), `quest id ${id} is not a number`)
    const subgoals = Object.entries(goal).filter(([, value]) => typeof value === 'object')
    assert(subgoals.length > 0, `quest ${id} has no subgoal`)
    for (const [event, subgoal] of subgoals) {
      assert(
        typeof subgoal.required === 'number' && subgoal.required > 0,
        `quest ${id} subgoal ${event} has no required count`,
      )
    }
  }
}

;(async () => {
  await validateShipTag()
  await validateQuestGoal()

  await Promise.all([
    buildData('map.json'),
    buildData('shipavatar.json'),
    buildData('shiptag.cson'),
    buildData(QUEST_GOAL_SRC, 'questgoal.json'),
  ])

  await buildMeta()
})()
