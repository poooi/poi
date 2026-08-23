---
name: quest-goal-data
description: Quest tracking — the assets/data/quest_goal.cson schema and the engine that consumes it (views/redux/info/quests/**, views/redux/actions/quest.ts, views/redux/middlewares/quests-cross-slice.ts). Use when editing quest_goal.cson, adding or fixing quest tracking, adding a new subgoal filter, or when asked which quests are untracked.
---

# Quest Goal Data and Tracking

## Where things live

| Concern                                                 | File                                            |
| ------------------------------------------------------- | ----------------------------------------------- |
| Quest goal definitions (data)                           | `assets/data/quest_goal.cson`                   |
| `QuestOptions` (what an event dispatch carries)         | `views/redux/actions/quest.ts`                  |
| `QuestGoalSubgoal` and the other engine types           | `views/redux/info/quests/types.ts`              |
| Matching helpers (`satisfyGoal`, `satisfyShip`)         | `views/redux/info/quests/goal-matching.ts`      |
| Progress evaluation (where subgoal filters are applied) | `views/redux/info/quests/records.ts`            |
| API responses -> quest events                           | `views/redux/middlewares/quests-cross-slice.ts` |
| Tests                                                   | `views/redux/info/__tests__/quests.spec.ts`     |

The engine is a directory of focused modules (`views/redux/info/quests/`), not a single
`quests.ts` — it was split in commit `2fe7bf01`.

Adding a new filter is a three-file change: a field on `QuestOptions`, a field on
`QuestGoalSubgoal` plus its check, and a dispatch in the middleware.

## Subgoal filter fields worth knowing

### `slotitemId` — filter `destory_item` by equipment master id

Filters scrapping events by a specific equipment id rather than only by equipment category
(`slotitemType2`). The middleware runs a second `countBy` loop grouping destroyed items by
`api_slotitem_id` and dispatches `destory_item` with `{ slotitemId: s }` per id.

```cson
678:
  fuzzy: true
  "destory_item@Type 96 Fighter":
    slotitemId: [19]
    required: 3
  "destory_item@Type 0 Fighter Model 21":
    slotitemId: [20]
    required: 5
```

### `materialShipType` / `materialShipMinCount` — modernization material filter

Tracks which ship types were consumed as material in a modernization
(`api_req_kaisou/powerup`), for quests requiring >= 3 ships of a class as material.

The middleware builds a `materialShipTypes` array (one stype entry per material ship) and
dispatches **exactly one** event per modernization — no double counting:

```typescript
{ event: 'remodel_ship', options: { times: 1, materialShipTypes: [3, 4, 3] }, delta: 1 }
```

The matcher counts how many of the dispatched stypes are in the subgoal's list and compares
against `materialShipMinCount` (default 3), so mixed-class material works (1 CL + 1 CLT +
1 training cruiser all count toward "light cruiser class"):

```cson
716:
  "remodel_ship":
    materialShipType: [3, 4, 21] # light cruiser class
    materialShipMinCount: 3
    required: 2
```

Quests 702/703 are unconstrained: they carry **no** `times: [1]` filter and simply match any
`remodel_ship` dispatch.

### `secondshipclass`

Mirrors `flagshipclass` but checks `shipclass[1]` — the second ship's ctype. Added for quest 1045. Note `flagship: ['吹雪改三']` substring-matches 改三護 too.

### Nationality / class-based quests

Some quests select ships by nationality via name-substring arrays on `flagship` /
`escortship`, or by ctype via `escortshipclass`. These carry an
`# extend when new <nation> ships are added` comment — **grep for those comments first** when
told new ships shipped. Quest 373 (French practice) is the canonical example; quest 973 uses
an explicit 28-ctype US/UK list that must be extended when new US/UK classes are implemented.

### `mapcell`

`mapcell` values are edge numbers _into_ the boss node (kcanotify `edges.json` numbering), not
node ids. Verified against quest 928's 7-3-2 boss node.

## Finding untracked quests

Collect `api_no` across all `api_get_member/questlist/*.json` response-saver captures (see the
`redux-api-testing` skill for the capture location), then subtract the keys matching
`/^'?(\d+)'?:/m` in `assets/data/quest_goal.cson`.

Expect arsenal (工廠) equipment-preparation quests to show up as untracked — **that is by
design**, not a gap: 626, 637, 643, 645, 653, 654, 686, 1105, 1123, 1129. Quest 637 has no
progress counter at all and is not trackable.

Limited-time (期間限定) quests are out of scope unless the user says otherwise. Untracked but
trackable ids seen in captures: 382, 383, 1048.

## Existing test coverage

`views/redux/info/__tests__/quests.spec.ts` already covers both filters — check it before
writing new cases:

- `destory_item counts by slotitemId`
- `remodel_ship materialShipType combined count — passes when >= materialShipMinCount match`
