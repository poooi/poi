import type { Reducer } from 'redux'
import { applyMiddleware, createStore } from 'redux'

jest.mock('poi-lib-battle', () => {
  class Fleet {
    type: number
    main: unknown
    escort: unknown

    constructor(opts: { type: number; main: unknown; escort: unknown }) {
      this.type = opts.type
      this.main = opts.main
      this.escort = opts.escort
    }
  }

  class Battle {
    fleet: Fleet
    packet: unknown[]

    constructor(opts: { fleet: Fleet; packet: unknown[] }) {
      this.fleet = opts.fleet
      this.packet = opts.packet
    }
  }

  const auto = (battle: Battle) => {
    const main = Array.isArray(battle.fleet?.main) ? battle.fleet.main : []
    const escort = Array.isArray(battle.fleet?.escort) ? battle.fleet.escort : []

    const toSimShip = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return null
      const r = raw as { api_id?: number; api_nowhp?: number; api_maxhp?: number }
      return {
        raw: { api_id: typeof r.api_id === 'number' ? r.api_id : -1 },
        nowHP: typeof r.api_nowhp === 'number' ? r.api_nowhp : 0,
        initHP: typeof r.api_maxhp === 'number' ? r.api_maxhp : 0,
      }
    }

    return {
      mainFleet: (main as unknown[]).map(toSimShip).filter(Boolean),
      escortFleet: (escort as unknown[]).map(toSimShip).filter(Boolean),
      enemyFleet: [{ id: 501, nowHP: 10 }],
      enemyEscort: [],
    }
  }

  return {
    Models: { Battle, Fleet },
    Simulator: { auto },
  }
})

import portFixture from 'views/redux/info/__tests__/__fixtures__/api_port_port_typical.json'
import mapStartFixture from 'views/redux/info/__tests__/__fixtures__/api_req_map_start_updates_event_gauge_hp.json'
import mapNextFixture from 'views/redux/info/__tests__/__fixtures__/api_req_map_next_with_itemget.json'
import battleResultFixture from 'views/redux/info/__tests__/__fixtures__/api_req_sortie_battleresult_includes_member_exp.json'

import { battleSlice, dispatchBattleResult } from '../battle'
import { battleSliceMiddleware } from '../middlewares/battle-slice'

type AnyAction = { type: string; [key: string]: unknown }

type BattleSliceState = ReturnType<typeof battleSlice.reducer>
type TestRootState = Record<string, unknown> & { battle: BattleSliceState }

function createBattleStore(preloadedState: Record<string, unknown> = {}) {
  const initBattle = battleSlice.reducer(undefined, { type: '@@INIT' })
  const initialState: TestRootState = {
    ...preloadedState,
    battle: initBattle,
  }

  const rootReducer: Reducer<TestRootState, AnyAction> = (state = initialState, action) => ({
    ...state,
    battle: battleSlice.reducer(state.battle, action),
  })

  return createStore(rootReducer, initialState, applyMiddleware(battleSliceMiddleware))
}

describe('views/redux/battleSlice + middleware', () => {
  it('returns initial state', () => {
    const store = createBattleStore({})
    const state = store.getState()
    expect(state.battle.result.valid).toBe(false)
    expect(state.battle._status.deckId).toBe(-1)
    expect(state.battle._status.battle).toBe(null)
  })

  it('resets to initial state on api_port/port', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    expect(store.getState().battle._status.battle).not.toBe(null)

    const init = battleSlice.reducer(undefined, { type: '@@INIT' })
    store.dispatch({ type: '@@Response/kcsapi/api_port/port', body: portFixture.body })
    expect(store.getState().battle).toEqual(init)
  })

  it('initializes map status on api_req_map/start', () => {
    const store = createBattleStore({})
    store.dispatch({
      type: '@@Response/kcsapi/api_req_map/start',
      body: mapStartFixture.body,
      postBody: mapStartFixture.postBody,
    })

    const battle = store.getState().battle
    expect(battle._status.map).toBe(493)
    expect(battle._status.bossCell).toBe(23)
    expect(battle._status.currentCell).toBe(31)
    expect(battle._status.deckId).toBe(0)
    expect(battle._status.colorNo).toBe(4)
    expect(battle._status.enemyFormation).toBe(0)
    expect(battle._status.battle).toBe(null)
  })

  it('updates route status on api_req_map/next and clears battle status', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })

    const state0 = store.getState()
    expect(state0.battle._status.battle).not.toBe(null)
    expect(state0.battle._status.enemyFormation).toBe(2)

    store.dispatch({ type: '@@Response/kcsapi/api_req_map/next', body: mapNextFixture.body })

    const battle = store.getState().battle
    expect(battle._status.currentCell).toBe(1)
    expect(battle._status.colorNo).toBe(2)
    expect(battle._status.enemyFormation).toBe(0)
    expect(battle._status.battle).toBe(null)
  })

  it('records battle packets and preserves the first battle time', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 1, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })

    const battle1 = store.getState().battle
    expect(battle1._status.time).toBe(123)
    expect(battle1._status.enemyFormation).toBe(2)
    expect(battle1._status.battle).not.toBe(null)
    expect(battle1._status.battle && battle1._status.battle.packet).toHaveLength(1)
    expect(battle1._status.battle && battle1._status.battle.packet[0]).toEqual(
      expect.objectContaining({ poi_path: '/kcsapi/api_req_sortie/battle' }),
    )
    expect(battle1._status.result?.deckShipId).toEqual([100])

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/airbattle',
      path: '/kcsapi/api_req_sortie/airbattle',
      time: 999,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })

    const battle2 = store.getState().battle
    expect(battle2._status.time).toBe(123)
    expect(battle2._status.battle).not.toBe(null)
    expect(battle2._status.battle && battle2._status.battle.packet).toHaveLength(2)
  })

  it('ignores battleresult when there is no intermediate battle result', () => {
    const store = createBattleStore({})
    const before = store.getState().battle
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battleresult',
      body: battleResultFixture.body,
    })
    expect(store.getState().battle).toBe(before)
  })

  it('finalizes battle result on battleresult', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_map/start',
      body: mapStartFixture.body,
      postBody: mapStartFixture.postBody,
    })
    store.dispatch({ type: '@@Response/kcsapi/api_req_map/next', body: mapNextFixture.body })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battleresult',
      body: battleResultFixture.body,
    })

    const state = store.getState().battle
    expect(state.result.valid).toBe(true)
    expect(state.result.rank).toBe('S')
    expect(state.result.boss).toBe(false)
    expect(state.result.map).toBe(493)
    expect(state.result.mapCell).toBe(1)
    expect(state.result.enemy).toBe('敵前衛部隊')
    expect(state.result.mvp).toEqual([0, 0])
    expect(state._status.battle).toBe(null)
    expect(state._status.time).toBe(0)
  })

  it('marks boss=true when currentCell equals bossCell', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_map/start',
      body: {
        api_maparea_id: 1,
        api_mapinfo_no: 1,
        api_bosscell_no: 1,
        api_no: 1,
        api_color_no: 4,
      },
      postBody: { api_deck_id: '1' },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battleresult',
      body: battleResultFixture.body,
    })

    expect(store.getState().battle.result.boss).toBe(true)
  })

  it('marks boss=true when colorNo is 5', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_map/start',
      body: {
        api_maparea_id: 1,
        api_mapinfo_no: 1,
        api_bosscell_no: 99,
        api_no: 1,
        api_color_no: 4,
      },
      postBody: { api_deck_id: '1' },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_map/next',
      body: { api_no: 2, api_color_no: 5 },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battleresult',
      body: battleResultFixture.body,
    })

    expect(store.getState().battle.result.boss).toBe(true)
  })

  it('finalizes combined battle MVP correctly', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 1, sortieStatus: [true, true] },
      info: {
        fleets: {
          0: { api_ship: [100] },
          1: { api_ship: [200] },
        },
        ships: {
          100: { api_id: 100, api_ship_id: 10, api_nowhp: 9, api_maxhp: 12, api_slot: [] },
          200: { api_id: 200, api_ship_id: 20, api_nowhp: 8, api_maxhp: 11, api_slot: [] },
        },
      },
      const: { $ships: { 10: { api_name: 'A' }, 20: { api_name: 'B' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battleresult',
      body: {
        api_win_rank: 'A',
        api_quest_name: 'q',
        api_enemy_info: { api_deck_name: 'e' },
        api_mvp: 1,
        api_mvp_combined: 2,
        api_get_useitem: null,
        api_get_ship: null,
        api_get_eventitem: null,
      },
    })

    expect(store.getState().battle.result.combined).toBe(true)
    expect(store.getState().battle.result.mvp).toEqual([0, 1])
  })

  it('uses api_dock_id as deck selector when api_deck_id is missing', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_dock_id: 1 },
    })

    expect(store.getState().battle._status.result?.deckShipId).toEqual([100])
  })

  it('applies combinedFlag only when sortieStatus indicates 2 fleets', () => {
    const baseState = {
      sortie: { combinedFlag: 1, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] }, 1: { api_ship: [200] } },
        ships: {
          100: { api_id: 100, api_ship_id: 10, api_nowhp: 9, api_maxhp: 12, api_slot: [] },
          200: { api_id: 200, api_ship_id: 20, api_nowhp: 8, api_maxhp: 11, api_slot: [] },
        },
      },
      const: { $ships: { 10: { api_name: 'A' }, 20: { api_name: 'B' } } },
    }

    const storeSingle = createBattleStore(baseState)
    storeSingle.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    expect(storeSingle.getState().battle._status.result?.deckShipId).toEqual([100])

    const storeCombined = createBattleStore({
      ...baseState,
      sortie: { combinedFlag: 1, sortieStatus: [true, true] },
    })
    storeCombined.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    expect(storeCombined.getState().battle._status.result?.deckShipId).toEqual([100, 200])
  })

  it('preserves enemyFormation when api_formation is missing', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [],
          },
        },
      },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })
    expect(store.getState().battle._status.enemyFormation).toBe(2)

    store.dispatch({
      type: '@@Response/kcsapi/api_req_combined_battle/ec_night_to_day',
      path: '/kcsapi/api_req_combined_battle/ec_night_to_day',
      time: 999,
      body: { api_deck_id: 1 },
    })
    expect(store.getState().battle._status.enemyFormation).toBe(2)
  })

  it('hydrates fleet ships with poi_slot/poi_slot_ex and strips api_info', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: [100] } },
        ships: {
          100: {
            api_id: 100,
            api_ship_id: 10,
            api_nowhp: 9,
            api_maxhp: 12,
            api_slot: [300, 999],
            api_slot_ex: 301,
            api_yomi: 'x',
          },
        },
        equips: {
          300: { api_slotitem_id: 900, api_info: { x: 1 } },
          301: { api_slotitem_id: 901, api_info: { y: 2 } },
        },
      },
      const: {
        $ships: { 10: { api_name: 'TestShip' } },
        $equips: {
          900: { api_name: 'MainGun' },
          901: { api_name: 'ExGun' },
        },
      },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })

    const st = store.getState().battle
    expect(st._status.battle).not.toBe(null)

    const battle = st._status.battle
    const fleet =
      battle && typeof battle === 'object' && 'fleet' in battle ? battle.fleet : undefined
    const main = fleet && typeof fleet === 'object' && 'main' in fleet ? fleet.main : undefined
    expect(Array.isArray(main)).toBe(true)

    const ship = Array.isArray(main) ? (main[0] as Record<string, unknown>) : {}
    expect(ship.poi_slot).toEqual([expect.objectContaining({ api_name: 'MainGun' }), null])
    expect(ship.poi_slot_ex).toEqual(expect.objectContaining({ api_name: 'ExGun' }))
    expect(((ship.poi_slot as unknown[])[0] as Record<string, unknown>).api_info).toBeUndefined()
    expect((ship.poi_slot_ex as Record<string, unknown>).api_info).toBeUndefined()
    expect(ship.api_slot).toBeUndefined()
    expect(ship.api_slot_ex).toBeUndefined()
    expect(ship.api_yomi).toBeUndefined()
  })

  it('handles invalid fleet shape (api_ship not array)', () => {
    const store = createBattleStore({
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      info: {
        fleets: { 0: { api_ship: 123 } },
        ships: {},
      },
      const: { $ships: {} },
    })

    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })

    expect(store.getState().battle._status.result?.deckShipId).toEqual([])
  })

  it('uses post-reduction rootState when other reducers update on the same action', () => {
    type RootState = {
      info?: { fleets?: Record<string, { api_ship?: number[] }>; ships?: Record<string, unknown> }
      const?: { $ships?: Record<string, unknown> }
      sortie?: { combinedFlag?: number; sortieStatus?: boolean[] }
      battle?: BattleSliceState
    }

    const initBattle = battleSlice.reducer(undefined, { type: '@@INIT' })
    const initialState: RootState = {
      info: { fleets: {}, ships: {} },
      const: { $ships: { 10: { api_name: 'TestShip' } } },
      sortie: { combinedFlag: 0, sortieStatus: [true] },
      battle: initBattle,
    }

    const rootReducer: Reducer<RootState, AnyAction> = (state = initialState, action) => {
      const nextState: RootState = { ...state }

      // Simulate another reducer updating info state on the same API action.
      if (action.type === '@@Response/kcsapi/api_req_sortie/battle') {
        nextState.info = {
          fleets: { 0: { api_ship: [100] } },
          ships: {
            100: {
              api_id: 100,
              api_ship_id: 10,
              api_nowhp: 9,
              api_maxhp: 12,
              api_slot: [],
            },
          },
        }
      }

      nextState.battle = battleSlice.reducer(state.battle!, action)
      return nextState
    }

    const store = createStore(rootReducer, initialState, applyMiddleware(battleSliceMiddleware))
    store.dispatch({
      type: '@@Response/kcsapi/api_req_sortie/battle',
      path: '/kcsapi/api_req_sortie/battle',
      time: 123,
      body: { api_formation: [1, 2, 3], api_deck_id: 1 },
    })

    expect((store.getState().battle as BattleSliceState)._status.result?.deckShipId).toEqual([100])
  })
})

describe('dispatchBattleResult', () => {
  it('does nothing when result is invalid', () => {
    const dispatch = jest.fn()

    const win = { dispatchEvent: jest.fn() }
    // @ts-expect-error jest env is not a browser; provide minimal window stub
    globalThis.window = win

    dispatchBattleResult(dispatch, {
      valid: false,
      deckShipId: [],
      deckHp: [],
      deckInitHp: [],
      enemyShipId: [],
      enemyHp: [],
    })

    expect(dispatch).not.toHaveBeenCalled()
    expect(win.dispatchEvent).not.toHaveBeenCalled()
  })

  it('dispatches @@BattleResult and a browser event for valid result', () => {
    const dispatch = jest.fn()

    const win = { dispatchEvent: jest.fn() }
    // @ts-expect-error jest env is not a browser; provide minimal window stub
    globalThis.window = win

    const result = {
      valid: true,
      deckShipId: [1],
      deckHp: [1],
      deckInitHp: [2],
      enemyShipId: [501],
      enemyHp: [10],
    }

    dispatchBattleResult(dispatch, result)

    expect(dispatch).toHaveBeenCalledWith({
      type: '@@BattleResult',
      result,
    })
    expect(win.dispatchEvent).toHaveBeenCalledTimes(1)
    expect(win.dispatchEvent.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        detail: result,
      }),
    )
  })
})
