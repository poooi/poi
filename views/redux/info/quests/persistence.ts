import CSON from 'cson'
import { map, forEach } from 'lodash'
import path from 'path'
import FileWriter from 'views/utils/file-writer'
import { arraySum } from 'views/utils/tools'

import type { ActiveQuest, QuestRecord, SubgoalRecord } from './types'

export function questTrackingPath(admiralId: string): string {
  return path.join(APPDATA_PATH, `quest_tracking_${admiralId}.cson`)
}

interface ProcessedRecords extends Record<string, unknown> {
  time: number
}

function processQuestRecords(
  records: Record<string | number, QuestRecord>,
  activeQuests: Record<string | number, ActiveQuest>,
): ProcessedRecords {
  // Deep clone to avoid mutating redux state objects from a store subscriber.
  // This matches the legacy behavior where only the serialized file copy is updated.
  const newRecords = structuredClone(records)
  forEach(newRecords, (record, recordId) => {
    if (!record || typeof record !== 'object') return
    const [count, required] = arraySum(
      map(record, (subgoal) => {
        if (!subgoal || typeof subgoal !== 'object') return [0, 0]
        return [(subgoal as SubgoalRecord).count || 0, (subgoal as SubgoalRecord).required || 0]
      }),
    )
    record.count = count || 0
    record.required = required || 1
    if (recordId in activeQuests) {
      record.active = true
    } else {
      delete record.active
    }
  })
  return { ...newRecords, time: Date.now() } as ProcessedRecords
}

const fileWriter = new FileWriter()

// Subscriber, used after the store is created
// Need to observe on state quests.records
export function saveQuestTracking(
  records: Record<string | number, QuestRecord>,
  activeQuests: Record<string | number, ActiveQuest>,
  admiralId: string,
): void {
  fileWriter.write(
    questTrackingPath(admiralId),
    CSON.stringify(processQuestRecords(records, activeQuests)),
    'utf8',
  )
}
