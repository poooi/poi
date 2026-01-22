import { isEqual } from 'lodash'

import { buildArray, compareUpdate } from 'views/utils/tools'
import { createSlice } from '@reduxjs/toolkit'
import {
  createAPIPortPortResponseAction,
  createAPIGetMemberDeckResponseAction,
  createAPIReqKaisouPowerupResponseAction,
  createAPIGetMemberShipDeckResponseAction,
  createAPIGetMemberShip3ResponseAction,
  createAPIReqHenseiPresetSelectResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqHenseiChangeResponseAction,
  createAPIReqMemberUpdatedecknameResponseAction,
} from '../actions'

export interface Fleet {
  api_id: number
  api_name?: string
  api_ship: number[]
  [key: string]: unknown
}

export type FleetsState = Fleet[]

function mergeIndexifiedFleets(state: FleetsState, body: Fleet[]): FleetsState {
  const bodyFleet = buildArray(body.map((fleet) => [fleet.api_id - 1, fleet] as [number, Fleet]))
  return compareUpdate(state, bodyFleet, 2)
}

// Ensure all -1 is in the end of array
function fixPlaceholder(originShips: number[]): number[] {
  const ships = originShips.filter((a) => a > 0)
  while (ships.length < originShips.length) {
    ships.push(-1)
  }
  return ships
}

// Return [fleetId, pos] if found
// [-1, -1] otherwise
function findShip(fleets: FleetsState, shipId: number): [number, number] {
  for (let fleetId = 0; fleetId < fleets.length; fleetId++) {
    const pos = fleets[fleetId].api_ship.findIndex((_shipId) => _shipId == shipId)
    if (pos != -1) {
      return [fleetId, pos]
    }
  }
  return [-1, -1]
}

// If shipId is -1, then remove the ship by appending -1 to the tail
// Otherwise, just assign the ship.
// The clone of the fleet is returned.
// pos is 0..5
function setShip(fleet: Fleet, pos: number, shipId: number): Fleet {
  const ships = fleet.api_ship.slice()
  if (shipId == -1) {
    ships.splice(pos, 1)
    ships.push(-1)
  } else {
    ships[pos] = shipId
  }
  if (isEqual(ships, fleet.api_ship)) return fleet
  return {
    ...fleet,
    api_ship: fixPlaceholder(ships),
  }
}

const fleetsSlice = createSlice({
  name: 'fleets',
  initialState: [] as FleetsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIPortPortResponseAction, (state, { payload }) => {
        return compareUpdate(state, payload.body.api_deck_port as unknown as Fleet[], 2)
      })
      .addCase(createAPIGetMemberDeckResponseAction, (state, { payload }) => {
        return mergeIndexifiedFleets(state, payload.body as unknown as Fleet[])
      })
      .addCase(createAPIReqKaisouPowerupResponseAction, (state, { payload }) => {
        return mergeIndexifiedFleets(state, payload.body.api_deck as unknown as Fleet[])
      })
      .addCase(createAPIGetMemberShipDeckResponseAction, (state, { payload }) => {
        return mergeIndexifiedFleets(state, payload.body.api_deck_data as unknown as Fleet[])
      })
      .addCase(createAPIGetMemberShip3ResponseAction, (state, { payload }) => {
        return mergeIndexifiedFleets(state, payload.body.api_deck_data as unknown as Fleet[])
      })
      .addCase(createAPIReqHenseiPresetSelectResponseAction, (state, { payload }) => {
        const api_deck_id = Number(payload.postBody.api_deck_id)
        const newState = state.slice()
        return compareUpdate(
          newState,
          buildArray([[api_deck_id - 1, payload.body as unknown as Fleet]]),
          2,
        )
      })
      .addCase(createAPIReqKousyouDestroyshipResponseAction, (state, { payload }) => {
        const fleets = state.slice()
        const shipIds = String(payload.postBody.api_ship_id)
          .split(',')
          .filter((shipId) => findShip(fleets, parseInt(shipId))[0] !== -1)
        if (shipIds.length === 0) return state
        shipIds.forEach((shipId) => {
          const [fleetId, pos] = findShip(fleets, parseInt(shipId))
          fleets[fleetId] = setShip(fleets[fleetId], pos, -1)
        })
        return fleets
      })
      .addCase(createAPIReqHenseiChangeResponseAction, (state, { payload }) => {
        // Let "ship*" be the ship that is specified by the fleet & position
        // Let "tgtShip*" be the ship that is specified by the shipId
        const fleets = state.slice()
        const fleetId = Number(payload.postBody.api_id) - 1
        const fleet = fleets[fleetId] || ({ api_id: fleetId + 1, api_ship: [] } as Fleet)
        const pos = Number(payload.postBody.api_ship_idx)
        const shipId = fleet.api_ship[pos] || -1
        const tgtShipId = Number(payload.postBody.api_ship_id)

        // Remove all but flagship
        if (tgtShipId === -2) {
          fleets[fleetId] = {
            ...fleet,
            api_ship: [fleet.api_ship[0], -1, -1, -1, -1, -1],
          }
          return fleets
        }

        const [tgtFleetId, tgtPos] = tgtShipId === -1 ? [-1, -1] : findShip(fleets, tgtShipId)

        // Be cautious to the order of double "setShip"s
        // which takes place when tgtShipId != -1 && tgtFleetId != -1.
        // In order to prevent positions from being messed up by removing a ship,
        // setShip(tgtShip) before setShip(ship) since tgtShip is never -1 in this case
        fleets[fleetId] = setShip(fleets[fleetId], pos, tgtShipId)
        if (tgtFleetId !== -1) {
          fleets[tgtFleetId] = setShip(fleets[tgtFleetId], tgtPos, shipId)
        }
        return fleets
      })
      .addCase(createAPIReqMemberUpdatedecknameResponseAction, (state, { payload }) => {
        const newName = payload.postBody.api_name
        const fleetId = Number(payload.postBody.api_deck_id)
        // assertion: fleetIndex !== -1 as this comes from in-game action
        const fleetIndex = state.findIndex((f) => f.api_id === fleetId)
        const fleet = state[fleetIndex]
        if (!fleet || fleet.api_name === newName) return state

        const newState = [...state]
        newState[fleetIndex] = {
          ...fleet,
          api_name: newName,
        }
        return newState
      })
  },
})

export const reducer = fleetsSlice.reducer
