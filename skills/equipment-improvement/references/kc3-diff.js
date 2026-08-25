/* eslint-disable no-console -- reporting the diff is the whole point */
/*
 * Differential check: poi's ★ table vs KC3Kai's Gear.js, over every master
 * slotitem × stat × context × ★. Aim for zero differences except the ones the
 * skill lists as deliberate.
 *
 *   curl -sL https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/library/objects/Gear.js -o <tmp>/Gear.js
 *   cp skills/equipment-improvement/references/kc3-diff.js views/utils/improvement/__tests__/kc3-diff.spec.js
 *   # point GEAR_JS below at the download, then
 *   npx jest views/utils/improvement/__tests__/kc3-diff
 *   rm views/utils/improvement/__tests__/kc3-diff.spec.js
 *
 * It has to run as a jest spec rather than plain node: babel-hook does not
 * resolve the extensionless `./table` import inside the module.
 */
const fs = require('fs')
const vm = require('vm')

const { getImprovementBonus } = require('..')

const GEAR_JS = process.env.GEAR_JS || 'C:/Users/<you>/AppData/Local/Temp/Gear.js'
const master = require('../../__tests__/fixtures/api_start2.json')
const byId = new Map(master.api_mst_slotitem.map((e) => [e.api_id, e]))

// Minimal KC3 runtime: only what the *ImprovementBonus functions touch.
const sandbox = {
  console,
  KC3Master: { slotitem: (id) => byId.get(id) || false },
  KC3Meta: { gearNameById: (id) => String(id) },
  KC3GearBonus: { explicitStatsBonusGears: () => ({}) },
  $: { extend: Object.assign },
}
sandbox.Math = Object.create(Math)
sandbox.Math.qckInt = (fn, value, precision) => {
  const p = Math.pow(10, precision)
  return Math[fn](value * p) / p
}
vm.createContext(sandbox)
// `window.KC3Gear = ...` has to land on the sandbox global itself, or the
// `KC3Gear.prototype...` lines that follow cannot see it
sandbox.window = sandbox
vm.runInContext(fs.readFileSync(GEAR_JS, 'utf8'), sandbox)

const gear = (mstId, stars) =>
  new sandbox.KC3Gear({ api_id: 1, api_slotitem_id: mstId, api_level: stars, api_locked: 0 })

/** poi (stat, context) -> the KC3 method and the type argument it takes */
const CASES = [
  ['power', 'fire', 'attackPowerImprovementBonus', 'fire'],
  ['power', 'torpedo', 'attackPowerImprovementBonus', 'torpedo'],
  ['power', 'yasen', 'attackPowerImprovementBonus', 'yasen'],
  ['power', 'asw', 'attackPowerImprovementBonus', 'asw'],
  ['power', 'airstrike', 'attackPowerImprovementBonus', 'airstrike'],
  ['power', 'exped', 'attackPowerImprovementBonus', 'exped'],
  ['accuracy', 'fire', 'accStatImprovementBonus', 'fire'],
  ['accuracy', 'torpedo', 'accStatImprovementBonus', 'torpedo'],
  ['accuracy', 'yasen', 'accStatImprovementBonus', 'yasen'],
  ['accuracy', 'asw', 'accStatImprovementBonus', 'asw'],
  ['accuracy', 'exped', 'accStatImprovementBonus', 'exped'],
  ['evasion', 'fire', 'evaStatImprovementBonus', 'fire'],
  ['evasion', 'torpedo', 'evaStatImprovementBonus', 'torpedo'],
  ['evasion', 'exped', 'evaStatImprovementBonus', 'exped'],
  ['los', 'fire', 'losStatImprovementBonus', 'fire'],
  ['los', 'exped', 'losStatImprovementBonus', 'exped'],
  ['los', 'contact', 'losStatImprovementBonus', 'contact'],
  ['aa', 'fire', 'aaStatImprovementBonus', 'fire'],
  ['aa', 'exped', 'aaStatImprovementBonus', 'exped'],
]

it('matches KC3Kai', () => {
  const diffs = new Map()
  let compared = 0
  for (const $equip of master.api_mst_slotitem) {
    for (const [stat, context, method, kc3Type] of CASES) {
      for (const stars of [1, 4, 7, 10]) {
        const mine = getImprovementBonus($equip, stars, stat, context)
        const theirs = gear($equip.api_id, stars)[method](kc3Type)
        compared++
        if (Math.abs(mine - theirs) < 1e-9) continue
        const key = `${stat}/${context}`
        if (!diffs.has(key)) diffs.set(key, [])
        diffs.get(key).push({
          id: $equip.api_id,
          name: $equip.api_name,
          t: $equip.api_type[2],
          i: $equip.api_type[3],
          stars,
          mine: Math.round(mine * 1000) / 1000,
          theirs: Math.round(theirs * 1000) / 1000,
        })
      }
    }
  }
  console.log(`compared ${compared} combinations`)
  for (const [key, rows] of diffs) {
    // abyssal equipment (id >= 1500) is never improved; report but do not list
    const player = rows.filter((r) => r.id < 1500)
    const seen = new Set()
    const lines = player
      .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
      .map((r) => `  ${r.id} ${r.name} t${r.t}/i${r.i} ★${r.stars}: poi ${r.mine} kc3 ${r.theirs}`)
    console.log(
      `=== ${key}: ${rows.length} rows, ${rows.length - player.length} abyssal\n${lines.join('\n')}`,
    )
  }
})
