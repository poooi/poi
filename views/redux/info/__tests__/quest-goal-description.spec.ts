import fs from 'fs'
import path from 'path'
import Scheduler from 'views/services/scheduler'

import type { QuestGoalTable } from '../quests'

import { mergeQuestGoals } from '../quests'
import { describeQuestGoals, describeSubgoal, generateDescription } from '../quests/description'
import { loadBundledQuestGoals, resetBundledQuestGoals } from '../quests/goals'

// `lib/__mocks__/cson.ts` is picked up automatically, and the real parseCSONFile does not
// run under jest; these tests read the real goal files through the real parser.
jest.mock('cson', () => {
  const CSON = jest.requireActual<{ parse: (text: string) => unknown }>('cson')
  const { readFileSync } = jest.requireActual<{
    readFileSync: (file: string, encoding: 'utf-8') => string
  }>('fs')
  return { parseCSONFile: (file: string) => CSON.parse(readFileSync(file, 'utf-8')) }
})

afterEach(() => {
  resetBundledQuestGoals()
})

// The quests module pulls in Scheduler, whose tick would keep jest alive.
afterAll(() => {
  Scheduler._stopTick()
})

describe('generateDescription', () => {
  it('names the map and rank of a boss event on one map', () => {
    expect(generateDescription('battle_boss_win_rank_s@13', { maparea: [13], required: 1 })).toBe(
      '1-3 S',
    )
    expect(generateDescription('battle_boss_win_rank_a', { maparea: [72], required: 1 })).toBe(
      '7-2 A',
    )
    expect(generateDescription('battle_boss_win', { maparea: [44], required: 1 })).toBe('4-4 勝利')
    expect(generateDescription('battle_boss', { maparea: [16], required: 1 })).toBe('1-6 ボス')
  })

  it('uses the translated label of an event without a map', () => {
    expect(generateDescription('battle', { required: 1 })).toBe('作戰')
    expect(generateDescription('battle_boss_win', { required: 1 })).toBe('BOSS戰勝利')
    expect(generateDescription('practice_win_s', { required: 1 })).toBe('演習勝利 S')
    expect(generateDescription('mission_success', { required: 1 })).toBe('遠征')
    expect(generateDescription('destory_item', { required: 1 })).toBe('廃棄')
    expect(generateDescription('sinking', { shipType: [7, 11], required: 1 })).toBe('敵空母')
  })

  it('leaves out what the subgoal alone cannot say', () => {
    // a cell number means nothing to a player
    expect(
      generateDescription('reach_mapcell@16', { maparea: [16], mapcell: [14, 17], required: 1 }),
    ).toBeUndefined()
    expect(
      generateDescription('battle_boss_win_rank_s', { maparea: [72], mapcell: [15], required: 1 }),
    ).toBeUndefined()
    // expedition and equipment names need master data
    expect(
      generateDescription('mission_success', { mission: ['海上護衛任務'], required: 1 }),
    ).toBeUndefined()
    expect(generateDescription('destory_item', { slotitemId: [19], required: 1 })).toBeUndefined()
    expect(
      generateDescription('destory_item', { slotitemType2: [21], required: 1 }),
    ).toBeUndefined()
    // a subgoal spanning several maps, and an enemy type with no label
    expect(
      generateDescription('battle_boss_win_rank_s', { maparea: [11, 12], required: 1 }),
    ).toBeUndefined()
    expect(generateDescription('sinking', { shipType: [2], required: 1 })).toBeUndefined()
  })
})

describe('describeSubgoal', () => {
  it('prefers the description the goal file gives', () => {
    const subgoal = { maparea: [74], mapcell: [15], description: '7-4-O 到達', required: 1 }
    expect(describeSubgoal('reach_mapcell@74O', subgoal)).toBe('7-4-O 到達')
    expect(describeSubgoal('battle', { required: 1 })).toBe('作戰')
  })
})

describe('describeQuestGoals', () => {
  it('fills missing descriptions without touching its input', () => {
    const table: QuestGoalTable = {
      303: { type: 3, practice: { required: 3, init: 0 } },
      966: { 'reach_mapcell@74O': { maparea: [74], mapcell: [15], required: 1 } },
    }
    const before = JSON.parse(JSON.stringify(table))

    const described = describeQuestGoals(table)

    expect(described[303]).toEqual({
      type: 3,
      practice: { description: '演習', required: 3, init: 0 },
    })
    // no description to generate: the subgoal is kept as it is
    expect(described[966]).toEqual(table[966])
    expect(table).toEqual(before)
  })

  it('gives every subgoal of the real goal table a description', () => {
    const missing: string[] = []
    for (const [id, goal] of Object.entries(loadBundledQuestGoals())) {
      for (const [key, subgoal] of Object.entries(goal)) {
        if (typeof subgoal !== 'object' || subgoal === null) continue
        if (typeof subgoal.description !== 'string' || subgoal.description === '') {
          missing.push(`${id} ${key}`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})

describe('bundled quest goals', () => {
  it('load the same descriptions the fcd payload carries', () => {
    const payload: unknown = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'assets', 'data', 'fcd', 'questgoal.json'), 'utf-8'),
    )
    if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
      throw new Error('questgoal.json has no data')
    }
    expect(loadBundledQuestGoals()).toEqual(payload.data)
  })

  it('fill in the descriptions of a delivered quest too', () => {
    const merged = mergeQuestGoals({ 303: { type: 3, practice_win: { required: 5, init: 0 } } })
    expect(merged[303]).toEqual({
      type: 3,
      practice_win: { description: '演習勝利', required: 5, init: 0 },
    })
  })
})
