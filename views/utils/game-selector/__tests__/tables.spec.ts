import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { Ship } from 'views/redux/info/ships'

import { indexify } from 'views/utils/tools'

import type { SelectorTables, ShipEntry } from '..'

import {
  ALL_EQUIPS_CATEGORY,
  buildShipList,
  DEFAULT_SELECTOR_TABLES,
  equipTypeForFilter,
  equipTypeSp,
  getSelectorTables,
  mergeSelectorTables,
  pickerEquipType,
  resetSelectorTables,
  setSelectorTables,
  shipFilterTabs,
  typesOfCategory,
} from '..'

const spec = it

const data = require('views/utils/__tests__/fixtures/api_start2.json')
const $equips = indexify<APIMstSlotitem>(data.api_mst_slotitem)

afterEach(resetSelectorTables)

describe('mergeSelectorTables', () => {
  spec('falls back to the built-ins when fcd has delivered nothing', () => {
    expect(mergeSelectorTables(undefined)).toBe(DEFAULT_SELECTOR_TABLES)
  })

  spec('adds the keys the payload carries without discarding the rest', () => {
    const merged = mergeSelectorTables({ equipTypeSpOverrides: { 999: 42 } })
    expect(merged.equipTypeSpOverrides).toEqual({
      ...DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides,
      999: 42,
    })
    // Fields the payload never mentions are the defaults, unchanged
    expect(merged.shipFilterTabs).toBe(DEFAULT_SELECTOR_TABLES.shipFilterTabs)
    expect(merged.filteringDetailCategories).toBe(DEFAULT_SELECTOR_TABLES.filteringDetailCategories)
  })

  spec('backfills fields a payload predating them does not carry', () => {
    // poi only refreshes fcd when the remote version is newer, so a copy
    // cached before `icon` existed can outlive the build that added it.
    const stale = DEFAULT_SELECTOR_TABLES.equipFilterCategories.map(({ id, name, details }) => ({
      id,
      name,
      details,
    }))
    const merged = mergeSelectorTables({ equipFilterCategories: stale })

    expect(merged.equipFilterCategories).toEqual(DEFAULT_SELECTOR_TABLES.equipFilterCategories)
    // Every category but 全装備, which deliberately has none
    merged.equipFilterCategories
      .filter((category) => category.id !== ALL_EQUIPS_CATEGORY)
      .forEach((category) => expect(category.icon).toBeDefined())
  })

  spec('全装備 carries no icon, so nothing is drawn beside it', () => {
    const all = DEFAULT_SELECTOR_TABLES.equipFilterCategories.find(
      (category) => category.id === ALL_EQUIPS_CATEGORY,
    )
    expect(all).toBeDefined()
    expect(all!.icon).toBeUndefined()
  })

  spec('a delivered field still wins over the built-in one', () => {
    const merged = mergeSelectorTables({
      equipFilterCategories: [
        { id: 0, name: 'Renamed', details: [], icon: 99 },
        ...DEFAULT_SELECTOR_TABLES.equipFilterCategories.slice(1),
      ],
    })
    expect(merged.equipFilterCategories[0]).toEqual({
      id: 0,
      name: 'Renamed',
      details: [],
      icon: 99,
    })
  })

  spec('keeps an entry the payload predates rather than dropping it', () => {
    // A payload captured before a tab existed must not remove that tab.
    const withoutLast = DEFAULT_SELECTOR_TABLES.shipFilterTabs.slice(0, -1)
    const merged = mergeSelectorTables({ shipFilterTabs: withoutLast })

    expect(merged.shipFilterTabs).toHaveLength(DEFAULT_SELECTOR_TABLES.shipFilterTabs.length)
    const dropped = DEFAULT_SELECTOR_TABLES.shipFilterTabs.at(-1)!
    expect(merged.shipFilterTabs).toContainEqual(dropped)
  })

  spec('keeps record keys the payload predates', () => {
    const { 128: _newest, ...withoutOne } = DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides
    const merged = mergeSelectorTables({ equipTypeSpOverrides: withoutOne })

    expect(merged.equipTypeSpOverrides).toEqual(DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides)
  })

  spec('a delivered record key still wins over the built-in one', () => {
    const merged = mergeSelectorTables({ equipTypeSpOverrides: { 128: 99 } })

    expect(merged.equipTypeSpOverrides[128]).toBe(99)
    // ...without discarding the keys it did not mention
    expect(merged.equipTypeSpOverrides[151]).toBe(DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides[151])
  })

  spec('an entry with no built-in counterpart passes through as delivered', () => {
    const merged = mergeSelectorTables({
      airbaseFilterTabs: [
        ...DEFAULT_SELECTOR_TABLES.airbaseFilterTabs,
        { id: 9, name: 'New', types: [1], icon: 2 },
      ],
    })
    expect(merged.airbaseFilterTabs).toHaveLength(
      DEFAULT_SELECTOR_TABLES.airbaseFilterTabs.length + 1,
    )
    expect(merged.airbaseFilterTabs[5]).toEqual({ id: 9, name: 'New', types: [1], icon: 2 })
  })

  spec('ignores empty arrays rather than emptying the picker', () => {
    // A truncated or malformed fcd payload must not wipe out the tab strip.
    const merged = mergeSelectorTables({ shipFilterTabs: [], equipFilterCategories: [] })
    expect(merged.shipFilterTabs).toBe(DEFAULT_SELECTOR_TABLES.shipFilterTabs)
    expect(merged.equipFilterCategories).toBe(DEFAULT_SELECTOR_TABLES.equipFilterCategories)
  })
})

describe('fcd-updatable classification', () => {
  spec('a new equipTypeSp override takes effect without touching code', () => {
    const target = Object.values($equips).find(
      ($e) => !(String($e.api_id) in DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides),
    )
    expect(target).toBeDefined()
    const before = equipTypeSp(target!)

    const tables = mergeSelectorTables({
      equipTypeSpOverrides: {
        ...DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides,
        [target!.api_id]: 77,
      },
    })
    expect(equipTypeSp(target!, tables)).toBe(77)
    expect(equipTypeSp(target!)).toBe(before)
  })

  spec('a new icon split takes effect', () => {
    const target = Object.values($equips).find(($e) => $e.api_type?.[2] === 5)
    expect(target).toBeDefined()
    const icon = target!.api_type[3]

    const tables = mergeSelectorTables({
      filterTypeSplits: [
        ...DEFAULT_SELECTOR_TABLES.filterTypeSplits,
        { types: [5], icon, result: 96 },
      ],
    })
    expect(equipTypeForFilter(target!, tables)).toBe(96)
    expect(equipTypeForFilter(target!)).not.toBe(96)
  })

  spec('a new picker-only override takes effect', () => {
    const target = Object.values($equips)[0]
    const tables = mergeSelectorTables({ pickerTypeOverrides: { [target.api_id]: 95 } })
    expect(pickerEquipType(target, tables)).toBe(95)
  })

  spec('a new equipment category becomes reachable', () => {
    const tables = mergeSelectorTables({
      equipFilterCategories: [
        ...DEFAULT_SELECTOR_TABLES.equipFilterCategories,
        { id: 15, name: 'New', details: [901], icon: 1 },
      ],
      filteringDetailCategories: {
        ...DEFAULT_SELECTOR_TABLES.filteringDetailCategories,
        901: [5],
      },
    })
    expect(typesOfCategory(15, tables)).toEqual([5])
    expect(typesOfCategory(15)).toEqual([])
  })

  spec('a new ship type tab filters the roster', () => {
    const shipFixture: {
      body: Ship[]
    } = require('views/redux/info/__tests__/__fixtures__/api_get_member_ship2_full_list.json')
    const $shipsById = indexify<APIMstShip>(data.api_mst_ship)
    const entries: ShipEntry[] = shipFixture.body.flatMap((ship) => {
      const $ship = $shipsById[ship.api_ship_id]
      return $ship ? [{ ship, $ship }] : []
    })

    const tables = mergeSelectorTables({
      shipFilterTabs: [{ id: 0, name: 'Destroyers only', stypes: [2] }],
    })
    // Tab 0 is redefined; the tabs the payload omits keep their defaults.
    expect(shipFilterTabs(tables)[0]).toEqual({ id: 0, name: 'Destroyers only', stypes: [2] })
    expect(shipFilterTabs(tables)).toHaveLength(DEFAULT_SELECTOR_TABLES.shipFilterTabs.length)

    const list = buildShipList(entries, { tabs: [0], tag: 'all', sortKey: 1 }, tables)
    list.forEach((entry) => expect(entry.$ship.api_stype).toBe(2))
    expect(list.length).toBeGreaterThan(0)
  })
})

describe('the module-level registry', () => {
  spec('defaults to the built-in tables', () => {
    expect(getSelectorTables()).toBe(DEFAULT_SELECTOR_TABLES)
  })

  spec('setSelectorTables changes what the default argument resolves to', () => {
    const target = Object.values($equips)[0]
    setSelectorTables({ pickerTypeOverrides: { [target.api_id]: 95 } })
    expect(pickerEquipType(target)).toBe(95)

    resetSelectorTables()
    expect(pickerEquipType(target)).not.toBe(95)
  })
})

describe('the shipped fcd payload', () => {
  const payload: {
    meta: { name: string; version: string }
    data: SelectorTables
  } = require('../../../../assets/data/fcd/gameselector.json')

  spec('is registered in the fcd manifest', () => {
    const meta: {
      name: string
      version: string
    }[] = require('../../../../assets/data/fcd/meta.json')
    const entry = meta.find((m) => m.name === 'gameselector')
    expect(entry).toBeDefined()
    expect(entry!.version).toBe(payload.meta.version)
  })

  spec('matches the built-in defaults, so a fresh install and fcd agree', () => {
    expect(payload.data).toEqual(DEFAULT_SELECTOR_TABLES)
  })
})
