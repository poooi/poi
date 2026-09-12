import { applyMiddleware, combineReducers, createStore } from 'redux'
import {
  createAPIGetMemberRequireInfoAction,
  createReplaceFCDAction,
  createUpdateFCDAction,
} from 'views/redux/actions'
import { reducer as fcdReducer } from 'views/redux/fcd'
import { questGoalsFcdMiddleware } from 'views/redux/middlewares/quest-goals-fcd'
import Scheduler from 'views/services/scheduler'

import type { QuestGoalTable, QuestRecord, QuestsState } from '../quests'

import { mergeQuestGoals, reducer as questsReducer, resyncQuestRecords } from '../quests'
import { resetBundledQuestGoals } from '../quests/goals'

// The bundled quest_goal.cson is read through CSON; a small table stands in for
// it so the assertions do not track the real data file.
const BUNDLED: QuestGoalTable = {
  201: { type: 1, battle_win: { description: '勝利', required: 1, init: 0 } },
  303: { type: 3, practice: { description: '演習', required: 3, init: 0 } },
}

jest.mock('cson', () => ({
  parseCSONFile: jest.fn((file: string) => {
    if (String(file).includes('quest_goal')) return BUNDLED
    throw new Error('no such file')
  }),
  stringify: (value: unknown) => JSON.stringify(value),
}))

jest.mock('views/utils/file-writer', () => ({
  __esModule: true,
  default: class FileWriter {
    write = jest.fn()
  },
}))

const spec = it

beforeEach(() => {
  resetBundledQuestGoals()
})

// The quests module pulls in Scheduler, whose tick would keep jest alive.
afterAll(() => {
  Scheduler._stopTick()
})

describe('mergeQuestGoals', () => {
  spec('falls back to the bundled table when fcd delivered nothing', () => {
    expect(mergeQuestGoals()).toEqual(BUNDLED)
    expect(mergeQuestGoals({})).toEqual(BUNDLED)
  })

  spec('layers a delivered quest over the bundled one, wholesale', () => {
    const merged = mergeQuestGoals({
      303: { type: 3, practice_win: { description: '演習勝利', required: 5, init: 0 } },
    })

    // The delivered definition replaces the bundled one, dropping its subgoal...
    expect(merged[303]).toEqual({
      type: 3,
      practice_win: { description: '演習勝利', required: 5, init: 0 },
    })
    // ...while a quest the payload does not mention keeps its bundled definition,
    // because the payload can predate this build.
    expect(merged[201]).toEqual(BUNDLED[201])
  })

  spec('adds a quest that only fcd knows about', () => {
    const merged = mergeQuestGoals({
      313: { type: 4, resetInterval: 1, practice_win: { required: 8, init: 0 } },
    })
    expect(Object.keys(merged).sort()).toEqual(['201', '303', '313'])
  })

  spec('does not hand out the cached bundled table', () => {
    const first = mergeQuestGoals()
    first[201] = { type: 1, battle_win: { required: 99 } }
    expect(mergeQuestGoals()[201]).toEqual(BUNDLED[201])
  })
})

describe('resyncQuestRecords', () => {
  const records: Record<string | number, QuestRecord> = {
    201: { id: 201, battle_win: { count: 1, required: 1, description: '勝利' } },
    303: { id: 303, practice: { count: 2, required: 3, description: '演習' } },
  }

  spec('returns the same records when nothing changed', () => {
    expect(resyncQuestRecords(records, BUNDLED)).toBe(records)
  })

  spec('keeps the counted progress when required changes', () => {
    const synced = resyncQuestRecords(records, {
      ...BUNDLED,
      303: { type: 3, practice: { description: '演習', required: 6, init: 0 } },
    })
    expect(synced[303]).toEqual({
      id: 303,
      practice: { count: 2, required: 6, description: '演習' },
    })
  })

  spec('clamps a count that now exceeds the requirement', () => {
    const synced = resyncQuestRecords(records, {
      ...BUNDLED,
      303: { type: 3, practice: { description: '演習', required: 1, init: 0 } },
    })
    expect(synced[303]).toEqual({
      id: 303,
      practice: { count: 1, required: 1, description: '演習' },
    })
  })

  spec('drops a subgoal the new definition no longer has, and adds a new one', () => {
    const synced = resyncQuestRecords(records, {
      ...BUNDLED,
      303: { type: 3, practice_win: { description: '演習勝利', required: 2, init: 0 } },
    })
    expect(synced[303]).toEqual({
      id: 303,
      practice_win: { count: 0, required: 2, description: '演習勝利' },
    })
  })

  spec('leaves a record with no matching goal alone', () => {
    const orphan = { 999: { id: 999, battle: { count: 1, required: 2 } } }
    expect(resyncQuestRecords(orphan, BUNDLED)).toBe(orphan)
  })
})

describe('questGoalsFcdMiddleware', () => {
  const deliveredPayload = {
    meta: { name: 'questgoal', version: '2026/09/12/01' },
    path: 'questgoal' as const,
    data: {
      303: { type: 3 as const, practice: { description: '演習', required: 6, init: 0 } },
      313: { type: 4 as const, resetInterval: 1, practice_win: { required: 8, init: 0 } },
    },
  }

  const requireInfoPayload = {
    method: 'GET',
    path: '/kcsapi/api_get_member/require_info',
    body: { api_basic: { api_member_id: 42 } },
    postBody: { api_verno: '1' },
    time: 0,
  }

  const createTestStore = (preloadedQuests?: Partial<QuestsState>) => {
    const rootReducer = combineReducers({
      fcd: fcdReducer,
      info: combineReducers({ quests: questsReducer }),
    })
    return createStore(
      rootReducer,
      preloadedQuests
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          ({ info: { quests: preloadedQuests } } as never)
        : undefined,
      applyMiddleware(questGoalsFcdMiddleware),
    )
  }

  const questGoalsOf = (store: ReturnType<typeof createTestStore>) =>
    store.getState().info.quests.questGoals

  spec('applies delivered goals on top of the bundled table', () => {
    const store = createTestStore()
    store.dispatch(createUpdateFCDAction(deliveredPayload))

    expect(questGoalsOf(store)[313]).toEqual(deliveredPayload.data[313])
    expect(questGoalsOf(store)[201]).toEqual(BUNDLED[201])
  })

  spec('survives require_info reloading the bundled table afterwards', () => {
    const store = createTestStore()
    store.dispatch(createUpdateFCDAction(deliveredPayload))
    // @ts-expect-error a minimal require_info body is enough for the quests slice
    store.dispatch(createAPIGetMemberRequireInfoAction(requireInfoPayload))

    expect(questGoalsOf(store)[313]).toEqual(deliveredPayload.data[313])
    expect(questGoalsOf(store)[201]).toEqual(BUNDLED[201])
  })

  spec('applies goals that arrive after require_info', () => {
    const store = createTestStore()
    // @ts-expect-error a minimal require_info body is enough for the quests slice
    store.dispatch(createAPIGetMemberRequireInfoAction(requireInfoPayload))
    expect(questGoalsOf(store)[313]).toBeUndefined()

    store.dispatch(createUpdateFCDAction(deliveredPayload))
    expect(questGoalsOf(store)[313]).toEqual(deliveredPayload.data[313])
  })

  spec('picks up the copy a plugin window replays from localStorage', () => {
    const store = createTestStore()
    store.dispatch(createReplaceFCDAction({ path: 'questgoal', data: deliveredPayload.data }))

    expect(questGoalsOf(store)[313]).toEqual(deliveredPayload.data[313])
  })

  spec('ignores fcd data for other paths', () => {
    const store = createTestStore()
    store.dispatch(
      createUpdateFCDAction({
        meta: { name: 'shiptag', version: '2026/09/12/01' },
        path: 'shiptag',
        data: {
          color: [],
          fleetname: { 'zh-CN': [], 'zh-TW': [], 'en-US': [], 'ja-JP': [] },
          mapname: [],
        },
      }),
    )

    expect(questGoalsOf(store)).toEqual({})
  })

  spec('re-syncs existing records and starts tracking a newly delivered quest', () => {
    const store = createTestStore({
      records: { 303: { id: 303, practice: { count: 2, required: 3, description: '演習' } } },
      activeQuests: {
        // @ts-expect-error only api_no matters for record creation
        313: { detail: { api_no: 313 }, time: 0 },
      },
      questGoals: {},
      activeCapacity: 5,
      activeNum: 1,
    })

    store.dispatch(createUpdateFCDAction(deliveredPayload))

    const { records } = store.getState().info.quests
    expect(records[303]).toEqual({
      id: 303,
      practice: { count: 2, required: 6, description: '演習' },
    })
    expect(records[313]).toEqual({ id: 313, practice_win: { count: 0, required: 8 } })
  })
})
