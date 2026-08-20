import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { Equip } from 'views/redux/info/equips'
import type { MapInfo } from 'views/redux/info/maps'
import type { Ship } from 'views/redux/info/ships'

import { indexify } from 'views/utils/tools'

import {
  DEFAULT_SELECTOR_TABLES,
  ALL_EQUIPS_CATEGORY,
  allShipTabIds,
  buildEquipList,
  buildEquipLists,
  buildShipList,
  compareEquips,
  compareShips,
  equipListPositions,
  equipPositions,
  equipTypeForFilter,
  equipTypeSp,
  isEventActive,
  worldOf,
  positionOf,
  ROWS_PER_PAGE,
  SHIP_SORT_KEYS,
  shipPositions,
  sortShips,
  typesOfCategory,
  type EquipEntry,
  type EquipFilter,
  type ShipEntry,
  type ShipFilter,
} from '..'

const spec = it

const masterData = require('views/utils/__tests__/fixtures/api_start2.json')
const $ships = indexify<APIMstShip>(masterData.api_mst_ship)
const $equips = indexify<APIMstSlotitem>(masterData.api_mst_slotitem)

// Real roster captures, so the ordering runs against the mix of levels,
// duplicate ships and improvement levels an actual account has.
const shipFixture: {
  body: Ship[]
} = require('views/redux/info/__tests__/__fixtures__/api_get_member_ship2_full_list.json')
const equipFixture: {
  body: Equip[]
} = require('views/redux/info/__tests__/__fixtures__/api_get_member_slot_item_large_snapshot.json')

const allShipEntries: ShipEntry[] = shipFixture.body.flatMap((ship) => {
  const $ship = $ships[ship.api_ship_id]
  return $ship ? [{ ship, $ship }] : []
})

const allEquipEntries: EquipEntry[] = equipFixture.body.flatMap((equip) => {
  const $equip = $equips[equip.api_slotitem_id]
  return $equip ? [{ equip, $equip }] : []
})

/**
 * Equipment roster id → carrying ship roster id, derived from the same fixture
 * roster, so the 未装備 / 他艦娘装備中 split runs on a real loadout.
 */
const equippedOn = new Map<number, number>()
shipFixture.body.forEach((ship) => {
  ;[...(ship.api_slot ?? []), ship.api_slot_ex ?? -1].forEach((equipId) => {
    if (typeof equipId === 'number' && equipId > 0) equippedOn.set(equipId, ship.api_id)
  })
})

const entriesWithEquipState: EquipEntry[] = allEquipEntries.map((entry) => ({
  ...entry,
  equippedOn: equippedOn.get(entry.equip.api_id),
}))

const shipFilter = (overrides: Partial<ShipFilter> = {}): ShipFilter => ({
  tabs: allShipTabIds(),
  tag: 'all',
  sortKey: 1,
  ...overrides,
})

const equipFilter = (overrides: Partial<EquipFilter> = {}): EquipFilter => ({
  category: ALL_EQUIPS_CATEGORY,
  ...overrides,
})

/** Asserts the list is ordered by the same comparator that produced it. */
const assertOrdered = <T>(list: T[], compare: (a: T, b: T) => number) => {
  for (let i = 1; i < list.length; i++) {
    expect(compare(list[i - 1], list[i])).toBeLessThanOrEqual(0)
  }
}

describe('fixtures', () => {
  spec('join against master data', () => {
    expect(allShipEntries.length).toBeGreaterThan(100)
    expect(allEquipEntries.length).toBeGreaterThan(100)
  })
})

describe('positionOf', () => {
  spec('maps offsets onto 1-based page and row', () => {
    expect(positionOf(0)).toEqual({ page: 1, index: 1, offset: 0 })
    expect(positionOf(ROWS_PER_PAGE - 1)).toEqual({
      page: 1,
      index: ROWS_PER_PAGE,
      offset: ROWS_PER_PAGE - 1,
    })
    expect(positionOf(ROWS_PER_PAGE)).toEqual({ page: 2, index: 1, offset: ROWS_PER_PAGE })
    expect(positionOf(ROWS_PER_PAGE * 3 + 4)).toEqual({
      page: 4,
      index: 5,
      offset: ROWS_PER_PAGE * 3 + 4,
    })
  })
})

describe('ship filter tabs', () => {
  spec('there are eight, matching filterByShipFilterType', () => {
    expect(DEFAULT_SELECTOR_TABLES.shipFilterTabs).toHaveLength(8)
    expect(allShipTabIds()).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  spec('every stype belongs to exactly one tab', () => {
    const seen = new Set<number>()
    DEFAULT_SELECTOR_TABLES.shipFilterTabs.forEach(({ stypes }) => {
      stypes.forEach((stype) => {
        expect(seen.has(stype)).toBe(false)
        seen.add(stype)
      })
    })
    // stypes 1..22, with 11 and 18 among them
    expect(seen.size).toBe(22)
  })

  spec('all tabs enabled keeps the whole roster', () => {
    expect(buildShipList(allShipEntries, shipFilter())).toHaveLength(allShipEntries.length)
  })

  spec('no tab enabled yields nothing', () => {
    expect(buildShipList(allShipEntries, shipFilter({ tabs: [] }))).toHaveLength(0)
  })

  spec('tabs are multi-selectable and union their ship types', () => {
    const destroyers = buildShipList(allShipEntries, shipFilter({ tabs: [4] }))
    const escorts = buildShipList(allShipEntries, shipFilter({ tabs: [5] }))
    const both = buildShipList(allShipEntries, shipFilter({ tabs: [4, 5] }))

    expect(destroyers.length).toBeGreaterThan(0)
    expect(escorts.length).toBeGreaterThan(0)
    expect(both).toHaveLength(destroyers.length + escorts.length)

    const ids = new Set(both.map((e) => e.ship.api_id))
    destroyers.forEach((e) => expect(ids.has(e.ship.api_id)).toBe(true))
    escorts.forEach((e) => expect(ids.has(e.ship.api_id)).toBe(true))
  })

  spec('each tab yields only its own ship types', () => {
    DEFAULT_SELECTOR_TABLES.shipFilterTabs.forEach(({ id, stypes }) => {
      buildShipList(allShipEntries, shipFilter({ tabs: [id] })).forEach((entry) =>
        expect(stypes).toContain(entry.$ship.api_stype),
      )
    })
  })

  spec('the tag filter partitions the roster', () => {
    const tagged = buildShipList(allShipEntries, shipFilter({ tag: 'tagged' }))
    const untagged = buildShipList(allShipEntries, shipFilter({ tag: 'untagged' }))
    expect(tagged.length + untagged.length).toBe(allShipEntries.length)
    tagged.forEach((e) => expect(e.ship.api_sally_area ?? 0).not.toBe(0))
    untagged.forEach((e) => expect(e.ship.api_sally_area ?? 0).toBe(0))
  })
})

describe('ship sort keys', () => {
  spec('the picker cycles through six keys with no direction toggle', () => {
    expect(SHIP_SORT_KEYS).toEqual([1, 2, 3, 4, 5, 6])
  })

  spec('every key produces a self-consistent total order', () => {
    SHIP_SORT_KEYS.forEach((key) => {
      const list = sortShips(allShipEntries, key)
      assertOrdered(list, (a, b) => compareShips(a, b, key))
    })
  })

  spec('key 1 (Lv) is level descending, then sort index and roster id ascending', () => {
    const list = sortShips(allShipEntries, 1)
    const levels = list.map((e) => e.ship.api_lv ?? 0)
    expect(levels).toEqual([...levels].sort((a, b) => b - a))

    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const curr = list[i]
      if ((prev.ship.api_lv ?? 0) !== (curr.ship.api_lv ?? 0)) continue
      if (prev.$ship.api_sort_id !== curr.$ship.api_sort_id) {
        expect(prev.$ship.api_sort_id).toBeLessThan(curr.$ship.api_sort_id)
      } else {
        expect(prev.ship.api_id).toBeLessThan(curr.ship.api_id)
      }
    }
  })

  spec('key 2 (艦種) is sort index ascending, then level descending', () => {
    const list = sortShips(allShipEntries, 2)
    const sortIds = list.map((e) => e.$ship.api_sort_id)
    expect(sortIds).toEqual([...sortIds].sort((a, b) => a - b))

    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const curr = list[i]
      if (prev.$ship.api_sort_id !== curr.$ship.api_sort_id) continue
      expect(prev.ship.api_lv ?? 0).toBeGreaterThanOrEqual(curr.ship.api_lv ?? 0)
    }
  })

  spec('key 3 (新着) is newest roster id first', () => {
    const ids = sortShips(allShipEntries, 3).map((e) => e.ship.api_id)
    expect(ids).toEqual([...ids].sort((a, b) => b - a))
  })

  spec('key 4 (損傷) puts the most damaged first', () => {
    const list = sortShips(allShipEntries, 4)
    const ratios = list.map((e) => (e.ship.api_nowhp ?? 0) / (e.ship.api_maxhp ?? 1))
    expect(ratios).toEqual([...ratios].sort((a, b) => a - b))
  })

  spec('key 5 (修復) puts the longest repair first', () => {
    const times = sortShips(allShipEntries, 5).map((e) => e.ship.api_ndock_time ?? 0)
    expect(times).toEqual([...times].sort((a, b) => b - a))
  })

  spec('key 6 (疲労) puts the highest condition first', () => {
    const conds = sortShips(allShipEntries, 6).map((e) => e.ship.api_cond ?? 0)
    expect(conds).toEqual([...conds].sort((a, b) => b - a))
  })

  spec('key 0 is the mirror of key 1', () => {
    const ascending = sortShips(allShipEntries, 0).map((e) => e.ship.api_id)
    const descending = sortShips(allShipEntries, 1).map((e) => e.ship.api_id)
    expect(ascending).toEqual([...descending].reverse())
  })
})

describe('ship positions', () => {
  spec('reports the page and row of every ship in the list', () => {
    const list = buildShipList(allShipEntries, shipFilter())
    const positions = shipPositions(list)

    expect(positions.size).toBe(list.length)
    expect(positions.get(list[0].ship.api_id)).toEqual({ page: 1, index: 1, offset: 0 })
    expect(positions.get(list[ROWS_PER_PAGE].ship.api_id)).toEqual({
      page: 2,
      index: 1,
      offset: ROWS_PER_PAGE,
    })
    const last = list.length - 1
    expect(positions.get(list[last].ship.api_id)).toEqual({
      page: Math.floor(last / ROWS_PER_PAGE) + 1,
      index: (last % ROWS_PER_PAGE) + 1,
      offset: last,
    })
  })

  spec('positions shift when the tabs narrow the list', () => {
    const target = allShipEntries.find((e) => e.$ship.api_stype === 2)
    expect(target).toBeDefined()
    const id = target!.ship.api_id

    const all = shipPositions(buildShipList(allShipEntries, shipFilter()))
    const tab = shipPositions(buildShipList(allShipEntries, shipFilter({ tabs: [4] })))

    expect(all.get(id)).toBeDefined()
    expect(tab.get(id)!.offset).toBeLessThanOrEqual(all.get(id)!.offset)
  })
})

describe('equip classification', () => {
  spec('equipTypeSp reclassifies only the overridden master ids', () => {
    const overridden: Record<number, number> = { 128: 38, 281: 38, 142: 93, 151: 94, 561: 91 }
    Object.entries(overridden).forEach(([mstId, expected]) => {
      const $equip = $equips[Number(mstId)]
      if (!$equip) return
      expect(equipTypeSp($equip)).toBe(expected)
    })
  })

  spec('equipTypeForFilter splits night-capable planes off by icon', () => {
    // A carrier fighter (type 6) with icon 45 is the night-fighter variant.
    const nightFighter = Object.values($equips).find(
      ($equip) => $equip.api_type?.[2] === 6 && $equip.api_type?.[3] === 45,
    )
    if (nightFighter) expect(equipTypeForFilter(nightFighter)).toBe(82)

    const dayFighter = Object.values($equips).find(
      ($equip) => $equip.api_type?.[2] === 6 && $equip.api_type?.[3] !== 45,
    )
    if (dayFighter) expect(equipTypeForFilter(dayFighter)).toBe(6)
  })

  spec('a main gun with the AA icon becomes 高角砲', () => {
    const highAngle = Object.values($equips).find(
      ($equip) => [1, 2, 3, 4].includes($equip.api_type?.[2]) && $equip.api_type?.[3] === 16,
    )
    if (highAngle) expect(equipTypeForFilter(highAngle)).toBe(81)
  })
})

describe('equip filter categories', () => {
  spec('category 0 accepts everything', () => {
    expect(buildEquipList(allEquipEntries, equipFilter())).toHaveLength(allEquipEntries.length)
  })

  spec('every detail category is reachable from exactly one tab', () => {
    const seen = new Set<number>()
    DEFAULT_SELECTOR_TABLES.equipFilterCategories.forEach(({ details }) => {
      details.forEach((detail) => {
        expect(seen.has(detail)).toBe(false)
        expect(DEFAULT_SELECTOR_TABLES.filteringDetailCategories[detail]).toBeDefined()
        seen.add(detail)
      })
    })
    expect(seen.size).toBe(Object.keys(DEFAULT_SELECTOR_TABLES.filteringDetailCategories).length)
  })

  spec('a tab accepts only the types its detail categories list', () => {
    DEFAULT_SELECTOR_TABLES.equipFilterCategories
      .filter((c) => c.id !== 0)
      .forEach(({ id }) => {
        const accepted = new Set(typesOfCategory(id))
        buildEquipList(allEquipEntries, equipFilter({ category: id })).forEach((entry) =>
          expect(accepted.has(equipTypeForFilter(entry.$equip))).toBe(true),
        )
      })
  })

  spec('the tabs together cover every owned equipment', () => {
    const covered = DEFAULT_SELECTOR_TABLES.equipFilterCategories
      .filter((c) => c.id !== 0)
      .reduce(
        (sum, { id }) =>
          sum + buildEquipList(allEquipEntries, equipFilter({ category: id })).length,
        0,
      )
    expect(covered).toBe(allEquipEntries.length)
  })

  spec('a detail category narrows within its tab', () => {
    const tab = buildEquipList(allEquipEntries, equipFilter({ category: 4 }))
    const detail = buildEquipList(allEquipEntries, equipFilter({ category: 4, detail: 41 }))
    expect(detail.length).toBeGreaterThan(0)
    expect(detail.length).toBeLessThanOrEqual(tab.length)
    detail.forEach((entry) => expect(equipTypeForFilter(entry.$equip)).toBe(1))
  })
})

describe('equip ordering', () => {
  spec('groups by equipment type, then master id, then roster id', () => {
    const list = buildEquipList(allEquipEntries, equipFilter())
    assertOrdered(list, (a, b) => compareEquips(a, b))

    const types = list.map((e) => equipTypeSp(e.$equip))
    expect(types).toEqual([...types].sort((a, b) => a - b))

    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const curr = list[i]
      if (equipTypeSp(prev.$equip) !== equipTypeSp(curr.$equip)) continue
      if (prev.$equip.api_id !== curr.$equip.api_id) {
        expect(prev.$equip.api_id).toBeLessThan(curr.$equip.api_id)
      } else {
        // Default key has no level tie-break: roster id decides.
        expect(prev.equip.api_id).toBeLessThan(curr.equip.api_id)
      }
    }
  })

  spec('an item of the same type sits together regardless of api_sortno', () => {
    // The old poi ordering used api_sortno; confirm the game key differs from it.
    const bySortno = [...allEquipEntries].sort(
      (a, b) => (a.$equip.api_sortno ?? 0) - (b.$equip.api_sortno ?? 0),
    )
    const byGame = buildEquipList(allEquipEntries, equipFilter())
    expect(byGame.map((e) => e.equip.api_id)).not.toEqual(bySortno.map((e) => e.equip.api_id))
  })

  spec('key 1 orders identical items by improvement level descending', () => {
    const list = buildEquipList(allEquipEntries, equipFilter({ sortKey: 1 }))
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const curr = list[i]
      if (prev.$equip.api_id !== curr.$equip.api_id) continue
      expect(prev.equip.api_level ?? 0).toBeGreaterThanOrEqual(curr.equip.api_level ?? 0)
    }
  })

  spec('reports page and row for every owned equipment', () => {
    const list = buildEquipList(allEquipEntries, equipFilter())
    const positions = equipPositions(list)
    expect(positions.size).toBe(list.length)
    expect(positions.get(list[0].equip.api_id)).toEqual({ page: 1, index: 1, offset: 0 })
    expect(positions.get(list[ROWS_PER_PAGE * 2].equip.api_id)).toEqual({
      page: 3,
      index: 1,
      offset: ROWS_PER_PAGE * 2,
    })
  })
})

describe('equip list modes', () => {
  spec('the fixture roster actually equips some of the inventory', () => {
    expect(equippedOn.size).toBeGreaterThan(0)
    expect(entriesWithEquipState.some((e) => e.equippedOn == null)).toBe(true)
  })

  spec('splits the inventory into the two lists the picker paginates', () => {
    const lists = buildEquipLists(entriesWithEquipState, equipFilter())
    expect(lists.unset.length + lists.set.length).toBe(entriesWithEquipState.length)
    lists.unset.forEach((e) => expect(e.equippedOn).toBeUndefined())
    lists.set.forEach((e) => expect(e.equippedOn).toBeDefined())
  })

  spec('each list is ordered by the picker comparator', () => {
    const lists = buildEquipLists(entriesWithEquipState, equipFilter())
    assertOrdered(lists.unset, (a, b) => compareEquips(a, b))
    assertOrdered(lists.set, (a, b) => compareEquips(a, b))
  })

  spec('each list is numbered from its own first page', () => {
    const lists = buildEquipLists(entriesWithEquipState, equipFilter())
    const positions = equipListPositions(lists)

    expect(positions.get(lists.unset[0].equip.api_id)).toEqual({
      page: 1,
      index: 1,
      offset: 0,
      mode: 'unset',
    })
    expect(positions.get(lists.set[0].equip.api_id)).toEqual({
      page: 1,
      index: 1,
      offset: 0,
      mode: 'set',
    })
  })

  spec('an equipped item is numbered within the equipped list, not the whole inventory', () => {
    const lists = buildEquipLists(entriesWithEquipState, equipFilter())
    const positions = equipListPositions(lists)
    // Position in the merged list would be far higher than in the split one.
    const target = lists.set[lists.set.length - 1]
    const merged = buildEquipList(entriesWithEquipState, equipFilter())
    const mergedOffset = merged.findIndex((e) => e.equip.api_id === target.equip.api_id)

    expect(positions.get(target.equip.api_id)!.offset).toBe(lists.set.length - 1)
    expect(positions.get(target.equip.api_id)!.offset).toBeLessThan(mergedOffset)
  })

  spec('every owned item appears in exactly one list', () => {
    const lists = buildEquipLists(entriesWithEquipState, equipFilter())
    const positions = equipListPositions(lists)
    expect(positions.size).toBe(entriesWithEquipState.length)
  })

  spec('the target ship is dropped from the equipped list, but kept elsewhere', () => {
    const carrier = entriesWithEquipState.find((e) => e.equippedOn != null)
    expect(carrier).toBeDefined()
    const shipMemId = carrier!.equippedOn!

    const scoped = buildEquipLists(entriesWithEquipState, equipFilter({ forShipMemId: shipMemId }))
    const unscoped = buildEquipLists(entriesWithEquipState, equipFilter())

    const ownItems = entriesWithEquipState.filter((e) => e.equippedOn === shipMemId)
    expect(ownItems.length).toBeGreaterThan(0)

    scoped.set.forEach((e) => expect(e.equippedOn).not.toBe(shipMemId))
    expect(scoped.set).toHaveLength(unscoped.set.length - ownItems.length)
    // The unequipped list is untouched by the scoping.
    expect(scoped.unset).toHaveLength(unscoped.unset.length)
  })

  spec('the category filter applies to both lists', () => {
    const lists = buildEquipLists(entriesWithEquipState, equipFilter({ category: 9 }))
    const accepted = new Set(typesOfCategory(9))
    ;[...lists.unset, ...lists.set].forEach((entry) =>
      expect(accepted.has(equipTypeForFilter(entry.$equip))).toBe(true),
    )
  })
})

describe('worldOf', () => {
  spec('reads the world out of a map id', () => {
    expect(worldOf(11)).toBe(1)
    expect(worldOf(73)).toBe(7)
    expect(worldOf(531)).toBe(53)
  })
})

describe('isEventActive', () => {
  // This capture was taken during an event: alongside worlds 1-7 it carries
  // map 531, which also has the api_eventmap payload.
  const mapFixture: {
    body: { api_map_info: MapInfo[] }
  } = require('views/redux/info/__tests__/__fixtures__/api_get_member_mapinfo_typical.json')
  const allMaps = indexify<MapInfo>(mapFixture.body.api_map_info)
  const normalMaps = Object.fromEntries(
    Object.entries(allMaps).filter(([, map]) => worldOf(map.api_id ?? 0) <= 10),
  )

  spec('the fixture really does contain an event world', () => {
    const eventMaps = Object.values(allMaps).filter((map) => worldOf(map.api_id ?? 0) > 10)
    expect(eventMaps).toHaveLength(1)
    expect(eventMaps[0].api_eventmap).toBeDefined()
  })

  spec('is true while an event world is in the map list', () => {
    expect(isEventActive(allMaps)).toBe(true)
  })

  spec('is false once only the standard worlds remain', () => {
    expect(Object.keys(normalMaps).length).toBeGreaterThan(0)
    expect(isEventActive(normalMaps)).toBe(false)
  })

  spec('is false before the map list has loaded', () => {
    expect(isEventActive(undefined)).toBe(false)
    expect(isEventActive({})).toBe(false)
  })
})
