import { get } from 'lodash'
import type { Dispatch } from 'redux'
import { createSlice } from '@reduxjs/toolkit'

import { Models, Simulator } from 'poi-lib-battle'

const { Battle, Fleet } = Models

function jsonCloneObject(obj: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>
}

type EquipInfo = {
  api_slotitem_id: number
  api_info?: unknown
  [key: string]: unknown
}

type ShipInfo = {
  api_id: number
  api_ship_id: number
  api_nowhp: number
  api_maxhp: number
  api_slot?: number[]
  api_slot_ex?: number
  [key: string]: unknown
}

type RootState = {
  info?: {
    equips?: Record<string, EquipInfo>
    ships?: Record<string, ShipInfo>
    fleets?: Record<string, { api_ship?: number[] }>
  }
  const?: {
    $equips?: Record<string, Record<string, unknown>>
    $ships?: Record<string, Record<string, unknown>>
  }
  sortie?: {
    combinedFlag?: number
    sortieStatus?: boolean[]
  }
}

export type BattleSimulationResult = {
  deckShipId: number[]
  deckHp: number[]
  deckInitHp: number[]
  enemyShipId: number[]
  enemyHp: number[]
}

export type BattleResult = BattleSimulationResult & {
  valid: boolean
  time?: number
  rank?: string
  boss?: boolean
  map?: number
  mapCell?: number
  quest?: string
  enemy?: string
  combined?: boolean
  mvp?: [number, number]
  dropItem?: unknown
  dropShipId?: number
  enemyFormation?: number
  eventItem?: unknown
}

type StatusState = {
  deckId: number
  map: number
  bossCell: number
  currentCell: number
  enemyFormation: number
  colorNo: number
  packet: unknown[]
  battle: InstanceType<(typeof Models)['Battle']> | null
  result?: BattleSimulationResult
  time: number
}

export type BattleState = {
  _status: StatusState
  result: BattleResult
}

function simulate(battle: InstanceType<(typeof Models)['Battle']>): BattleSimulationResult {
  const simulator = Simulator.auto(battle)
  const deckShipId: number[] = []
  const deckHp: number[] = []
  const deckInitHp: number[] = []

  const deck = (
    [] as Array<(typeof simulator)['mainFleet'] extends Array<infer S> ? S : unknown>
  ).concat(simulator?.mainFleet || [], simulator?.escortFleet || [])

  deck.forEach((ship) => {
    const raw =
      ship && typeof ship === 'object' ? (ship as { raw?: { api_id?: number } }).raw : undefined
    deckShipId.push(raw && typeof raw.api_id === 'number' ? raw.api_id : -1)

    const nowHP = ship && typeof ship === 'object' ? (ship as { nowHP?: number }).nowHP : undefined
    deckHp.push(typeof nowHP === 'number' ? nowHP : 0)

    const initHP =
      ship && typeof ship === 'object' ? (ship as { initHP?: number }).initHP : undefined
    deckInitHp.push(typeof initHP === 'number' ? initHP : 0)
  })

  const enemyShipId: number[] = []
  const enemyHp: number[] = []
  const enemy = ([] as unknown[]).concat(simulator?.enemyFleet || [], simulator?.enemyEscort || [])
  enemy.forEach((ship) => {
    const id = ship && typeof ship === 'object' ? (ship as { id?: number }).id : undefined
    enemyShipId.push(typeof id === 'number' ? id : -1)

    const nowHP = ship && typeof ship === 'object' ? (ship as { nowHP?: number }).nowHP : undefined
    enemyHp.push(typeof nowHP === 'number' ? nowHP : 0)
  })

  return { deckShipId, deckHp, deckInitHp, enemyShipId, enemyHp }
}

function getItem(itemId: number, state: RootState): Record<string, unknown> | null {
  const _item = get(state, `info.equips.${itemId}`) as EquipInfo | undefined
  const item = _item
    ? ({
        ...(get(state, `const.$equips.${_item.api_slotitem_id}`) as
          | Record<string, unknown>
          | undefined),
        ..._item,
      } as Record<string, unknown>)
    : null

  if (item) {
    // Clean up
    delete item['api_info']
  }

  return item
}

function getShip(shipId: number, state: RootState): Record<string, unknown> | null {
  const _ship = get(state, `info.ships.${shipId}`) as ShipInfo | undefined
  const ship = _ship
    ? ({
        ...(get(state, `const.$ships.${_ship.api_ship_id}`) as Record<string, unknown> | undefined),
        ..._ship,
      } as Record<string, unknown>)
    : null

  if (ship) {
    ship['poi_slot'] = []
    const api_slot = (ship['api_slot'] as number[] | undefined) || []
    for (const id of api_slot) {
      ;(ship['poi_slot'] as unknown[]).push(getItem(id, state))
    }

    const api_slot_ex =
      typeof ship['api_slot_ex'] === 'number' ? (ship['api_slot_ex'] as number) : -1
    ship['poi_slot_ex'] = api_slot_ex > 0 ? getItem(api_slot_ex, state) : null

    // Clean up
    delete ship['api_getmes']
    delete ship['api_slot']
    delete ship['api_slot_ex']
    delete ship['api_yomi']
  }

  return ship
}

function getFleet(
  deckId: number | undefined,
  state: RootState,
): Array<Record<string, unknown> | null> | null {
  if (typeof deckId !== 'number' || !Number.isFinite(deckId) || deckId <= 0) {
    return null
  }

  const deck =
    (get(state, `info.fleets.${deckId - 1}`) as { api_ship?: number[] } | undefined) || {}
  const ships = deck.api_ship
  if (!Array.isArray(ships)) {
    return null
  }

  const fleet: Array<Record<string, unknown> | null> = []
  for (const id of ships) {
    fleet.push(typeof id === 'number' && id > 0 ? getShip(id, state) : null)
  }
  return fleet
}

function getSortieType(state: RootState): number {
  const combinedFlag = Number(get(state, 'sortie.combinedFlag')) || 0
  const sortieFleet: number[] = []
  for (const [i, status] of (
    (get(state, 'sortie.sortieStatus') as boolean[] | undefined) || []
  ).entries()) {
    if (status) sortieFleet.push(i)
  }
  return sortieFleet.length === 2 ? combinedFlag : 0
}

const statusInitState: StatusState = {
  deckId: -1,
  map: -1,
  bossCell: -1,
  currentCell: -1,
  enemyFormation: 0,
  // Formation: 0 - 単縦陣, 1 - 複縦陣, 2 - 輪形陣, 3 - 梯形陣, 4 - 単横陣,
  // 5 - 第一警戒航行序列, 6 - 第二警戒航行序列, 7 - 第三警戒航行序列, 8 - 第四警戒航行序列
  colorNo: -1,
  packet: [],
  battle: null,
  time: 0,
}

const resultInitState: BattleResult = {
  valid: false,
  deckShipId: [],
  deckHp: [],
  deckInitHp: [],
  enemyShipId: [],
  enemyHp: [],
}

const initState: BattleState = {
  // _status: Temporary middle results
  _status: statusInitState,
  // result: The result of a completed battle. Only changes on battle completion
  result: resultInitState,
}

type MapStartBody = {
  api_maparea_id: number
  api_mapinfo_no: number
  api_bosscell_no: number
  api_no: number
  api_color_no: number
}

type MapStartPostBody = {
  api_deck_id: string
}

type MapNextBody = {
  api_no: number
  api_color_no: number
}

type BattleBody = {
  api_formation?: number[]
  api_deck_id?: number
  api_dock_id?: number
  [key: string]: unknown
}

type BattleResultBody = {
  api_win_rank: string
  api_quest_name: string
  api_enemy_info: { api_deck_name: string }
  api_mvp: number
  api_mvp_combined?: number
  api_get_useitem?: unknown
  api_get_ship?: { api_ship_id?: number } | null
  api_get_eventitem?: unknown
}

export const battleSlice = createSlice({
  name: 'battle',
  initialState: initState,
  reducers: {
    port: () => initState,

    mapStart: (state, action: { payload: { body: unknown; postBody: unknown } }) => {
      const body = action.payload.body as MapStartBody
      const postBody = action.payload.postBody as MapStartPostBody
      const deckId = Number.parseInt(String(postBody.api_deck_id || ''), 10)

      state._status.battle = null
      state._status.map = Number(body.api_maparea_id) * 10 + Number(body.api_mapinfo_no)
      state._status.bossCell = Number(body.api_bosscell_no)
      state._status.currentCell = Number(body.api_no)
      state._status.deckId = Number.isFinite(deckId) ? deckId - 1 : -1
      state._status.colorNo = Number(body.api_color_no)
      state._status.enemyFormation = 0
    },

    mapNext: (state, action: { payload: { body: unknown } }) => {
      const body = action.payload.body as MapNextBody
      state._status.currentCell = Number(body.api_no)
      state._status.battle = null
      state._status.colorNo = Number(body.api_color_no)
      state._status.enemyFormation = 0
    },

    battle: (
      state,
      action: { payload: { body: unknown; path?: string; time?: number; rootState: unknown } },
    ) => {
      const body = (action.payload.body || {}) as BattleBody
      const upperState = (action.payload.rootState || {}) as RootState

      const sortieTypeFlag = getSortieType(upperState)

      const formation = body.api_formation || []
      const enemyFormation = (formation[1] || state._status.enemyFormation) as number
      const fleetId = [body.api_deck_id, body.api_dock_id].find((x) => x != null)
      const escortId = sortieTypeFlag > 0 ? 2 : -1

      const battle =
        state._status.battle ||
        new Battle({
          fleet: new Fleet({
            type: sortieTypeFlag,
            main: getFleet(fleetId, upperState),
            escort: getFleet(escortId, upperState),
          }),
          packet: [],
        })

      const packet = jsonCloneObject(body as Record<string, unknown>)
      packet.poi_path = String(action.payload.path || '')
      battle.packet.push(packet)

      state._status.battle = battle
      state._status.result = simulate(battle)
      state._status.enemyFormation = enemyFormation
      state._status.time = state._status.time
        ? state._status.time
        : Number(action.payload.time) || 0
    },

    battleResult: (state, action: { payload: { body: unknown; rootState: unknown } }) => {
      const body = action.payload.body as BattleResultBody
      const upperState = (action.payload.rootState || {}) as RootState

      if (!state._status.result) return

      const combined = getSortieType(upperState) > 0
      const mvp1 = Number(body.api_mvp) - 1
      const mvp2 = combined ? Number(body.api_mvp_combined) - 1 : mvp1

      state.result = {
        ...state._status.result,
        valid: true,
        time: state._status.time,
        rank: body.api_win_rank,
        boss: state._status.bossCell === state._status.currentCell || state._status.colorNo === 5,
        map: state._status.map,
        mapCell: state._status.currentCell,
        quest: body.api_quest_name,
        enemy: body.api_enemy_info.api_deck_name,
        combined,
        mvp: [mvp1, mvp2],
        dropItem: body.api_get_useitem,
        dropShipId:
          body.api_get_ship?.api_ship_id != null ? Number(body.api_get_ship.api_ship_id) : -1,
        enemyFormation: state._status.enemyFormation,
        eventItem: body.api_get_eventitem,
      }

      state._status.battle = null
      state._status.time = 0
    },
  },
})

export const battleActions = battleSlice.actions

// Subscriber, used on battle completion.
// Need to observe on state battle.result
export function dispatchBattleResult(dispatch: Dispatch, battleResult: BattleResult): void {
  if (!battleResult.valid) return
  dispatch({
    type: '@@BattleResult',
    result: battleResult,
  })

  const e = new CustomEvent<BattleResult>('battle.result', {
    bubbles: true,
    cancelable: true,
    detail: battleResult,
  })
  window.dispatchEvent(e)
}
