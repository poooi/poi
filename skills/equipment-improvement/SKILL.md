---
name: equipment-improvement
description: 改修 (★) bonus data in views/utils/improvement — the rule table, where each value is sourced from, and how to verify a change. Use when editing views/utils/improvement/**, getTyku / 制空値 in views/utils/game-utils.ts, or anything reading a ★ bonus; when asked what a ★ adds to a stat; or when a fighter power number looks wrong for improved equipment.
---

# 改修 (★) Bonuses (views/utils/improvement/)

Improving equipment changes what it contributes, but the game never says so:
`api_mst_slotitem` keeps printing the ★0 values and the ship's stat line folds the result
in silently. Everything here is therefore _measured_ data, not API data.

## Layout

- `table.ts` — the data. `DEFAULT_IMPROVEMENT_TABLE`, the rule/stat/context types, and the
  named id lists (`FIGHTER_BOMBER_IDS`, the three 副砲 classes).
- `index.ts` — `getImprovementBonus`, which evaluates the table.

Consumer: `getImprovementAABonus` in `views/utils/game-utils.ts`, i.e. 制空値.

**Not a consumer, deliberately: OASW.** 先制対潜 thresholds are judged on the displayed
対潜 and "ただし、改修はこの条件に影響しない" — see the note on `taisenAbove` in
`views/utils/combat/combinators.ts`, which a test in `combat/__tests__/oasw.spec.ts` pins.

## The data model

`stat → context → ImprovementRule[]`, first match wins.

- **stats**: `power` (attack power), `torpedo`, `bomber`, `asw`, `armor`, `accuracy`,
  `evasion`, `los`, `aa`.
- **contexts**: `fire` (昼砲撃戦, and the default), `torpedo`, `yasen`, `asw`, `airstrike`
  (航空戦/基地航空隊), `exped`, `contact` (触接).

**Two units live in that grid, and mixing them up is the mistake to watch for.** `power` is
attack power in whichever attack the context names; every other stat is the equipment stat.
対潜 is the clean example: a ★ on a ソナー is `asw` ⅔√★ _and_ `power/asw` √★, because the
ASW formula multiplies equipment 対潜 by 1.5. Both are right; only the first belongs on a
stat line. Anything that displays a stat should read the stat tables; 火力 is the one place
where the two coincide, a gun's 火力 stat and its 昼砲撃 power moving together.

Contexts exist because one item does improve differently per attack — a 潜水艦魚雷 is ★×0.2
by day and √★ at night. Stat tables that have no such split keep everything under `fire`.

A rule matches on any of `ids`, `types` (`api_type[2]`), `icon` (`api_type[3]`), and
`above` (a master stat strictly greater than a value). **A `factor: 0` rule is how an
exception is written** — it matches and contributes nothing, e.g. 爆雷 carved out of the
爆雷投射機 category, or 爆戦 carved out of 艦爆 火力. Ordering is load-bearing: narrow
rules first.

**Rounding is per (stat, context)**, listed in `ROUNDED` in `index.ts`: `power/exped`,
`asw/exped`, `los/exped`, `aa/exped`, `los/contact` — 遠征 is "小数点第1位まで計算され、
第2位以下切り捨て". Accuracy and evasion are _not_ floored on an expedition. A blanket
"floor every exped result" is wrong and was a real bug.

## Sourcing rules

Three sources, in this order:

1. **wikiwiki** — primary. Per-mechanic pages, not one:
   - 改修工廠 https://wikiwiki.jp/kancolle/%E6%94%B9%E4%BF%AE%E5%B7%A5%E5%BB%A0 — 火力 (昼/夜),
     雷撃, 命中, 回避, 索敵, the 副砲 分類 lists, and the 制空値 list.
   - 対潜攻撃 https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83 — the ASW term.
   - 遠征 https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#about_stat — the 遠征 terms.
   - Per-equipment pages carry exceptions the category tables do not.
2. **kc-web** (noro6, 制空権シミュレータ) — `src/classes/item/item.ts`, `getBonus*`. Closest
   in shape to this table and the model it follows, since its bonuses are per _stat_.
   Its `src/classes/constants/items.ts` holds the id lists (`BAKUSEN`,
   `STRICT_DEPTH_CHARGE`, `FIGHTERS`).
3. **KC3Kai** — `objects/Gear.js`, per _attack_. Rules that only it has carry a `KC3 only`
   comment.

Adding a source means adding an entry to [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)
with its licence, not only a comment in the code. Note that **kc-web publishes no licence**;
what poi takes from it is measured values rather than code, which is why the entry records
that distinction.

Quote the wikiwiki sentence verbatim beside the value. **Ask WebFetch to quote verbatim
rather than summarize**: the 改修工廠 fetch reported ソナー as "2/3√★" where the page's own
砲撃 row says 0.75, which looked like a garble and was not — ⅔√★ is the real 対潜 _stat_
term, and the summary had silently mixed two rows. Cross-check a suspicious value on the
per-mechanic page before concluding either way. `curl` gets 403 from wikiwiki; use WebFetch.

**Prefer wikiwiki's name lists over a stat heuristic.** 副砲 are the case in point:
wikiwiki sorts them into 分類A (√★) / 分類B (★×0.2) / 分類C (★×0.3) by name and states no
rule, while KC3 approximates with `icon 16 && 火力 > 4`. The table carries the wiki's ids
first and keeps the heuristic beneath them for equipment the wiki does not name.

## Verifying a change

`getImprovementBonus` is pure, so diff it against KC3Kai across the whole roster rather
than spot-checking. [references/kc3-diff.js](references/kc3-diff.js) runs KC3's `Gear.js`
in a `vm` sandbox against a stub `KC3Master.slotitem` fed from an `api_start2` capture, and
compares every (equipment × stat × context × ★) — 55k combinations:

```
curl -sL https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/library/objects/Gear.js -o <tmp>/Gear.js
cp skills/equipment-improvement/references/kc3-diff.js views/utils/improvement/__tests__/kc3-diff.spec.js
GEAR_JS=<tmp>/Gear.js npx jest views/utils/improvement/__tests__/kc3-diff
rm views/utils/improvement/__tests__/kc3-diff.spec.js
```

It is a scratch harness, not a committed test: it needs a download, and KC3 is the third
source anyway. It found two real porting bugs (the exped rounding scope and missing radar
rules in `accuracy/exped`). kc-web has no equivalent harness — its `getBonus*` are plain
enough to diff by reading, and that is how the current table was checked against it.

## Where poi knowingly differs from KC3

Every one of these follows wikiwiki or kc-web instead, so expect the harness to report
them:

- **副砲 on an expedition**: 0.5√★ (wikiwiki 遠征, kc-web) vs KC3's ★×0.15.
- **索敵 on an expedition**: 電探 and 艦偵/水偵 all √★ (wikiwiki 遠征, kc-web) vs KC3's
  0.95√★ for the larger ones and nothing for 艦偵.
- **命中 from ソナー/爆雷投射機/噴進砲**: √★ (kc-web, which treats 命中 as a stat) vs KC3,
  which pays it only inside an ASW attack.
- **狭義の爆雷**: five ids (kc-web's `STRICT_DEPTH_CHARGE`) get no 砲撃 火力 or 命中; KC3's
  火力 branch lists only three of them.
- **噴式戦闘機 (type 56) 対空 0.2/★**: kc-web's `FIGHTERS` includes 56; KC3 has no case for
  it. Moot while jets are unimprovable.
- **大型電探(II) (type 93)** takes the 水上電探 accuracy rate; KC3's radar branch tests only
  `[12, 13]` while its own high-accuracy predicate covers 93 — an upstream oversight.

Unsettled between sources, currently following wikiwiki: **水上電探** is 命中3以上 here
(wikiwiki, and KC3's `houm > 2`), while kc-web uses 索敵5以上 — main.js reportedly tests
`api_saku >= 5`. The two disagree on 13号対空電探 / SK レーダー.

Values wikiwiki confirms exist but cannot quantify are marked `provisional` in the table:
陸上偵察機 (0.2) and 大型飛行艇 (0.15) 対空 — "改修強化値の正確な式は不明". kc-web carries
the same two numbers with the same caveat.
