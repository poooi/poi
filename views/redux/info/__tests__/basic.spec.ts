import {
  createAPIGetMemberRequireInfoAction,
  createAPIPortPortResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqPracticeResultResponseAction,
  createAPIReqSortieBattleResultResponseAction,
} from 'views/redux/actions'

import { reducer } from '../basic'

import portFixture from './__fixtures__/api_port_port_typical.json'
import requireInfoFixture from './__fixtures__/api_get_member_require_info_includes_kdock.json'
import missionResultFixture from './__fixtures__/api_req_mission_result_success.json'
import practiceResultFixture from './__fixtures__/api_req_practice_battle_result_rank_a.json'
import sortieBattleResultFixture from './__fixtures__/api_req_sortie_battleresult_includes_member_exp.json'

describe('basic reducer', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('should return current state for unknown actions', () => {
    const currentState = { api_member_id: '100', api_level: 10 }
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_port/port', () => {
    const result = reducer({}, createAPIPortPortResponseAction(portFixture))
    expect(result.api_member_id).toBeDefined()
    expect(result.api_level).toBeDefined()
  })

  it('should handle api_get_member/require_info - member_id as string', () => {
    const payload: Parameters<typeof createAPIGetMemberRequireInfoAction>[0] =
      // Narrow fixture: this JSON intentionally contains only the fields used by reducers/tests.
      requireInfoFixture as Parameters<typeof createAPIGetMemberRequireInfoAction>[0]
    const result = reducer({}, createAPIGetMemberRequireInfoAction(payload))
    expect(result.api_member_id).toBe('123')
  })

  it('should handle api_req_mission/result', () => {
    const result = reducer(
      { api_level: 10 },
      createAPIReqMissionResultResponseAction(missionResultFixture),
    )
    expect(result.api_level).toBeDefined()
  })

  it('should handle api_req_practice/battle_result', () => {
    const result = reducer(
      { api_level: 10, api_experience: 1 },
      createAPIReqPracticeResultResponseAction(practiceResultFixture),
    )
    expect(result.api_level).toBeDefined()
    expect(result.api_experience).toBeDefined()
  })

  it('should handle api_req_sortie/battleresult', () => {
    const payload: Parameters<typeof createAPIReqSortieBattleResultResponseAction>[0] = {
      ...sortieBattleResultFixture,
      postBody: undefined,
    }
    const result = reducer(
      { api_level: 10, api_experience: 1 },
      createAPIReqSortieBattleResultResponseAction(payload),
    )
    expect(result.api_level).toBeDefined()
    expect(result.api_experience).toBeDefined()
  })
})
