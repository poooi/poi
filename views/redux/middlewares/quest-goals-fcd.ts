import type { Middleware } from 'redux'

import type { RootState } from '../reducer-factory'

import {
  createAPIGetMemberRequireInfoAction,
  createInfoQuestsGoalsUpdatedAction,
  createReplaceFCDAction,
  createUpdateFCDAction,
} from '../actions'

const FCD_NAME = 'questgoal'

/**
 * Keeps `info.quests.questGoals` in step with the `questgoal` data fcd delivers.
 *
 * Two events matter, and either can come first:
 *
 * - fcd delivers the data (`@@updateFCD` on startup or a manual update,
 *   `@@replaceFCD` when a plugin window picks it up from localStorage), and
 * - `api_get_member/require_info`, where the quests slice (re)loads the bundled
 *   `quest_goal.cson` and so drops whatever was layered on it.
 *
 * Unlike questsCrossSliceMiddleware, this one acts on the state *after* the
 * action: the fcd slice must have stored the payload, and the quests slice must
 * have finished reloading its bundled table, before the merge is worth doing.
 */
export const questGoalsFcdMiddleware: Middleware<unknown, RootState> =
  (store) => (next) => (action) => {
    const result = next(action)

    const deliversQuestGoals =
      (createUpdateFCDAction.match(action) && action.payload.meta?.name === FCD_NAME) ||
      (createReplaceFCDAction.match(action) && action.payload.path === FCD_NAME)

    if (deliversQuestGoals || createAPIGetMemberRequireInfoAction.match(action)) {
      const delivered = store.getState().fcd?.questgoal
      if (delivered && Object.keys(delivered).length > 0) {
        store.dispatch(createInfoQuestsGoalsUpdatedAction({ delivered }))
      }
    }

    return result
  }
