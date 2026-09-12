---
name: quest-goal-data
description: Quest tracking — the assets/data/quest_goal.cson schema and the engine that consumes it (views/redux/info/quests/**, views/redux/actions/quest.ts, views/redux/middlewares/quests-cross-slice.ts). Use when editing quest_goal.cson, adding or fixing quest tracking, adding a new subgoal filter, or when asked which quests are untracked.
---

# Quest Goal Data and Tracking

## Where things live

| Concern                                                 | File                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Quest goal definitions (data)                           | `assets/data/quest_goal.cson`                                          |
| fcd payload generated from that data                    | `assets/data/fcd/questgoal.json` (via `fcd/build.js`)                  |
| Bundled/delivered merge and record re-sync              | `views/redux/info/quests/goals.ts`                                     |
| `QuestOptions` (what an event dispatch carries)         | `views/redux/actions/quest.ts`                                         |
| `QuestGoalSubgoal` and the other engine types           | `views/redux/info/quests/types.ts`                                     |
| Matching helpers (`satisfyGoal`, `satisfyShip`)         | `views/redux/info/quests/goal-matching.ts`                             |
| Progress evaluation (where subgoal filters are applied) | `views/redux/info/quests/records.ts`                                   |
| API responses -> quest events                           | `views/redux/middlewares/quests-cross-slice.ts`                        |
| fcd delivery -> quest goals                             | `views/redux/middlewares/quest-goals-fcd.ts`                           |
| Tests                                                   | `views/redux/info/__tests__/quests.spec.ts`, `quest-goals-fcd.spec.ts` |

The engine is a directory of focused modules (`views/redux/info/quests/`), not a single
`quests.ts` — it was split in commit `2fe7bf01`.

Adding a new filter is a three-file change: a field on `QuestOptions`, a field on
`QuestGoalSubgoal` plus its check, and a dispatch in the middleware.

## The data ships twice: bundled cson + fcd

`assets/data/quest_goal.cson` is the single source developers edit. It is bundled with the
build and is the **fallback**; `fcd/build.js` mirrors it into `assets/data/fcd/questgoal.json`
so a new or corrected quest reaches existing installs without a poi release.

**After editing the cson, run `node fcd/build.js`** (from the repo root or `fcd/`) and commit
the regenerated `assets/data/fcd/questgoal.json` and `meta.json` alongside it. The build
validates the cson first (every id numeric, every quest has at least one subgoal, every subgoal
a positive `required`), so a broken edit fails there rather than shipping to everyone.

How the two combine at runtime (`views/redux/info/quests/goals.ts`):

- the bundled table is parsed once at `api_get_member/require_info`;
- `questGoalsFcdMiddleware` then layers the delivered table over it, on `@@updateFCD` /
  `@@replaceFCD` **and** after every `require_info` (either can come first, and require_info
  reloads the bundled table, so the merge has to be re-applied);
- the merge is **per quest id**: a delivered quest replaces the bundled one wholesale (so fcd
  can drop a subgoal or fix a `required`), while ids the payload omits keep their bundled
  definition — an fcd copy cached before a quest existed must not blank it out. So fcd can
  correct a quest but never delete one;
- `resyncQuestRecords` then carries existing progress across the change: a count survives a
  `required` correction (clamped to the new value), a dropped subgoal's record goes away, a new
  one starts at `init`.

Adding a _new subgoal filter field_ still needs a release — the payload only carries data, and
an old build will ignore a field its `satisfyShip`/`satisfyGoal` does not know.

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
design**, not a gap: 626, 628, 637, 643, 645, 653, 654, 686, 1105, 1123, 1129. Quest 637 has no
progress counter at all and is not trackable.

Composition-only quests (「…を編成せよ！」, e.g. 199) are **not trackable at all**: the engine
matches events, and organising a fleet is not one — see the `QuestEvent` union in
`views/redux/actions/quest.ts`.

## Limited-time (期間限定) quests

These live in their own section at the end of `quest_goal.cson`. Two rules:

1. **Never add an expired one, and delete one whose period has ended.** The game reuses
   limited-time ids for later campaigns, so a stale entry tracks the wrong quest.
2. A capture proves a quest is _live_ but never proves it is _gone_ — a quest also disappears
   from `questlist` once cleared (tab 0 lists only uncleared quests). So confirm the period
   against the maintenance notes (ととねこ / ぜかましねっと) rather than from absence alone;
   presence in a capture taken _after_ the last maintenance is the reliable positive signal.

Tracked as of the 2026-09-10 maintenance: 382, 384, 1048, 1049. Deliberately not tracked from
the same batch: 199 (composition only), 383 (フランス艦隊、特別演習 — period ended at that
maintenance), 秋祭り拡張演習 (id not yet seen in any capture).

The resource-preparation half of a quest (「弾薬 x2,200 を準備」) carries no event and cannot be
tracked; 1048/1049 track only their sortie subgoals, with a comment saying so.

## Existing test coverage

`views/redux/info/__tests__/quests.spec.ts` already covers both filters — check it before
writing new cases:

- `destory_item counts by slotitemId`
- `remodel_ship materialShipType combined count — passes when >= materialShipMinCount match`
