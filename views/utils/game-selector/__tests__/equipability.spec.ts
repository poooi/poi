import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { ConstState } from 'views/redux/const'
import type { Equip } from 'views/redux/info/equips'

import { indexify } from 'views/utils/tools'

import {
  buildEquipList,
  canShipEquip,
  EXTRA_SLOT,
  pickerEquipType,
  slotRejectsEntry,
  slotRejectsType,
  type EquipEntry,
} from '..'

const spec = it

const data = require('views/utils/__tests__/fixtures/api_start2.json')

const $equipShip: NonNullable<ConstState['$equipShip']> = data.api_mst_equip_ship

const constState = {
  $ships: indexify<APIMstShip>(data.api_mst_ship),
  $shipTypes: indexify(data.api_mst_stype),
  $equips: indexify<APIMstSlotitem>(data.api_mst_slotitem),
  $equipShip,
  $exslotEquips: data.api_mst_equip_exslot,
  $exslotEquipShips: data.api_mst_equip_exslot_ship,
  $exslotEquipLimits: data.api_mst_equip_limit_exslot,
} satisfies ConstState

const $ships = constState.$ships
const $equips = constState.$equips

const equipFixture: {
  body: Equip[]
} = require('views/redux/info/__tests__/__fixtures__/api_get_member_slot_item_large_snapshot.json')

const allEquipEntries: EquipEntry[] = equipFixture.body.flatMap((equip) => {
  const $equip = $equips[equip.api_slotitem_id]
  return $equip ? [{ equip, $equip }] : []
})

/** A roster entry for a master item, since the picker checks both halves. */
const entryOf = ($equip: APIMstSlotitem, level = 0): EquipEntry => ({
  equip: { api_id: 0, api_slotitem_id: $equip.api_id, api_level: level, api_locked: 0 },
  $equip,
})

/** First master ship of a given type, for cases that only need "some X". */
const shipOfStype = (stype: number): APIMstShip => {
  const ship = Object.values($ships).find(($ship) => $ship.api_stype === stype)
  if (!ship) throw new Error(`no master ship of stype ${stype}`)
  return ship
}

const equipOfType = (type: number): APIMstSlotitem | undefined =>
  Object.values($equips).find(($equip) => $equip.api_type?.[2] === type)

describe('pickerEquipType', () => {
  spec('uses the special-cased type the game checks against', () => {
    const hukuhouL = $equips[467]
    if (hukuhouL) expect(pickerEquipType(hukuhouL)).toBe(95)
  })

  spec('otherwise follows equipTypeSp', () => {
    const daikou = $equips[128]
    if (daikou) expect(pickerEquipType(daikou)).toBe(38)
  })
})

describe('canShipEquip', () => {
  spec('is false when master data is missing', () => {
    const anyEquip = Object.values($equips)[0]
    expect(canShipEquip(1, entryOf(anyEquip), {})).toBe(false)
  })

  spec('a destroyer cannot carry a large-calibre main gun', () => {
    const destroyer = shipOfStype(2)
    const largeGun = equipOfType(3)
    if (!largeGun) return
    expect(canShipEquip(destroyer.api_id, entryOf(largeGun), constState)).toBe(false)
  })

  spec('a battleship can carry a large-calibre main gun', () => {
    const battleship = shipOfStype(9)
    const largeGun = equipOfType(3)
    if (!largeGun) return
    expect(canShipEquip(battleship.api_id, entryOf(largeGun), constState)).toBe(true)
  })

  spec('a destroyer can carry a small-calibre main gun', () => {
    const destroyer = shipOfStype(2)
    const smallGun = equipOfType(1)
    if (!smallGun) return
    expect(canShipEquip(destroyer.api_id, entryOf(smallGun), constState)).toBe(true)
  })

  spec('a per-ship override restricts to the listed master ids', () => {
    // Find a ship whose override names specific items for some type.
    const entry = Object.entries(constState.$equipShip).find(([, value]) =>
      Object.values(value.api_equip_type).some((ids) => Array.isArray(ids) && ids.length > 0),
    )
    if (!entry) return
    const [shipMstId, value] = entry

    let typeId = -1
    let allowedIds: number[] = []
    for (const [key, ids] of Object.entries(value.api_equip_type)) {
      if (Array.isArray(ids) && ids.length > 0) {
        typeId = Number(key)
        allowedIds = ids
        break
      }
    }
    if (allowedIds.length === 0) return

    const permitted = $equips[allowedIds[0]]
    if (permitted)
      expect(canShipEquip(Number(shipMstId), entryOf(permitted), constState)).toBe(true)

    const denied = Object.values($equips).find(
      ($equip) => pickerEquipType($equip) === typeId && !allowedIds.includes($equip.api_id),
    )
    if (denied) expect(canShipEquip(Number(shipMstId), entryOf(denied), constState)).toBe(false)
  })

  spec('falls back to the ship type default when there is no override', () => {
    const withoutOverride = Object.values($ships).find(
      ($ship) => !(String($ship.api_id) in constState.$equipShip),
    )
    if (!withoutOverride) return
    const stype = constState.$shipTypes[withoutOverride.api_stype]
    const allowedType = Object.entries(stype.api_equip_type).find(([, ok]) => ok === 1)?.[0]
    const deniedType = Object.entries(stype.api_equip_type).find(([, ok]) => ok !== 1)?.[0]

    if (allowedType) {
      const equip = Object.values($equips).find(
        ($equip) => pickerEquipType($equip) === Number(allowedType),
      )
      if (equip) expect(canShipEquip(withoutOverride.api_id, entryOf(equip), constState)).toBe(true)
    }
    if (deniedType) {
      const equip = Object.values($equips).find(
        ($equip) => pickerEquipType($equip) === Number(deniedType),
      )
      if (equip)
        expect(canShipEquip(withoutOverride.api_id, entryOf(equip), constState)).toBe(false)
    }
  })
})

describe('per-ship equipment list', () => {
  spec('narrows the inventory to what the ship can carry', () => {
    const destroyer = shipOfStype(2)
    const all = buildEquipList(allEquipEntries, { category: 0 }, constState)
    const forShip = buildEquipList(
      allEquipEntries,
      { category: 0, forShipMstId: destroyer.api_id },
      constState,
    )

    expect(forShip.length).toBeGreaterThan(0)
    expect(forShip.length).toBeLessThan(all.length)
    forShip.forEach((entry) => expect(canShipEquip(destroyer.api_id, entry, constState)).toBe(true))
  })

  spec('keeps the picker ordering within the narrowed list', () => {
    const battleship = shipOfStype(9)
    const forShip = buildEquipList(
      allEquipEntries,
      { category: 0, forShipMstId: battleship.api_id },
      constState,
    )
    const types = forShip.map((e) => pickerEquipType(e.$equip))
    // The list stays grouped by type even after the per-ship filter.
    const sortedByGameKey = [...forShip].sort(
      (a, b) =>
        pickerEquipType(a.$equip) - pickerEquipType(b.$equip) ||
        a.$equip.api_id - b.$equip.api_id ||
        a.equip.api_id - b.equip.api_id,
    )
    expect(forShip.map((e) => e.equip.api_id)).toEqual(sortedByGameKey.map((e) => e.equip.api_id))
    expect(types.length).toBeGreaterThan(0)
  })

  spec('combines with the category filter', () => {
    const battleship = shipOfStype(9)
    const guns = buildEquipList(
      allEquipEntries,
      { category: 4, forShipMstId: battleship.api_id },
      constState,
    )
    const allGuns = buildEquipList(allEquipEntries, { category: 4 }, constState)
    expect(guns.length).toBeLessThanOrEqual(allGuns.length)
    guns.forEach((entry) => expect(canShipEquip(battleship.api_id, entry, constState)).toBe(true))
  })

  spec('is a no-op without constState', () => {
    const destroyer = shipOfStype(2)
    const unscoped = buildEquipList(allEquipEntries, {
      category: 0,
      forShipMstId: destroyer.api_id,
    })
    expect(unscoped).toHaveLength(allEquipEntries.length)
  })
})

/**
 * The per-slot exclusions the game hardcodes in `SlotUtil.excludeEquipList`.
 * 伊勢改二 (553) is the "this slot and every later one" shape; 夕張改二 (622)
 * covers both a plain exclusion and an "only these types" slot.
 */
describe('slotRejectsType', () => {
  spec('伊勢改二 bars medium and large main guns from slot 3 onwards', () => {
    expect(slotRejectsType(553, 1, 3)).toBe(false)
    expect(slotRejectsType(553, 2, 3)).toBe(true)
    expect(slotRejectsType(553, 3, 2)).toBe(true)
    // Only those two types; a small main gun still fits.
    expect(slotRejectsType(553, 2, 1)).toBe(false)
  })

  spec('夕張改二 slot 4 bars the four listed types and nothing else', () => {
    expect(slotRejectsType(622, 3, 5)).toBe(true)
    expect(slotRejectsType(622, 3, 22)).toBe(true)
    expect(slotRejectsType(622, 3, 12)).toBe(false)
  })

  spec('夕張改二 slot 5 accepts only the three listed types', () => {
    for (const allowed of [12, 21, 43]) expect(slotRejectsType(622, 4, allowed)).toBe(false)
    expect(slotRejectsType(622, 4, 1)).toBe(true)
    expect(slotRejectsType(622, 4, 13)).toBe(true)
  })

  spec('leaves ships with no rule alone', () => {
    expect(slotRejectsType(1, 0, 3)).toBe(false)
    expect(slotRejectsType(1, 4, 5)).toBe(false)
  })
})

describe('per-slot equipment list', () => {
  const isseKai2 = 553

  spec('naming a slot narrows the list further than the ship alone', () => {
    const anySlot = buildEquipList(
      allEquipEntries,
      { category: 0, forShipMstId: isseKai2 },
      constState,
    )
    const aftSlot = buildEquipList(
      allEquipEntries,
      { category: 0, forShipMstId: isseKai2, slot: 2 },
      constState,
    )
    expect(aftSlot.length).toBeLessThan(anySlot.length)
    // Whatever the aft slot dropped was a medium or large main gun.
    const dropped = anySlot.filter((entry) => !aftSlot.includes(entry))
    expect(dropped.length).toBeGreaterThan(0)
    dropped.forEach((entry) => expect([2, 3]).toContain(pickerEquipType(entry.$equip)))
  })

  spec('the first two slots keep everything the ship can carry', () => {
    const anySlot = buildEquipList(
      allEquipEntries,
      { category: 0, forShipMstId: isseKai2 },
      constState,
    )
    for (const slot of [0, 1]) {
      const list = buildEquipList(
        allEquipEntries,
        { category: 0, forShipMstId: isseKai2, slot },
        constState,
      )
      expect(list).toHaveLength(anySlot.length)
    }
  })

  spec('the 他艦娘装備中 list keys the exclusion on the raw type', () => {
    // 51cm連装砲 (281) is a large main gun by api_type[2] but 超大型 by
    // equipTypeSp, and the game's two lists key the exclusion differently:
    // 未装備 matches on equipTypeSp, 他艦娘装備中 on the raw type. No ship
    // that carries an exclusion rule can equip either type today, so the
    // difference is only visible on the helper itself.
    const gun = $equips[281]
    if (!gun) return
    expect(slotRejectsEntry(isseKai2, 2, gun, 'unset')).toBe(false)
    expect(slotRejectsEntry(isseKai2, 2, gun, 'set')).toBe(true)
  })
})

describe('the ex-slot', () => {
  spec('accepts a type listed in api_mst_equip_exslot', () => {
    const battleship = shipOfStype(9)
    const exType = data.api_mst_equip_exslot[0]
    const equip = Object.values($equips).find(($equip) => pickerEquipType($equip) === exType)
    if (!equip) return
    // Only meaningful if the ship could carry it in a normal slot anyway.
    if (!canShipEquip(battleship.api_id, entryOf(equip), constState)) return
    expect(canShipEquip(battleship.api_id, entryOf(equip), constState, EXTRA_SLOT)).toBe(true)
  })

  spec('rejects a type that is not ex-slot capable and not named per item', () => {
    const battleship = shipOfStype(9)
    const exTypes: number[] = data.api_mst_equip_exslot
    const equip = Object.values($equips).find(
      ($equip) =>
        !exTypes.includes(pickerEquipType($equip)) &&
        !(String($equip.api_id) in data.api_mst_equip_exslot_ship) &&
        canShipEquip(battleship.api_id, entryOf($equip), constState),
    )
    if (!equip) return
    expect(canShipEquip(battleship.api_id, entryOf(equip), constState, EXTRA_SLOT)).toBe(false)
  })

  spec('honours the per-item improvement requirement', () => {
    const withLevel = Object.entries<{
      api_req_level: number
      api_ship_ids: { [key: string]: number } | null
    }>(data.api_mst_equip_exslot_ship).find(
      ([equipMstId, value]) =>
        value.api_req_level > 0 && value.api_ship_ids != null && $equips[Number(equipMstId)],
    )
    if (!withLevel) return
    const [equipMstId, value] = withLevel
    const shipMstId = Number(Object.keys(value.api_ship_ids ?? {})[0])
    const $equip = $equips[Number(equipMstId)]
    if (!$ships[shipMstId]) return
    // The by-type route would mask the level check, so skip items it covers.
    const exTypes: number[] = data.api_mst_equip_exslot
    if (exTypes.includes(pickerEquipType($equip))) return

    expect(canShipEquip(shipMstId, entryOf($equip, 0), constState, EXTRA_SLOT)).toBe(false)
    expect(
      canShipEquip(shipMstId, entryOf($equip, value.api_req_level), constState, EXTRA_SLOT),
    ).toBe(true)
  })

  spec('rejects everything when the ship cannot carry the type at all', () => {
    const destroyer = shipOfStype(2)
    const largeGun = equipOfType(3)
    if (!largeGun) return
    expect(canShipEquip(destroyer.api_id, entryOf(largeGun), constState, EXTRA_SLOT)).toBe(false)
  })
})
