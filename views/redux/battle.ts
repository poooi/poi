import { createAction, isAnyOf, type UnknownAction } from '@reduxjs/toolkit'
import { get } from 'lodash'
import { Models, Simulator } from 'poi-lib-battle'

import {
  createAPIPortPortResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIReqMapStartResponseAction,
  createAPIReqSortieBattleResultResponseAction,
  createAPIReqCombinedBattleBattleresultResponseAction,
  createAPIReqSortieBattleResponseAction,
  createAPIReqSortieAirbattleResponseAction,
  createAPIReqSortieLdAirbattleResponseAction,
  createAPIReqCombinedBattleBattleResponseAction,
  createAPIReqCombinedBattleBattleWaterResponseAction,
  createAPIReqCombinedBattleAirbattleResponseAction,
  createAPIReqCombinedBattleLdAirbattleResponseAction,
  createAPIReqCombinedBattleEcBattleResponseAction,
  createAPIReqCombinedBattleEachBattleResponseAction,
  createAPIReqCombinedBattleEachBattleWaterResponseAction,
  createAPIReqBattleMidnightBattleResponseAction,
  createAPIReqBattleMidnightSPMidnightResponseAction,
  createAPIReqCombinedBattleMidnightBattleResponseAction,
  createAPIReqCombinedBattleSPMidnightResponseAction,
  createAPIReqCombinedBattleEcMidnightBattleResponseAction,
  createAPIReqCombinedBattleEcNightToDayResponseAction,
} from './actions/response'

const { Battle, Fleet } = Models

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function asNumber(x: unknown, fallback = 0): number {
  return typeof x === 'number' ? x : fallback
}

function simulate(battle: InstanceType<typeof Battle>) {
  const simulator = Simulator.auto(battle, {})
  if (!simulator)
    return { deckShipId: [], deckHp: [], deckInitHp: [], enemyShipId: [], enemyHp: [] }

  const deckShipId: number[] = []
  const deckHp: number[] = []
  const deckInitHp: number[] = []
  const deck = [...(simulator.mainFleet ?? []), ...(simulator.escortFleet ?? [])]
  deck.map((ship) => {
    deckShipId.push(ship && isRecord(ship.raw) ? asNumber(ship.raw['api_id'], -1) : -1)
    deckHp.push(ship ? ship.nowHP : 0)
    deckInitHp.push(ship ? ship.initHP : 0)
  })
  const enemyShipId: number[] = []
  const enemyHp: number[] = []
  const enemy = [...(simulator.enemyFleet ?? []), ...(simulator.enemyEscort ?? [])]
  enemy.map((ship) => {
    enemyShipId.push(ship ? ship.id : -1)
    enemyHp.push(ship ? ship.nowHP : 0)
  })

  return { deckShipId, deckHp, deckInitHp, enemyShipId, enemyHp }
}

function getItem(itemId: number, store: Record<string, unknown>): Record<string, unknown> | null {
  const _item = get(store, `info.equips.${itemId}`)
  if (!isRecord(_item)) return null
  const master = get(store, `const.$equips.${_item['api_slotitem_id']}`)
  const item = { ...(isRecord(master) ? master : {}), ..._item }
  delete item['api_info']
  return item
}

function getShip(
  shipId: number,
  store: Record<string, unknown>,
): (Record<string, unknown> & { poi_slot: unknown[]; poi_slot_ex: unknown }) | null {
  const _ship = get(store, `info.ships.${shipId}`)
  if (!isRecord(_ship)) return null
  const master = get(store, `const.$ships.${_ship['api_ship_id']}`)
  const ship: Record<string, unknown> & { poi_slot: unknown[]; poi_slot_ex: unknown } = {
    ...(isRecord(master) ? master : {}),
    ..._ship,
    poi_slot: [],
    poi_slot_ex: null,
  }
  const apiSlot = ship['api_slot']
  const slotIds = Array.isArray(apiSlot) ? apiSlot : []
  for (const id of slotIds) {
    ship.poi_slot.push(getItem(asNumber(id, -1), store))
  }
  ship.poi_slot_ex = getItem(asNumber(ship['api_slot_ex'], -1), store)
  delete ship['api_getmes']
  delete ship['api_slot']
  delete ship['api_slot_ex']
  delete ship['api_yomi']
  return ship
}

function getFleet(deckId: number, store: Record<string, unknown>): unknown[] | null {
  const deckRaw = get(store, `info.fleets.${deckId - 1}`)
  if (!isRecord(deckRaw)) return null
  const ships = deckRaw['api_ship']
  if (!Array.isArray(ships)) return null
  return ships.map((id) => getShip(asNumber(id, -1), store))
}

function getSortieType(store: Record<string, unknown>): number {
  const combinedFlag = asNumber(get(store, 'sortie.combinedFlag'))
  const sortieStatus = get(store, 'sortie.sortieStatus')
  const statusArr = Array.isArray(sortieStatus) ? sortieStatus : []
  const sortieFleet = statusArr.flatMap((status, i) => (status ? [i] : []))
  return sortieFleet.length === 2 ? combinedFlag : 0
}

interface StatusState {
  deckId: number
  map: number
  bossCell: number
  currentCell: number
  enemyFormation: number
  colorNo: number
  packet: unknown[]
  battle: InstanceType<typeof Battle> | null
  time: number
  result?: ReturnType<typeof simulate>
}

export type BattleResult = {
  valid: boolean
  time?: number
  rank?: string
  boss?: boolean
  map?: number
  mapCell?: number
  quest?: string
  enemy?: string
  combined?: boolean
  mvp?: number[]
  dropItem?: unknown
  dropShipId?: number
  enemyFormation?: number
  eventItem?: unknown
} & Partial<ReturnType<typeof simulate>>

export const createBattleResultAction = createAction<BattleResult>('@@BattleResult')

export interface BattleState {
  _status: StatusState
  result: BattleResult
}

const statusInitState: StatusState = {
  deckId: -1,
  map: -1,
  bossCell: -1,
  currentCell: -1,
  enemyFormation: 0,
  colorNo: -1,
  packet: [],
  battle: null,
  time: 0,
}

const resultInitState: BattleResult = {
  valid: false,
}

const initState: BattleState = {
  _status: statusInitState,
  result: resultInitState,
}

const isBattlePhaseAction = isAnyOf(
  createAPIReqSortieBattleResponseAction,
  createAPIReqSortieAirbattleResponseAction,
  createAPIReqSortieLdAirbattleResponseAction,
  createAPIReqCombinedBattleBattleResponseAction,
  createAPIReqCombinedBattleBattleWaterResponseAction,
  createAPIReqCombinedBattleAirbattleResponseAction,
  createAPIReqCombinedBattleLdAirbattleResponseAction,
  createAPIReqCombinedBattleEcBattleResponseAction,
  createAPIReqCombinedBattleEachBattleResponseAction,
  createAPIReqCombinedBattleEachBattleWaterResponseAction,
  createAPIReqBattleMidnightBattleResponseAction,
  createAPIReqBattleMidnightSPMidnightResponseAction,
  createAPIReqCombinedBattleMidnightBattleResponseAction,
  createAPIReqCombinedBattleSPMidnightResponseAction,
  createAPIReqCombinedBattleEcMidnightBattleResponseAction,
  createAPIReqCombinedBattleEcNightToDayResponseAction,
)

export function reducer(
  state = initState,
  action: UnknownAction,
  store?: Record<string, unknown>,
): BattleState {
  const { _status } = state

  if (createAPIPortPortResponseAction.match(action)) {
    return initState
  }

  if (createAPIReqMapStartResponseAction.match(action)) {
    const { body, postBody } = action.payload
    return {
      ...state,
      _status: {
        ..._status,
        battle: null,
        map: body.api_maparea_id * 10 + body.api_mapinfo_no,
        bossCell: body.api_bosscell_no,
        currentCell: body.api_no,
        deckId: parseInt(postBody.api_deck_id) - 1,
        colorNo: body.api_color_no,
        enemyFormation: 0,
      },
    }
  }

  if (createAPIReqMapNextResponseAction.match(action)) {
    const { body } = action.payload
    return {
      ...state,
      _status: {
        ..._status,
        currentCell: body.api_no,
        battle: null,
        colorNo: body.api_color_no,
        enemyFormation: 0,
      },
    }
  }

  if (isBattlePhaseAction(action)) {
    const { body, path, time } = action.payload
    const sortieTypeFlag = store ? getSortieType(store) : 0
    const enemyFormation = body.api_formation[1] ?? _status.enemyFormation
    const escortId = sortieTypeFlag > 0 ? 2 : -1
    const battle =
      _status.battle ??
      new Battle({
        fleet: new Fleet({
          type: sortieTypeFlag,
          main: getFleet(body.api_deck_id, store ?? {}) ?? undefined,
          escort: getFleet(escortId, store ?? {}) ?? undefined,
        }),
        packet: [],
      })
    const packetRaw: unknown = JSON.parse(JSON.stringify(body))
    const packet: Record<string, unknown> = isRecord(packetRaw) ? packetRaw : {}
    packet['poi_path'] = path
    battle.packet?.push(packet)
    const result = simulate(battle)
    return {
      ...state,
      _status: {
        ..._status,
        battle,
        result,
        enemyFormation,
        time: _status.time ? _status.time : time,
      },
    }
  }

  if (
    createAPIReqSortieBattleResultResponseAction.match(action) ||
    createAPIReqCombinedBattleBattleresultResponseAction.match(action)
  ) {
    if (_status.result) {
      const { body } = action.payload
      const isCombined = store ? getSortieType(store) > 0 : false
      const mvpCombined = createAPIReqCombinedBattleBattleresultResponseAction.match(action)
        ? action.payload.body.api_mvp_combined
        : null
      const dropItem = createAPIReqSortieBattleResultResponseAction.match(action)
        ? action.payload.body.api_get_useitem
        : undefined
      const escapeBody = body.api_escape
      const result: BattleResult = {
        ..._status.result,
        valid: true,
        time: _status.time,
        rank: body.api_win_rank,
        boss: _status.bossCell === _status.currentCell || _status.colorNo === 5,
        map: _status.map,
        mapCell: _status.currentCell,
        quest: body.api_quest_name,
        enemy: body.api_enemy_info.api_deck_name,
        combined: isCombined,
        mvp:
          isCombined && mvpCombined != null
            ? [body.api_mvp - 1, mvpCombined - 1]
            : [body.api_mvp - 1, body.api_mvp - 1],
        dropItem,
        dropShipId: body.api_get_ship?.api_ship_id ?? -1,
        enemyFormation: _status.enemyFormation,
        eventItem: body.api_get_eventitem,
      }
      // for goback_port escape support — unused here but matches original shape
      void escapeBody
      return {
        ...state,
        result,
        _status: {
          ..._status,
          battle: null,
          time: 0,
        },
      }
    }
  }

  return state
}

// Subscriber, used on battle completion.
// Need to observe on state battle.result
export function dispatchBattleResult(
  dispatch: (action: ReturnType<typeof createBattleResultAction>) => void,
  battleResult: BattleResult,
): void {
  if (!battleResult.valid) return
  dispatch(createBattleResultAction(battleResult))
  const e = new CustomEvent('battle.result', {
    bubbles: true,
    cancelable: true,
    detail: battleResult,
  })
  window.dispatchEvent(e)
}
