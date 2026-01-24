import { countBy, get } from 'lodash'

import {
  createAPIReqPracticeResultResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqNyukyoStartResponseAction,
  createAPIReqHokyuChargeResponseAction,
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouCreateshipResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqMapStartResponseAction,
  createAPIReqMapNextResponseAction,
  createInfoQuestsApplyProgressAction,
} from '../actions'

import type { Middleware } from 'redux'

type RootState = {
  info?: {
    ships?: Record<string, { api_ship_id?: number }>
    fleets?: Record<string, { api_ship?: number[] }>
    equips?: Record<string, { api_slotitem_id?: number }>
  }
  const?: {
    $ships?: Record<string, { api_name?: string; api_stype?: number; api_ctype?: number }>
    $equips?: Record<string, { api_type?: number[] }>
  }
  sortie?: {
    sortieStatus?: boolean[]
  }
  battle?: {
    result?: {
      deckShipId?: number[]
    }
  }
}

type AnyAction = {
  type: string
  payload?: {
    body?: Record<string, unknown>
    postBody?: Record<string, unknown>
  }
  result?: {
    rank?: string
    boss?: boolean
    map?: number
    mapCell?: number
    enemyHp?: number[]
    enemyShipId?: number[]
    deckShipId?: number[]
  }
}

function getFleetInfo(
  deckShipId: number[],
  state: RootState,
): { shipname: string[]; shiptype: number[]; shipclass: number[] } {
  const deckShipAPIShipId = deckShipId.map((id) => get(state, `info.ships.${id}.api_ship_id`, -1))
  const shipname = deckShipAPIShipId
    .map((id) => get(state, `const.$ships.${id}.api_name`, ''))
    .filter((name: string) => name.length > 0)
  const shiptype = deckShipAPIShipId
    .map((id) => get(state, `const.$ships.${id}.api_stype`, -1))
    .filter((id: number) => id > 0)
  const shipclass = deckShipAPIShipId
    .map((id) => get(state, `const.$ships.${id}.api_ctype`, -1))
    .filter((id: number) => id > 0)
  return { shipname, shiptype, shipclass }
}

export const questsCrossSliceMiddleware: Middleware = (store) => (next) => (action) => {
  const state = store.getState() as RootState
  const a = action as AnyAction

  if (a.type === createAPIReqPracticeResultResponseAction.type) {
    const body = a.payload?.body || {}
    const winRank = String(body.api_win_rank || '')

    const fleetId = (get(state, 'sortie.sortieStatus', []) as boolean[]).findIndex((x) => x)
    const deckShipId = (get(state, `info.fleets.${fleetId}.api_ship`, []) as number[]) || []
    const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, state)

    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'practice',
        options: { shipname, shiptype, shipclass },
        delta: 1,
      }),
    )

    if (['S', 'A', 'B'].includes(winRank)) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'practice_win',
          options: { shipname, shiptype, shipclass },
          delta: 1,
        }),
      )
    }
    if (['S', 'A'].includes(winRank)) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'practice_win_a',
          options: { shipname, shiptype, shipclass },
          delta: 1,
        }),
      )
    }
    if (winRank === 'S') {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'practice_win_s',
          options: { shipname, shiptype, shipclass },
          delta: 1,
        }),
      )
    }
  } else if (a.type === createAPIReqMissionResultResponseAction.type) {
    const body = a.payload?.body || {}
    if (Number(body.api_clear_result) > 0) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'mission_success',
          options: { mission: String(body.api_quest_name || '') },
          delta: 1,
        }),
      )
    }
  } else if (a.type === createAPIReqNyukyoStartResponseAction.type) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'repair', options: null, delta: 1 }),
    )
  } else if (a.type === createAPIReqHokyuChargeResponseAction.type) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'supply', options: null, delta: 1 }),
    )
  } else if (a.type === createAPIReqKousyouCreateitemResponseAction.type) {
    const body = a.payload?.body || {}
    const items = (body.api_get_items as unknown[]) || []
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'create_item',
        options: null,
        delta: Array.isArray(items) ? items.length : 0,
      }),
    )
  } else if (a.type === createAPIReqKousyouCreateshipResponseAction.type) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'create_ship', options: null, delta: 1 }),
    )
  } else if (a.type === createAPIReqKousyouDestroyshipResponseAction.type) {
    const shipIds = String(a.payload?.postBody?.api_ship_id || '')
      .split(',')
      .filter(Boolean)
    if (shipIds.length) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'destroy_ship',
          options: null,
          delta: shipIds.length,
        }),
      )
    }
  } else if (a.type === createAPIReqKousyouRemodelSlotResponseAction.type) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'remodel_item', options: null, delta: 1 }),
    )
  } else if (a.type === createAPIReqKaisouPowerupResponseAction.type) {
    const body = a.payload?.body || {}
    if (Number(body.api_powerup_flag) === 1) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({ event: 'remodel_ship', options: null, delta: 1 }),
      )
    }
  } else if (a.type === createAPIReqKousyouDestroyitem2ResponseAction.type) {
    const slotitems = String(a.payload?.postBody?.api_slotitem_ids || '')
    const ids = slotitems.split(',').filter(Boolean)
    if (ids.length) {
      const typeCounts = countBy(ids, (id) => {
        const equipId = get(state, `info.equips.${id}.api_slotitem_id`)
        return get(state, `const.$equips.${equipId}.api_type.2`)
      })

      for (const slotitemType2 of Object.keys(typeCounts)) {
        const t = Number(slotitemType2)
        if (!Number.isFinite(t)) continue
        store.dispatch(
          createInfoQuestsApplyProgressAction({
            event: 'destory_item',
            options: { slotitemType2: t },
            delta: typeCounts[slotitemType2] || 0,
          }),
        )
      }

      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'destory_item',
          options: { times: 1 },
          delta: 1,
        }),
      )
    }
  } else if (a.type === createAPIReqMapStartResponseAction.type) {
    store.dispatch(createInfoQuestsApplyProgressAction({ event: 'sally', options: null, delta: 1 }))
  } else if (a.type === createAPIReqMapNextResponseAction.type) {
    const body = a.payload?.body || {}
    const mapcell = Number(body.api_no)
    const maparea = Number(body.api_maparea_id) * 10 + Number(body.api_mapinfo_no)
    const deckShipId = (get(state, 'battle.result.deckShipId', []) as number[]) || []
    const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, state)
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'reach_mapcell',
        options: { mapcell, maparea, shipname, shiptype, shipclass },
        delta: 1,
      }),
    )
  } else if (a.type === '@@BattleResult') {
    const result = a.result || {}
    const rank = String(result.rank || '')
    const boss = Boolean(result.boss)
    const maparea = Number(result.map)
    const mapcell = Number(result.mapCell)
    const enemyHp = (result.enemyHp || []) as number[]
    const enemyShipId = (result.enemyShipId || []) as number[]
    const deckShipId = (result.deckShipId || []) as number[]

    const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, state)
    const battleMeta = { shipname, shiptype, shipclass, mapcell, maparea }

    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'battle', options: battleMeta, delta: 1 }),
    )
    if (['S', 'A', 'B'].includes(rank)) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({ event: 'battle_win', options: battleMeta, delta: 1 }),
      )
    }
    if (rank === 'S') {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'battle_rank_s',
          options: battleMeta,
          delta: 1,
        }),
      )
    }

    if (boss) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'battle_boss',
          options: battleMeta,
          delta: 1,
        }),
      )
      if (['S', 'A', 'B'].includes(rank)) {
        store.dispatch(
          createInfoQuestsApplyProgressAction({
            event: 'battle_boss_win',
            options: battleMeta,
            delta: 1,
          }),
        )
      }
      if (['S', 'A'].includes(rank)) {
        store.dispatch(
          createInfoQuestsApplyProgressAction({
            event: 'battle_boss_win_rank_a',
            options: battleMeta,
            delta: 1,
          }),
        )
      }
      if (rank === 'S') {
        store.dispatch(
          createInfoQuestsApplyProgressAction({
            event: 'battle_boss_win_rank_s',
            options: battleMeta,
            delta: 1,
          }),
        )
      }
    }

    enemyShipId.forEach((shipId, idx) => {
      if (shipId === -1) return
      if ((enemyHp[idx] || 0) > 0) return
      const shipType = get(state, `const.$ships.${shipId}.api_stype`)
      if (typeof shipType === 'number' && [7, 11, 13, 15].includes(shipType)) {
        store.dispatch(
          createInfoQuestsApplyProgressAction({
            event: 'sinking',
            options: { shipType },
            delta: 1,
          }),
        )
      }
    })
  }

  return next(action)
}
