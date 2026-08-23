---
name: combat-mechanics
description: Battle-mechanics data and predicates in views/utils/combat/ — OASW (anti-sub first strike), AACI (anti-air cut-in), AAPB (anti-air propellant barrage) and special attacks. Use when editing anything under views/utils/combat/ or views/utils/{aaci,oasw,aapb,sp_attack}.ts, when adding or validating ship/equipment eligibility conditions, when asked to "check game data" / "new ships were added" / "update combat conditions", or when a battle prediction looks wrong for a specific ship.
---

# Combat Mechanics (views/utils/combat/)

## Package layout

All battle-mechanics logic lives in `views/utils/combat/`:

- `types.ts` — `GameShip` = `APIShip & APIMstShip`, `GameEquip` = `APISlotItem & APIMstSlotitem`
  (merged objects, state spread over master data: `{ ...$ship, ...ship }`), plus
  `ShipPredicate` / `EquipPredicate` / `EquipsPredicate`.
- `combinators.ts` — generic builders: `shipIdIs`, `equipIdIs`, `ctypeIs`, `itemTypeIs`
  (`api_type[2]`), `iconIs` (`api_type[3]`), `validAll` / `validAny` / `validNot`, `hasSome`,
  `hasAtLeast`, `slotNumAtLeast`, `taisenAbove`.
- `ship-predicates.ts` / `equip-predicates.ts` — shared named predicates.
  `predicates.ts` is a barrel over all three.
- `aaci/` — table / entries / api split (types and predicates hoisted to package root).
- `aapb.ts`, `oasw.ts`, `sp-attack.ts` — each imports from the shared pool; feature-specific
  predicates stay local.

**Merged-object convention**: all four modules take merged `GameShip` / `GameEquip`. Consumers
do the merge in their selectors (see the `oasw-indicator.tsx` pattern). This is safe because
state and master-data field names do not collide except `api_id`, which no predicate uses
(state wins).

**Back-compat shims — do not delete**: `views/utils/{aaci,oasw,aapb,sp_attack}.ts` remain as
deprecated re-exports/adapters because external poi plugins import those paths (same reason
`isOASWWith` exists). The `aapb` / `sp_attack` shims adapt the old `[state, mst]` pair-based
signatures.

**Intentionally not shared**: `isFletcherClassOrKai` differs between AACI (id list, includes
Heywood) and OASW (ctype 91 + `isKai`, future-proof) — kept separate on purpose. Likewise
`isBattleship` (AACI: stype 8/9/10) vs sp-attack's `isBattleShip` (adds stype 12).

`isKai` is `ship.api_getmes === '<br>'`. `api_getmes` is an `APIMstShip` field whose value is
`'<br>'` for every remodeled (Kai and above) form; base ships carry the acquisition message.

## The single most important lesson

**Prefer `ctypeIs` over ship-id lists whenever the wiki's eligibility column names a class
(級 / -class).** A ctype predicate absorbs new class members for free.

Real bug this caused: AACI types 38–41 matched the Atlanta class by ship id `[597, 696]`, so
Reno (991) and Reno Kai (747) — same ctype 99 — never triggered. Fixed by
`isAtlantaClass = ctypeIs(99)`. Other id-list predicates are still worth re-auditing against
their wiki wording.

## Reference tables

Validated condition tables live alongside this skill — read the relevant one before editing:

- [references/oasw.md](references/oasw.md) — OASW activation conditions per ship/class, plus
  the equipment-type predicate reference.
- [references/aaci.md](references/aaci.md) — AACI validation state, the resolver tie-break,
  shared group predicates, key ship/equipment ids.
- [references/sp-attack.md](references/sp-attack.md) — every special-attack id, its predicates,
  and the valid ship combos.

These replace the former `views/utils/combat/{aaci,oasw}.md`. Keep them here — module-adjacent
copies drift (the old `oasw.md` documented an `overEvery(...)` combinator that no longer exists).

## Sourcing and validation

- Primary source: wikiwiki.jp/kancolle (per-mechanic pages; links live in the file comments).
- **WebFetch summaries of the wikiwiki anti-air cut-in table are unreliable** — row numbering
  drifted by ±1 across calls. Always cross-check a claimed type number against the individual
  ship's own wiki page. Asking the fetch prompt to _quote the eligibility column verbatim_
  (rather than infer from row order) works well.
- Good cross-check when a wiki summary is doubtful — KC3Kai upstream source:
  `https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/library/modules/AntiAir.js`
- `en.kancollewiki.net` returns 403 and `kancolle.fandom.com` returns 402 to WebFetch — do not
  retry those.

## Game-data sweep method (reusable)

When asked to check for new game data:

1. **New ships / equipment** — diff local master data: newest `api_start2/getData/*.json`
   capture, fields `api_mst_ship` (player ships are `api_id < 1500`) and `api_mst_slotitem`.
   See the `redux-api-testing` skill for where captures live. Captures only go back ~10 days,
   so this catches recent patches only; for anything older, check the predicate against the
   wiki directly.
2. **Quests** — see the `quest-goal-data` skill.
3. Most new ships get **no** unique combat mechanics — only marquee/anniversary ships do.
   Check `assets/data/quest_goal.cson` first (grep for the nation name, for `escortshipclass` /
   `flagship:` name arrays, and for `# extend when ...` comments) before assuming OASW / AACI /
   sp-attack need touching. The 2026-07 French additions (Algérie 641, Vautour 643, Béarn 645)
   needed _only_ quest 373's name arrays.
4. Run `npm run typecheck` and `npm test -- --testPathPattern="combat"` after editing.

## Standing decisions — do not re-raise

- **AACI type 53's 1.6 modifier is provisional.** wikiwiki still marks that cell `?`. The user
  asked to leave it until the wiki updates; do not raise it on every sweep.
- Ships 743 (Naganami Kai Ni Ho) and 744 (Asashimo Kai Ni Ho) are **not** part of the 32nd
  Division group used by AACI 49–52; 1034 / 745 (Suzunami Kai Ni / Kai Ni Ho) are.
