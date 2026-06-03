import type { Middleware } from 'redux'

import { countBy, get } from 'lodash'

import type { RootState } from '../reducer-factory'

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
import { createBattleResultAction } from '../battle'

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- RootState type from store
  const state = store.getState() as RootState

  // This middleware intentionally dispatches progress actions based on the pre-action state.
  // Some quest conditions (e.g. counting equips by type when destroying them) need access to
  // state that will be mutated by the original action's reducers.

  if (createAPIReqPracticeResultResponseAction.match(action)) {
    const { api_win_rank: winRank } = action.payload.body

    const fleetId = state?.sortie?.sortieStatus?.findIndex((x) => x)
    const deckShipId = state.info?.fleets?.[fleetId ?? 0]?.api_ship || []
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
  } else if (createAPIReqMissionResultResponseAction.match(action)) {
    const { api_clear_result, api_quest_name } = action.payload.body
    if (api_clear_result > 0) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'mission_success',
          options: { mission: api_quest_name },
          delta: 1,
        }),
      )
    }
  } else if (createAPIReqNyukyoStartResponseAction.match(action)) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'repair', options: null, delta: 1 }),
    )
  } else if (createAPIReqHokyuChargeResponseAction.match(action)) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'supply', options: null, delta: 1 }),
    )
  } else if (createAPIReqKousyouCreateitemResponseAction.match(action)) {
    const { api_get_items } = action.payload.body
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'create_item',
        options: null,
        delta: api_get_items.length,
      }),
    )
  } else if (createAPIReqKousyouCreateshipResponseAction.match(action)) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'create_ship', options: null, delta: 1 }),
    )
  } else if (createAPIReqKousyouDestroyshipResponseAction.match(action)) {
    const shipIds = action.payload.postBody.api_ship_id.split(',').filter(Boolean)
    if (shipIds.length) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({
          event: 'destroy_ship',
          options: null,
          delta: shipIds.length,
        }),
      )
    }
  } else if (createAPIReqKousyouRemodelSlotResponseAction.match(action)) {
    store.dispatch(
      createInfoQuestsApplyProgressAction({ event: 'remodel_item', options: null, delta: 1 }),
    )
  } else if (createAPIReqKaisouPowerupResponseAction.match(action)) {
    if (action.payload.body.api_powerup_flag === 1) {
      store.dispatch(
        createInfoQuestsApplyProgressAction({ event: 'remodel_ship', options: null, delta: 1 }),
      )
    }
  } else if (createAPIReqKousyouDestroyitem2ResponseAction.match(action)) {
    const ids = action.payload.postBody.api_slotitem_ids.split(',').filter(Boolean)
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
  } else if (createAPIReqMapStartResponseAction.match(action)) {
    store.dispatch(createInfoQuestsApplyProgressAction({ event: 'sally', options: null, delta: 1 }))
  } else if (createAPIReqMapNextResponseAction.match(action)) {
    const { api_no: mapcell, api_maparea_id, api_mapinfo_no } = action.payload.body
    const maparea = api_maparea_id * 10 + api_mapinfo_no
    const deckShipId = state.battle?.result?.deckShipId || []
    const { shipname, shiptype, shipclass } = getFleetInfo(deckShipId, state)
    store.dispatch(
      createInfoQuestsApplyProgressAction({
        event: 'reach_mapcell',
        options: { mapcell, maparea, shipname, shiptype, shipclass },
        delta: 1,
      }),
    )
  } else if (createBattleResultAction.match(action)) {
    const result = action.payload
    const rank = String(result.rank ?? '')
    const boss = Boolean(result.boss)
    const maparea = Number(result.map)
    const mapcell = Number(result.mapCell)
    const enemyHp = result.enemyHp || []
    const enemyShipId = result.enemyShipId || []
    const deckShipId = result.deckShipId || []

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
