import type { APIMstShip, APIMstSlotitem, APIMstStype } from 'kcsapi/api_start2/getData/response'

import { indexify } from 'views/utils/tools'

import {
  DEFAULT_SELECTOR_TABLES,
  equipTypeForFilter,
  equipTypeSp,
  pickerEquipType,
  typesOfCategory,
} from '..'

/**
 * Drift guards for the tables ported out of the game's `main.js`.
 *
 * Those tables are hardcoded in the bundle, so they can change whenever the
 * game ships a new ship type, equipment type, or special-cased item — and
 * nothing in the API announces it. These tests fail when the master data starts
 * producing something the ported tables cannot account for, which is the signal
 * to re-read the corresponding module in `kc-main-js-explode`.
 *
 * They are only as fresh as the fixture: refresh
 * `views/utils/__tests__/fixtures/api_start2.json` from a recent capture to
 * make them meaningful again after a game update.
 */

const spec = it

const data = require('views/utils/__tests__/fixtures/api_start2.json')
const $ships = indexify<APIMstShip>(data.api_mst_ship)
const $shipTypes = indexify<APIMstStype>(data.api_mst_stype)
const $equips = indexify<APIMstSlotitem>(data.api_mst_slotitem)

describe('ship filter tabs vs master data', () => {
  spec('every ship type in the master data belongs to a tab', () => {
    const tabbed = new Set(DEFAULT_SELECTOR_TABLES.shipFilterTabs.flatMap((tab) => tab.stypes))
    const uncovered = [...new Set(Object.values($ships).map(($ship) => $ship.api_stype))]
      .filter((stype) => stype && !tabbed.has(stype))
      .sort((a, b) => a - b)

    // A new ship type means ShipUtil.filterByShipFilterType gained a branch.
    expect(uncovered.map((stype) => `${stype} (${$shipTypes[stype]?.api_name ?? '?'})`)).toEqual([])
  })

  spec('no tab lists a ship type the master data has dropped', () => {
    const known = new Set(Object.values($shipTypes).map(($stype) => $stype.api_id))
    DEFAULT_SELECTOR_TABLES.shipFilterTabs.forEach(({ name, stypes }) => {
      stypes.forEach((stype) => {
        expect({ tab: name, stype, known: known.has(stype) }).toEqual({
          tab: name,
          stype,
          known: true,
        })
      })
    })
  })
})

describe('equipment categories vs master data', () => {
  spec('every equipment the picker can classify is reachable from a tab', () => {
    const reachable = new Set(
      DEFAULT_SELECTOR_TABLES.equipFilterCategories
        .filter((c) => c.id !== 0)
        .flatMap((c) => typesOfCategory(c.id)),
    )
    const uncovered = new Map<number, string>()
    Object.values($equips).forEach(($equip) => {
      const type = equipTypeForFilter($equip)
      if (!reachable.has(type)) uncovered.set(type, `${$equip.api_id}:${$equip.api_name}`)
    })

    // A miss here means SlotConst's category tables gained an entry.
    expect([...uncovered.entries()].map(([type, sample]) => `${type} e.g. ${sample}`)).toEqual([])
  })

  spec('every category references a detail category that exists', () => {
    DEFAULT_SELECTOR_TABLES.equipFilterCategories.forEach(({ name, details }) => {
      details.forEach((detail) => {
        expect({
          category: name,
          detail,
          defined: detail in DEFAULT_SELECTOR_TABLES.filteringDetailCategories,
        }).toEqual({
          category: name,
          detail,
          defined: true,
        })
      })
    })
  })
})

describe('land base tabs vs master data', () => {
  spec('every plane a land base can carry is reachable from a tab', () => {
    // getEquipTypes gained a branch if something here is uncovered. Restricted
    // to types the airbase tabs already claim, so ship-only gear is ignored.
    const reachable = new Set(DEFAULT_SELECTOR_TABLES.airbaseFilterTabs.flatMap((tab) => tab.types))
    const carrierOrLandPlane = [6, 7, 8, 9, 10, 11, 25, 26, 41, 45, 47, 48, 49, 53, 56, 57, 58, 59]
    const uncovered = new Map<number, string>()

    Object.values($equips).forEach(($equip) => {
      const type = equipTypeSp($equip)
      if (carrierOrLandPlane.includes(type) && !reachable.has(type)) {
        uncovered.set(type, `${$equip.api_id}:${$equip.api_name}`)
      }
    })
    expect([...uncovered.entries()].map(([type, sample]) => `${type} e.g. ${sample}`)).toEqual([])
  })

  // No assertion the other way: the game's tables legitimately name types no
  // item carries yet (as the ship tabs do for stype 12), so an unused entry is
  // not drift.
})

describe('special-cased master ids', () => {
  // main.js reclassifies these by hardcoded id. If one is retired or renumbered
  // the override silently stops applying, so assert they still exist.
  const OVERRIDDEN: [number, number][] = [
    [128, 38],
    [281, 38],
    [465, 38],
    [142, 93],
    [460, 93],
    [151, 94],
    [561, 91],
  ]

  OVERRIDDEN.forEach(([mstId, expected]) => {
    spec(`master item ${mstId} still exists and maps to type ${expected}`, () => {
      const $equip = $equips[mstId]
      expect($equip).toBeDefined()
      expect(equipTypeSp($equip)).toBe(expected)
    })
  })

  spec('the picker-only override for master id 467 still applies', () => {
    const $equip = $equips[467]
    expect($equip).toBeDefined()
    expect(pickerEquipType($equip)).toBe(95)
  })

  spec('no other master item already claims a synthetic type', () => {
    // Types 81-95 exist only as derived values; if one shows up as a raw
    // api_type[2] the derivation rules have been superseded.
    const raw = Object.values($equips).filter(($equip) => {
      const type = $equip.api_type?.[2]
      return typeof type === 'number' && type >= 81
    })
    expect(raw.map(($equip) => `${$equip.api_id}:${$equip.api_name}`)).toEqual([])
  })
})

describe('per-slot exclusions vs master data', () => {
  // `SlotUtil.excludeEquipList` keys off master ship ids, so a renumbered or
  // retired remodel would leave the rule pointing at nothing.
  spec('every ship named by a rule still exists', () => {
    const missing = DEFAULT_SELECTOR_TABLES.slotExclusions.flatMap((rule) =>
      rule.shipMstIds.filter((id) => !$ships[id]),
    )
    expect(missing).toEqual([])
  })

  spec('no rule points past the ship it applies to', () => {
    // A rule that names slot n needs the ship to actually have slot n. The
    // "from this slot onwards" rules only need the first one to exist.
    const overshot = DEFAULT_SELECTOR_TABLES.slotExclusions.flatMap((rule) =>
      rule.shipMstIds
        .filter(($id) => ($ships[$id]?.api_slot_num ?? 0) <= rule.slot)
        .map(($id) => `${$id}@${rule.slot}`),
    )
    expect(overshot).toEqual([])
  })

  spec('every excluded type is one the game still defines', () => {
    const known = new Set(
      Object.values($equips).flatMap(($equip) => {
        const type = $equip.api_type?.[2]
        return typeof type === 'number' ? [type] : []
      }),
    )
    const unknown = DEFAULT_SELECTOR_TABLES.slotExclusions.flatMap((rule) =>
      [...(rule.exclude ?? []), ...(rule.allowOnly ?? [])].filter((type) => !known.has(type)),
    )
    expect(unknown).toEqual([])
  })
})
