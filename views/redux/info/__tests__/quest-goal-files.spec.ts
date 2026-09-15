import type { QuestGoalTable } from '../quests'

import { loadBundledQuestGoals, resetBundledQuestGoals } from '../quests/goals'

// Every file in assets/data/quest_goal/ is parsed on its own. These two stand in for a
// broken file: CSON returns (rather than throws) a parse error, and a list parses fine
// but is not a table of quests. Every other real file parses to a one-quest table.
const mockBroken: Record<string, unknown> = {
  'daily.cson': new Error('Unexpected token'),
  'weekly.cson': [{ practice: { required: 1 } }],
}

jest.mock('cson', () => ({
  parseCSONFile: jest.fn((file: string) => {
    const name = String(file).split(/[\\/]/).pop() ?? ''
    return name in mockBroken ? mockBroken[name] : { [name]: { practice: { required: 1 } } }
  }),
}))

afterEach(() => {
  resetBundledQuestGoals()
})

describe('loadBundledQuestGoals', () => {
  it('skips a broken or non-table goal file and keeps the others', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const goals: QuestGoalTable = loadBundledQuestGoals()

    expect(goals).not.toHaveProperty(['daily.cson'])
    // the list must not leak in under numeric ids
    expect(goals).not.toHaveProperty(['0'])
    expect(goals).toHaveProperty(['monthly.cson'])
    expect(goals).toHaveProperty(['one-time-sortie-1.cson'])
    expect(warn).toHaveBeenCalledTimes(2)

    warn.mockRestore()
  })
})
