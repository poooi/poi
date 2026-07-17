import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { AirBase } from 'views/redux/info/airbase'
import type { Equip } from 'views/redux/info/equips'

import memoize from 'fast-memoize'
import { zip } from 'lodash'
import { createSelector } from 'reselect'

import type { EquipDataWithOnslot, StateWithOnslot } from './base'

import { arrayResultWrapper, constSelector, equipsSelector, stateSelector } from './base'
import { landbaseSelectorFactory } from './fleet'
import { shipBaseDataSelectorFactory } from './ship'

const shipSlotnumSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) =>
    ship ? (ship.api_slotnum ?? 0) : 0,
  ),
)
const shipSlotSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => (ship ? ship.api_slot : undefined)),
)
const shipExslotSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) =>
    ship ? (ship.api_slot_ex ?? -1) : -1,
  ),
)
const shipOnSlotSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) =>
    ship ? ship.api_onslot : undefined,
  ),
)
const landbaseSlotnumSelectorFactory = memoize((landbaseId: number) =>
  createSelector(landbaseSelectorFactory(landbaseId), (landbase: AirBase | undefined) =>
    landbase ? (landbase.api_plane_info?.length ?? 0) : 0,
  ),
)
const landbaseOnSlotSelectorFactory = memoize((landbaseId: number) =>
  createSelector(landbaseSelectorFactory(landbaseId), (landbase: AirBase | undefined) =>
    landbase ? landbase.api_plane_info?.map((l) => l.api_count) : undefined,
  ),
)

// Returns [equipId for each slot on the ship]
// length is always 5 + 1(ex slot)
// Slot is padded with -1 for each empty slot
// Returns undefined if ship is undefined
const shipEquipsIdSelectorFactory = memoize((shipId: number) =>
  arrayResultWrapper(
    createSelector(
      [shipSlotSelectorFactory(shipId), shipExslotSelectorFactory(shipId)],
      (slot, exslot) => (slot ? slot.concat(exslot).map((i) => parseInt(String(i))) : undefined),
    ),
  ),
)
const landbaseEquipsIdSelectorFactory = memoize((landbaseId: number) =>
  arrayResultWrapper(
    createSelector(landbaseSelectorFactory(landbaseId), (landbase: AirBase | undefined) =>
      landbase ? (landbase.api_plane_info?.map((l) => l.api_slotid) ?? []) : [],
    ),
  ),
)

// There's a Number type check
const equipBaseDataSelectorFactory = memoize((equipId: number) =>
  createSelector([equipsSelector], (equips) =>
    equips && typeof equipId === 'number' && equipId ? equips[equipId] : undefined,
  ),
)

// Returns [_equip, $equip]
// Returns undefined if uninitialized, or if equip not found in _equip
// Attention: equipId here only accepts Number type,
//   otherwise will always return undefined
export const equipDataSelectorFactory = memoize((equipId: number) =>
  arrayResultWrapper(
    createSelector([equipBaseDataSelectorFactory(equipId), constSelector], (equip, { $equips }) => {
      if (!equip || !$equips || equip.api_slotitem_id == null || !$equips[equip.api_slotitem_id])
        return
      return [equip, $equips[equip.api_slotitem_id]] as [Equip, APIMstSlotitem]
    }),
  ),
)

const modifiedEquipDataSelectorFactory = memoize((equipId: number) =>
  arrayResultWrapper<StateWithOnslot, EquipDataWithOnslot | undefined>(
    createSelector(
      [
        (state: StateWithOnslot) => equipBaseDataSelectorFactory(equipId)(state.state),
        (state: StateWithOnslot) => constSelector(state.state),
        (state: StateWithOnslot) => state.onslot,
      ],
      (equip, { $equips }, onslot) => {
        if (!equip || !$equips || equip.api_slotitem_id == null || !$equips[equip.api_slotitem_id])
          return
        return [equip, $equips[equip.api_slotitem_id], onslot] as EquipDataWithOnslot
      },
    ),
  ),
)

function effectiveEquips<T>(equipArray: T[], slotnum: number): T[] {
  if (equipArray.length <= slotnum) return equipArray
  return [...equipArray.slice(0, slotnum), equipArray[equipArray.length - 1]]
}

// Returns [[_equip, $equip, onslot] for each slot on the ship]
//   where onslot is the number of airplanes left as in api_onslot
// length is always slotnum+1, which is all slots plus exslot
// onslots (length 5) is padded with a 0 since onslot for exslot is assumed to be 0
// Slot is padded with undefined for being empty or not fount in _equips
// Returns undefined if _equips or $equips is undefined
export const shipEquipDataSelectorFactory = memoize((shipId: number) =>
  arrayResultWrapper(
    createSelector(
      [
        stateSelector,
        shipSlotnumSelectorFactory(shipId),
        shipEquipsIdSelectorFactory(shipId),
        shipOnSlotSelectorFactory(shipId),
      ],
      (state, slotnum, shipEquipsId, onslots) =>
        !Array.isArray(shipEquipsId)
          ? undefined
          : effectiveEquips(
              zip(shipEquipsId, (onslots ?? []).concat(0)).map(([equipId, onslot]) =>
                !equipId || equipId <= 0
                  ? undefined
                  : modifiedEquipDataSelectorFactory(equipId)({ state, onslot }),
              ),
              slotnum,
            ).filter((data): data is EquipDataWithOnslot => data !== undefined),
    ),
  ),
)

export const landbaseEquipDataSelectorFactory = memoize((landbaseId: number) =>
  arrayResultWrapper(
    createSelector(
      [
        stateSelector,
        landbaseSlotnumSelectorFactory(landbaseId),
        landbaseEquipsIdSelectorFactory(landbaseId),
        landbaseOnSlotSelectorFactory(landbaseId),
      ],
      (state, slotnum, landbaseEquipsId, onslots) =>
        !Array.isArray(landbaseEquipsId)
          ? undefined
          : effectiveEquips(
              zip(landbaseEquipsId, onslots).map(([equipId, onslot]) =>
                !equipId || equipId <= 0
                  ? undefined
                  : modifiedEquipDataSelectorFactory(equipId)({ state, onslot }),
              ),
              slotnum,
            ).filter((data): data is EquipDataWithOnslot => data !== undefined),
    ),
  ),
)
