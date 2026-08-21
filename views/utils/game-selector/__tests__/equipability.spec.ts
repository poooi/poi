import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { ConstState } from 'views/redux/const'
import type { Equip } from 'views/redux/info/equips'

import { indexify } from 'views/utils/tools'

import { buildEquipList, canShipEquip, pickerEquipType, type EquipEntry } from '..'

const spec = it

const data = require('views/utils/__tests__/fixtures/api_start2.json')

const $equipShip: NonNullable<ConstState['$equipShip']> = data.api_mst_equip_ship

const constState = {
  $ships: indexify<APIMstShip>(data.api_mst_ship),
  $shipTypes: indexify(data.api_mst_stype),
  $equips: indexify<APIMstSlotitem>(data.api_mst_slotitem),
  $equipShip,
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
    expect(canShipEquip(1, anyEquip, {})).toBe(false)
  })

  spec('a destroyer cannot carry a large-calibre main gun', () => {
    const destroyer = shipOfStype(2)
    const largeGun = equipOfType(3)
    if (!largeGun) return
    expect(canShipEquip(destroyer.api_id, largeGun, constState)).toBe(false)
  })

  spec('a battleship can carry a large-calibre main gun', () => {
    const battleship = shipOfStype(9)
    const largeGun = equipOfType(3)
    if (!largeGun) return
    expect(canShipEquip(battleship.api_id, largeGun, constState)).toBe(true)
  })

  spec('a destroyer can carry a small-calibre main gun', () => {
    const destroyer = shipOfStype(2)
    const smallGun = equipOfType(1)
    if (!smallGun) return
    expect(canShipEquip(destroyer.api_id, smallGun, constState)).toBe(true)
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
    if (permitted) expect(canShipEquip(Number(shipMstId), permitted, constState)).toBe(true)

    const denied = Object.values($equips).find(
      ($equip) => pickerEquipType($equip) === typeId && !allowedIds.includes($equip.api_id),
    )
    if (denied) expect(canShipEquip(Number(shipMstId), denied, constState)).toBe(false)
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
      if (equip) expect(canShipEquip(withoutOverride.api_id, equip, constState)).toBe(true)
    }
    if (deniedType) {
      const equip = Object.values($equips).find(
        ($equip) => pickerEquipType($equip) === Number(deniedType),
      )
      if (equip) expect(canShipEquip(withoutOverride.api_id, equip, constState)).toBe(false)
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
    forShip.forEach((entry) =>
      expect(canShipEquip(destroyer.api_id, entry.$equip, constState)).toBe(true),
    )
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
    guns.forEach((entry) =>
      expect(canShipEquip(battleship.api_id, entry.$equip, constState)).toBe(true),
    )
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
