import type {
  APIMstEquipExslotShip,
  APIMstMaparea,
  APIMstMapinfo,
  APIMstMission,
  APIMstShip,
  APIMstShipgraph,
  APIMstShipupgrade,
  APIMstSlotitem,
  APIMstSlotitemEquiptype,
  APIMstStype,
  APIMstUseitem,
} from 'kcsapi/api_start2/getData/response'

import { createSlice } from '@reduxjs/toolkit'
import { indexify } from 'views/utils/tools'

import { createAPIStart2GetDataResponseAction } from './actions/response'

export interface ConstState {
  $ships?: Record<string, APIMstShip>
  $shipTypes?: Record<string, APIMstStype>
  $equips?: Record<string, APIMstSlotitem>
  $equipTypes?: Record<string, APIMstSlotitemEquiptype>
  $mapareas?: Record<string, APIMstMaparea>
  $maps?: Record<string, APIMstMapinfo>
  $missions?: Record<string, APIMstMission>
  $useitems?: Record<string, APIMstUseitem>
  $graphs?: Record<string, APIMstShipgraph>
  $shipgraph?: APIMstShipgraph[]
  $shipUpgrades?: APIMstShipupgrade[]
  $exslotEquips?: number[]
  $exslotEquipShips?: Record<string, APIMstEquipExslotShip>
  $exslotEquipLimits?: Record<string, number[]>
}

const constSlice = createSlice({
  name: 'const',
  initialState: {} as ConstState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAPIStart2GetDataResponseAction, (_state, { payload }) => {
      const body = payload.body
      return {
        $ships: indexify<APIMstShip>(body.api_mst_ship),
        $shipTypes: indexify<APIMstStype>(body.api_mst_stype),
        $equips: indexify<APIMstSlotitem>(body.api_mst_slotitem),
        $equipTypes: indexify<APIMstSlotitemEquiptype>(body.api_mst_slotitem_equiptype),
        $mapareas: indexify<APIMstMaparea>(body.api_mst_maparea),
        $maps: indexify<APIMstMapinfo>(body.api_mst_mapinfo),
        $missions: indexify<APIMstMission>(body.api_mst_mission),
        $useitems: indexify<APIMstUseitem>(body.api_mst_useitem),
        $graphs: indexify<APIMstShipgraph>(body.api_mst_shipgraph),
        $shipgraph: body.api_mst_shipgraph, // FIXME: finally deprecate $shipgraph in favor of $graphs
        /*
           IMPORTANT: do not indexify api_mst_shipupgrade,
           because api_id does not suggest uniqueness in this part
           due to having cyclic remodel chains.
         */
        $shipUpgrades: body.api_mst_shipupgrade,
        $exslotEquips: body.api_mst_equip_exslot,
        $exslotEquipShips: body.api_mst_equip_exslot_ship,
        $exslotEquipLimits: body.api_mst_equip_limit_exslot,
      }
    })
  },
})

export const reducer = constSlice.reducer
