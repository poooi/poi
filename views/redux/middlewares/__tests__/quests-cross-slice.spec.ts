import { applyMiddleware, createStore } from 'redux'

import {
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqPracticeResultResponseAction,
  createInfoQuestsApplyProgressAction,
} from 'views/redux/actions'

import practiceResultFixture from 'views/redux/info/__tests__/__fixtures__/api_req_practice_battle_result_rank_a.json'
import missionResultFixture from 'views/redux/info/__tests__/__fixtures__/api_req_mission_result_success.json'
import destroyItemFixture from 'views/redux/info/__tests__/__fixtures__/api_req_kousyou_destroyitem2_multiple_slots.json'
import mapNextFixture from 'views/redux/info/__tests__/__fixtures__/api_req_map_next_with_itemget.json'

import { questsCrossSliceMiddleware } from '../quests-cross-slice'

type AnyAction = { type: string; payload?: unknown }

type PayloadOf<AC> = AC extends (payload: infer P) => unknown ? P : never

type ApplyProgressAction = ReturnType<typeof createInfoQuestsApplyProgressAction>

function isApplyProgressAction(action: AnyAction): action is ApplyProgressAction {
  return action.type === createInfoQuestsApplyProgressAction.type
}

function createCaptureStore(preloadedState: unknown) {
  const seen: AnyAction[] = []
  const captureMiddleware = () => (next: (a: AnyAction) => unknown) => (action: AnyAction) => {
    seen.push(action)
    return next(action)
  }

  const store = createStore(
    // middleware reads store.getState(); reducer can be a noop
    (state = preloadedState) => state,
    preloadedState,
    applyMiddleware(questsCrossSliceMiddleware, captureMiddleware),
  )

  return {
    store,
    seen,
  }
}

describe('questsCrossSliceMiddleware', () => {
  it('dispatches practice progress events with fleet meta', () => {
    const { store, seen } = createCaptureStore({
      sortie: { sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [1] } },
        ships: { 1: { api_ship_id: 1 } },
      },
      const: {
        $ships: { 1: { api_name: 'A', api_stype: 1, api_ctype: 1 } },
      },
    })

    store.dispatch(
      createAPIReqPracticeResultResponseAction(
        practiceResultFixture satisfies PayloadOf<typeof createAPIReqPracticeResultResponseAction>,
      ),
    )

    const dispatched = seen.filter(isApplyProgressAction)
    expect(dispatched).toHaveLength(3)

    const payloads = dispatched.map((a) => a.payload)
    expect(payloads.map((p) => p.event)).toEqual(['practice', 'practice_win', 'practice_win_a'])
    payloads.forEach((p) => {
      expect(p.delta).toBe(1)
      expect(p.options).toEqual({
        shipname: ['A'],
        shiptype: [1],
        shipclass: [1],
      })
    })
  })

  it('dispatches mission_success with mission name', () => {
    const { store, seen } = createCaptureStore({})

    store.dispatch(
      createAPIReqMissionResultResponseAction(
        missionResultFixture satisfies PayloadOf<typeof createAPIReqMissionResultResponseAction>,
      ),
    )

    const dispatched = seen.filter(isApplyProgressAction)
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].payload).toEqual({
      event: 'mission_success',
      options: { mission: '長距離練習航海' },
      delta: 1,
    })
  })

  it('dispatches destroy_item by type2 counts and times', () => {
    const { store, seen } = createCaptureStore({
      info: {
        equips: {
          46555: { api_slotitem_id: 10 },
          46569: { api_slotitem_id: 10 },
          46597: { api_slotitem_id: 10 },
          46624: { api_slotitem_id: 10 },
          46546: { api_slotitem_id: 10 },
          46357: { api_slotitem_id: 10 },
        },
      },
      const: {
        $equips: {
          10: { api_type: [0, 0, 2] },
        },
      },
    })

    store.dispatch(
      createAPIReqKousyouDestroyitem2ResponseAction(
        destroyItemFixture satisfies PayloadOf<
          typeof createAPIReqKousyouDestroyitem2ResponseAction
        >,
      ),
    )

    const dispatched = seen.filter(isApplyProgressAction)
    expect(dispatched).toHaveLength(2)

    expect(dispatched[0].payload).toEqual({
      event: 'destory_item',
      options: { slotitemType2: 2 },
      delta: 6,
    })
    expect(dispatched[1].payload).toEqual({
      event: 'destory_item',
      options: { times: 1 },
      delta: 1,
    })
  })

  it('dispatches reach_mapcell with map meta and fleet meta', () => {
    const { store, seen } = createCaptureStore({
      battle: { result: { deckShipId: [1] } },
      info: {
        ships: { 1: { api_ship_id: 1 } },
      },
      const: {
        $ships: { 1: { api_name: 'A', api_stype: 1, api_ctype: 1 } },
      },
    })

    store.dispatch(
      createAPIReqMapNextResponseAction(
        mapNextFixture satisfies PayloadOf<typeof createAPIReqMapNextResponseAction>,
      ),
    )

    const dispatched = seen.filter(isApplyProgressAction)
    expect(dispatched).toHaveLength(1)

    expect(dispatched[0].payload).toEqual({
      event: 'reach_mapcell',
      options: {
        mapcell: 1,
        maparea: 22,
        shipname: ['A'],
        shiptype: [1],
        shipclass: [1],
      },
      delta: 1,
    })
  })
})
