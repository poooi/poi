import { includes } from 'lodash'

import type { QuestOptions } from '../../actions'
import type { QuestGoalSubgoal, RequestGoalKey } from './types'

export function satisfyGoal(
  req: RequestGoalKey,
  goal: QuestGoalSubgoal,
  options: QuestOptions | null,
): boolean {
  const goalReq = goal[req]
  const optionVal = options?.[req]
  const unsatisfy = goalReq && (!optionVal || !includes(goalReq, optionVal))
  return !unsatisfy
}

export function satisfyShip(goal: QuestGoalSubgoal, options: QuestOptions): boolean {
  if (
    goal.flagship &&
    ((options?.shipname?.length ?? 0) < 1 ||
      !goal.flagship.some((goalName) => options?.shipname?.[0]?.includes(goalName)))
  ) {
    return false
  }
  if (
    goal.secondship &&
    ((options?.shipname?.length ?? 0) < 2 ||
      !goal.secondship.some((goalName) => options?.shipname?.[1]?.includes(goalName)))
  ) {
    return false
  }
  if (goal.escortship && goal.escortship.length) {
    let flag = false
    for (const [goalNames, goalCount, ignoreFlagShip] of goal.escortship) {
      const shipname = ignoreFlagShip ? options?.shipname?.slice(1) : options?.shipname
      const count = shipname?.filter((optionShipName) =>
        goalNames.some((goalName) => optionShipName.includes(goalName)),
      ).length
      if ((count ?? 0) >= goalCount) {
        flag = true
      }
    }
    if (!flag) {
      return false
    }
  }
  if (goal.flagshiptype && !goal.flagshiptype.includes(options?.shiptype?.[0] ?? -1)) {
    return false
  }
  if (goal.escortshiptype && goal.escortshiptype.length > 0) {
    for (const [goalType, goalCount, ignoreFlagShip] of goal.escortshiptype) {
      const shiptype = ignoreFlagShip ? options.shiptype?.slice(1) : options.shiptype
      const count = shiptype?.filter((optionShipType) => goalType.includes(optionShipType)).length
      if ((count ?? 0) < goalCount) {
        return false
      }
    }
  }

  if (goal.flagshipclass && !goal.flagshipclass.includes(options.shipclass?.[0] ?? -1)) {
    return false
  }
  if (goal.secondshipclass && !goal.secondshipclass.includes(options.shipclass?.[1] ?? -1)) {
    return false
  }
  if (goal.escortshipclass && goal.escortshipclass.length > 0) {
    for (const [goalClass, goalCount, ignoreFlagShip] of goal.escortshipclass) {
      const shipclass = ignoreFlagShip ? options.shipclass?.slice(1) : options.shipclass
      const count = shipclass?.filter((optionShipClass) =>
        goalClass.includes(optionShipClass),
      ).length
      if ((count ?? 0) < goalCount) {
        return false
      }
    }
  }
  if (goal.fleetlimit && (options?.shipname?.length ?? 0) > goal.fleetlimit) {
    return false
  }
  if (goal.banshiptype && goal.banshiptype.length > 0) {
    if (goal.banshiptype.some((goalType) => options?.shiptype?.includes(goalType))) {
      return false
    }
  }
  return true
}
