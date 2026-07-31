import type { ConstState } from 'views/redux/const'
import type { Equip, EquipsState } from 'views/redux/info/equips'
import type { Ship, ShipsState } from 'views/redux/info/ships'

import { indexify } from 'views/utils/tools'

import { shipEquipDataSelectorFactory } from '../equip'

const spec = it

const data = require('../../__tests__/fixtures/api_start2.json')

const constState = {
  $ships: indexify(data.api_mst_ship),
  $shipTypes: indexify(data.api_mst_stype),
  $equips: indexify(data.api_mst_slotitem),
  $equipShip: data.api_mst_equip_ship,
} satisfies ConstState

// equip ids 101/102/103 hold master items 1/2/3
const equips: EquipsState = {
  101: { api_id: 101, api_slotitem_id: 1, api_locked: 0, api_level: 0 } satisfies Equip,
  102: { api_id: 102, api_slotitem_id: 2, api_locked: 0, api_level: 0 } satisfies Equip,
  103: { api_id: 103, api_slotitem_id: 3, api_locked: 0, api_level: 0 } satisfies Equip,
}

// The selector only reads api_slot / api_slot_ex / api_slotnum / api_onslot.
const makeShip = (
  api_id: number,
  api_slot: number[],
  api_slot_ex: number,
  api_onslot: number[],
): Ship =>
  // @ts-expect-error partial Ship: only the slot-related fields matter here
  ({ api_id, api_ship_id: 1, api_slotnum: api_slot.length, api_slot, api_slot_ex, api_onslot })

const makeState = (ship: Ship) => {
  const ships: ShipsState = { [ship.api_id]: ship }
  return { const: constState, info: { ships, equips } }
}

const equipDataOf = (shipId: number, ship: Ship) =>
  // @ts-expect-error partial RootState: only info.ships, info.equips and const are read
  shipEquipDataSelectorFactory(shipId)(makeState(ship))

describe('shipEquipDataSelectorFactory', () => {
  spec('keeps empty slots as undefined so indices stay aligned with slots', () => {
    const ship = makeShip(1, [101, -1, 102, -1], -1, [0, 0, 0, 0])
    const equipsData = equipDataOf(1, ship)

    // slotnum + 1 (exslot)
    expect(equipsData).toHaveLength(5)
    expect(equipsData?.[0]?.[0].api_id).toBe(101)
    expect(equipsData?.[1]).toBeUndefined()
    expect(equipsData?.[2]?.[0].api_id).toBe(102)
    expect(equipsData?.[3]).toBeUndefined()
  })

  spec('puts the exslot equip at the last index', () => {
    const ship = makeShip(2, [101, -1, -1, -1], 103, [0, 0, 0, 0])
    const equipsData = equipDataOf(2, ship)

    expect(equipsData).toHaveLength(5)
    expect(equipsData?.[4]?.[0].api_id).toBe(103)
  })

  spec('leaves the last index undefined when the exslot is empty', () => {
    const ship = makeShip(3, [101, 102, -1, -1], -1, [0, 0, 0, 0])
    const equipsData = equipDataOf(3, ship)

    expect(equipsData).toHaveLength(5)
    expect(equipsData?.[4]).toBeUndefined()
  })
})
