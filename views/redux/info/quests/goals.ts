import CSON from 'cson'
import fs from 'fs'
import { cloneDeep } from 'lodash'
import path from 'path'

import type { GoalKey, QuestGoalTable, QuestRecord, SubgoalRecord } from './types'

/**
 * Quest goals come from two places:
 *
 * - `assets/data/quest_goal/*.cson`, bundled with the build — one file per period,
 *   merged into one table. They are the source of truth developers edit, and the
 *   fallback that is always available.
 * - fcd (`assets/data/fcd/questgoal.json`, generated from those files by
 *   `fcd/build.js` as a single payload), which lets a new or corrected quest reach
 *   existing installs without a poi release.
 *
 * The delivered copy is layered over the bundled one per quest id — see
 * `mergeQuestGoals` for why it merges rather than replaces.
 */
const questGoalsDir = path.join(ROOT, 'assets', 'data', 'quest_goal')
const bundledPayloadPath = path.join(ROOT, 'assets', 'data', 'fcd', 'questgoal.json')

let bundledQuestGoals: QuestGoalTable | undefined
let bundledVersion: string | undefined | null

/**
 * The bundled quest goal table: every `*.cson` in `assets/data/quest_goal/`, merged.
 * An unreadable directory degrades to an empty table, as a missing file always did;
 * a broken file is skipped on its own so it cannot take the rest of the table with
 * it. CSON *returns* parse errors instead of throwing them. `fcd/build.js` rejects
 * duplicate ids, so here the later file simply wins.
 */
function parseBundledQuestGoals(): QuestGoalTable {
  let files: string[]
  try {
    files = fs
      .readdirSync(questGoalsDir)
      .filter((file) => file.endsWith('.cson'))
      .sort()
  } catch (e) {
    console.warn('No quest goal data!', e instanceof Error ? e.message : String(e))
    return {}
  }
  const merged: QuestGoalTable = {}
  for (const file of files) {
    try {
      const parsed = CSON.parseCSONFile(path.join(questGoalsDir, file))
      if (parsed instanceof Error || !parsed || typeof parsed !== 'object') {
        console.warn('Broken quest goal file!', file, parsed instanceof Error ? parsed.message : '')
        continue
      }
      Object.assign(merged, parsed)
    } catch (e) {
      console.warn('Broken quest goal file!', file, e instanceof Error ? e.message : String(e))
    }
  }
  return merged
}

export function loadBundledQuestGoals(): QuestGoalTable {
  if (!bundledQuestGoals) {
    bundledQuestGoals = parseBundledQuestGoals()
  }
  // Callers put this into redux state, where immer may freeze it; hand out a
  // copy so the cache stays usable for the next load.
  return cloneDeep(bundledQuestGoals)
}

/** Only for tests — drops the parsed copies so the next load re-reads the files. */
export function resetBundledQuestGoals(): void {
  bundledQuestGoals = undefined
  bundledVersion = undefined
}

/**
 * `meta.version` of the fcd payload shipped with this build. Since that payload is
 * generated from the bundled cson, it doubles as the version of the bundled table
 * itself, which is what makes it a usable floor in `mergeQuestGoals`.
 */
export function bundledQuestGoalsVersion(): string | undefined {
  if (bundledVersion === undefined) {
    bundledVersion = null
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(bundledPayloadPath, 'utf-8'))
      if (parsed && typeof parsed === 'object' && 'meta' in parsed) {
        const meta = parsed.meta
        if (
          meta &&
          typeof meta === 'object' &&
          'version' in meta &&
          typeof meta.version === 'string'
        ) {
          bundledVersion = meta.version
        }
      }
    } catch (e) {
      console.warn('No bundled questgoal payload!', e instanceof Error ? e.message : String(e))
    }
  }
  return bundledVersion ?? undefined
}

/**
 * The quest goal table in force: the bundled definitions with any fcd-delivered
 * quest layered on top.
 *
 * A delivered quest *replaces* the bundled one wholesale, so a payload can drop
 * a subgoal or correct a `required`. Ids the payload does not mention keep their
 * bundled definition, because a payload can be *older* than the build: poi only
 * refreshes fcd when the remote version is newer, so a copy cached before a
 * quest was added must not blank that quest out. The cost — fcd can correct a
 * quest but never delete one — is the right way round here, since the payload is
 * generated from the bundled file: a missing id means the payload predates it.
 *
 * A payload that is not *strictly newer* than this build is ignored outright, for
 * two reasons:
 *
 * - fcd state is restored from localStorage, so after an app update the copy cached
 *   by the previous release is still around, and since it carries nearly every quest
 *   id it would otherwise shadow every bundled correction — not just fill the gaps;
 * - a payload at the *same* version as the build carries nothing the bundled cson
 *   does not already have, because it is generated from it. Treating equal as
 *   "nothing new" also means a `questgoal.json` that was not regenerated after a
 *   goal-file edit cannot shadow that edit, which is otherwise invisible in development.
 *
 * Versions sort lexicographically (`YYYY/MM/DD/NN`), the same comparison the fcd
 * updater uses. An unknown delivered version cannot be compared, so it is applied.
 */
export function mergeQuestGoals(
  delivered?: QuestGoalTable,
  deliveredVersion?: string,
): QuestGoalTable {
  const merged = loadBundledQuestGoals()
  if (!delivered || typeof delivered !== 'object') return merged
  const bundled = bundledQuestGoalsVersion()
  if (deliveredVersion && bundled && deliveredVersion <= bundled) return merged
  for (const [id, goal] of Object.entries(delivered)) {
    if (goal && typeof goal === 'object') {
      merged[id] = cloneDeep(goal)
    }
  }
  return merged
}

const isSubgoalRecord = (value: unknown): value is SubgoalRecord =>
  typeof value === 'object' && value !== null && 'count' in value && typeof value.count === 'number'

/**
 * Re-align existing tracking records with a changed goal table, preserving the
 * progress counted so far.
 *
 * Needed because the goals can now change mid-session: a subgoal whose
 * `required` was corrected keeps its count (clamped to the new requirement), a
 * subgoal the new definition dropped is removed, and a subgoal it added starts
 * at `init`. Records with no matching goal are left alone, the same way
 * `outdateRecords` leaves them.
 */
export function resyncQuestRecords(
  records: Record<string | number, QuestRecord>,
  questGoals: QuestGoalTable,
): Record<string | number, QuestRecord> {
  let changed = false
  const next: Record<string | number, QuestRecord> = {}

  for (const [id, record] of Object.entries(records)) {
    const goal = questGoals[id]
    if (!record || !goal) {
      next[id] = record
      continue
    }

    const previous = new Map(
      Object.entries(record).filter((entry): entry is [string, SubgoalRecord] =>
        isSubgoalRecord(entry[1]),
      ),
    )
    const synced: QuestRecord = { id: record.id ?? id }
    let recordChanged = false

    for (const [key, subgoal] of Object.entries(goal)) {
      if (!subgoal || typeof subgoal !== 'object') continue
      const required = subgoal.required || 0
      const before = previous.get(key)
      previous.delete(key)
      const count = before ? Math.min(before.count, required) : subgoal.init || 0
      // Subgoal keys are `${QuestEvent}` or `${QuestEvent}@${string}`; the data
      // file is the authority on which, the same way newQuestRecord treats them.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      synced[key as GoalKey] = { count, required, description: subgoal.description }
      if (
        !before ||
        before.count !== count ||
        before.required !== required ||
        before.description !== subgoal.description
      ) {
        recordChanged = true
      }
    }

    // Whatever is left in `previous` is a subgoal the new definition dropped.
    if (previous.size > 0) recordChanged = true

    next[id] = recordChanged ? synced : record
    changed = changed || recordChanged
  }

  return changed ? next : records
}
