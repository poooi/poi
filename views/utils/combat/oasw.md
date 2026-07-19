# OASW Conditions Context

**File**: `views/utils/combat/oasw.ts` (shared predicates live in
`views/utils/combat/combinators.ts`, `ship-predicates.ts` and `equip-predicates.ts`)

**Wiki reference**: https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83#oasw (発動条件 section)

## Validated Conditions (as of 2026-05-27)

All logic matches the wiki. 龍田改二 (ship ID 478) is now the shared `isTatsutaK2` predicate; 日向改二 (554) the shared `isHyuuGaK2`.

### Unconditional (無条件) ships

| Variable               | Ship ID(s)             | Ship                          |
| ---------------------- | ---------------------- | ----------------------------- |
| `isIsuzuK2`            | 141                    | 五十鈴改二                    |
| `isTatsutaK2`          | 478                    | 龍田改二                      |
| `isYuubariKaiNiTei`    | 624                    | 夕張改二丁                    |
| `isFubukiK3Go`         | 1040                   | 吹雪改三護                    |
| `isJClassKai`          | 394, 893, 906          | J級改                         |
| `isSamuelKai`          | 681                    | Samuel B. Roberts改           |
| `isSamuelKaiNi`        | 920                    | Samuel B. Roberts改二 (Mk.II) |
| `isFletcherClassOrKai` | 562, 596, ctype=91+Kai | Fletcher級                    |

### 海防艦 (DE, stype=1)

- 対潜60以上 + ソナー(icon 18)
- OR 対潜75以上 + 装備対潜値合計4以上

### 駆逐(2)・軽巡(3)・雷巡(4)・練巡(21)・補給(22)

- 対潜100以上 + ソナー(icon 18)

### 大鷹型改/改二・加賀改二護

- Ship IDs: 380, 381 (大鷹型改), 529, 536 (大鷹型改二), 646 (加賀改二護)
- 任意のASW航空機1機以上: 艦攻(tais≥1) OR 艦爆(tais≥1) OR 固定翼ASW(type[2]=26) OR オートジャイロ(type[2]=25)

### 軽空母 CVL (stype=7, excluding 大鷹型・最上型改二特)

- Excludes: isTaiyouClassKai, isTaiyouClassKaiNi, isMogamiClassKouKaiNi (508, 509)
- Option A: 対潜65以上 + 艦攻(tais≥7) or ASW aircraft
- Option B: 対潜50以上 + ソナー + 艦攻(tais≥7) or ASW aircraft
- Option C: 対潜100以上 + ソナー + 艦攻(tais≥1) **or** 艦爆(tais≥1) — wiki confirms both qualify

**Note on 最上型改二特**: wiki says "(最上型軽空母は特殊)" with no defined condition; correctly excluded.

### 日向改二 (ID 554)

- S-51J系: オートジャイロ(tais≥12) 1機以上
- OR 任意のオートジャイロ 2機以上

### 神州丸改 (626) / 大和改二重 (916)

- 対潜100以上 + ソナー + オートジャイロ OR 水上爆撃機(type[2]=11)

### 熊野丸/改 (943, 948)

- 対潜100以上 + ソナー + 艦爆(tais≥1) OR オートジャイロ OR 固定翼ASW

### 扶桑改二/山城改二 (411, 412)

- 対潜100以上 + ソナー(icon 18) + 水上爆撃機 OR オートジャイロ OR 爆雷(icon 17)
- Wiki says 大型ソナー specifically, but iconIs(18) is correct: those ships cannot equip small sonar, so the slot restriction enforces it.

## Equipment Type Reference

| Predicate                    | Matches                                      |
| ---------------------------- | -------------------------------------------- |
| `isSonar` = iconIs(18)       | All sonar (small & large, both have icon 18) |
| `isDepthCharge` = iconIs(17) | 爆雷                                         |
| `isAutogyro`                 | api_type[2]=25                               |
| `isFixedWingASWAircraft`     | api_type[2]=26 (三式指揮連絡機(対潜)等)      |
| `isSeaplaneBomber`           | api_type[2]=11                               |
| `isTorpedoBomber`            | api_type[2]=8                                |
| `isDiveBomber`               | api_type[2]=7                                |

## When Updating

1. Check the wiki 発動条件 table for new ships or condition changes.
2. Add ship IDs to the appropriate predicate or add a new `overEvery(...)` branch.
3. Use `shipIdIs(n)` for single ships, inline array check for classes.
4. Run `npm run typecheck` after editing.
