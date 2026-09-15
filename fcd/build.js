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

// Inputs are resolved from this directory, not the process working directory, so
// `node fcd/build.js` works from the repo root as well as from `fcd/`.
const src = (name) => path.resolve(__dirname, name)

async function readCSON(name) {
  const data = await fs.readFile(src(name))
  return CSON.parse(data)
}

// Writes `data` as assets/data/fcd/<outName>, bumping the version only when it changed.
async function buildPayload(outName, data) {
  const dest = path.resolve(DEST, outName)
  const name = outName.replace('.json', '')
  // A data file that has never been built yet has no version to bump from.
  const current = (await fs.readJSON(dest).catch(() => undefined)) || {
    meta: { name, version: '1970/01/01/01' },
  }
  await writeJSON(outName, { meta: getMeta(current, data), data })
}

// `source` is resolved from this directory; `outName` defaults to its own name as .json.
async function buildData(source, outName = path.basename(source).replace('.cson', '.json')) {
  const data = source.endsWith('cson') ? await readCSON(source) : await fs.readJSON(src(source))
  await buildPayload(outName, data)
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
  const file = await fs.readFile(src('shiptag.cson'), 'utf-8')
  const data = CSON.parse(file)

  const count = size(data.mapname)

  assert(count > 0)
  assert(size(data.color) === count)
  assert(size(data.fleetname['zh-CN']) === count)
  assert(size(data.fleetname['zh-TW']) === count)
  assert(size(data.fleetname['ja-JP']) === count)
  assert(size(data.fleetname['en-US']) === count)
}

// Quest goals are edited as one file per period in assets/data/quest_goal/ and merged
// here, so the fcd payload stays a single questgoal.json.
const QUEST_GOAL_DIR = '../assets/data/quest_goal'

// The file a quest sits in names its period, so it has to agree with the `type` that
// drives record resets — quest 242 once sat among the weeklies with a monthly type.
// `null` accepts any type; `false` rejects the name, so new files are added on purpose.
const expectedTypes = (file) => {
  const fixed = { 'daily.cson': [1, 8, 9], 'weekly.cson': [2], 'monthly.cson': [3] }
  if (fixed[file]) return fixed[file]
  if (file === 'quarterly.cson') return [4]
  const yearly = /^yearly-(0[1-9]|1[0-2])\.cson$/.exec(file)
  if (yearly) return [100 + Number(yearly[1])]
  // one-time quests never repeat, so they carry no type at all
  if (/^one-time(-[a-z0-9-]+)?\.cson$/.test(file)) return [undefined]
  // limited-time quests keep whatever period the game gives them
  if (file === 'limited-time.cson') return null
  return false
}

const readQuestGoals = async () => {
  const files = (await fs.readdir(src(QUEST_GOAL_DIR))).filter((f) => f.endsWith('.cson')).sort()
  assert(files.length > 0, `no quest goal files in ${QUEST_GOAL_DIR}`)
  const merged = {}
  for (const file of files) {
    const expected = expectedTypes(file)
    assert(expected !== false, `${file}: not a recognised quest goal file name`)
    const data = await readCSON(path.join(QUEST_GOAL_DIR, file))
    assert(data && !(data instanceof Error) && typeof data === 'object', `${file} did not parse`)
    for (const [id, goal] of Object.entries(data)) {
      assert(!(id in merged), `quest ${id} is defined twice (again in ${file})`)
      if (expected) {
        assert(expected.includes(goal.type), `quest ${id} in ${file} has type ${goal.type}`)
      }
      merged[id] = goal
    }
  }
  return merged
}

const validateQuestGoal = (data) => {
  assert(size(data) > 0, 'quest goals parsed to nothing')
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
  const questGoals = await readQuestGoals()
  validateQuestGoal(questGoals)

  await Promise.all([
    buildData('map.json'),
    buildData('shipavatar.json'),
    buildData('shiptag.cson'),
    buildPayload('questgoal.json', questGoals),
  ])

  await buildMeta()
})()
