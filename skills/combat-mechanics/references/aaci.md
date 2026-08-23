# AACI Conditions Reference

AACI = 対空カットイン, "anti-air cut-in".

**File**: `views/utils/combat/aaci/` (table / entries / api split).

**Wiki (source of truth)**: https://wikiwiki.jp/kancolle/%E5%AF%BE%E7%A9%BA%E7%A0%B2%E7%81%AB
(the 対空カットイン一覧表 / cut-in list table)

The code was originally ported from KC3Kai commit `a9edbe5`; the wiki is authoritative for
updates. Good upstream cross-check:
`https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/library/modules/AntiAir.js`

**Last validated 2026-08-19.** Fixed and modifier values for all types 1–53 match the wiki.
Every discrepancy found was in ship eligibility, plus one equipment rule (type 27).

## Type 53 modifier is provisional — do not re-raise

Type 53 (Hiryuu Kai San, id 1031) requires a special high-angle mount with base AA >= 9 plus an
AA radar with base AA >= 4; fixed 4, modifier 1.6. **The wiki still marks the modifier cell
`?`.** The user asked to leave 1.6 as-is until the wiki updates — do not flag it on every sweep.

Its predicate is `isBuiltinHighAngleMountAA9`.

## The resolver tie-break

`getShipAACIs` in `aaci/api.ts` originally picked the winning type with `maxBy` on `fixed`
alone, so ties resolved by registration order. Type 53 and the generic type 8 both have
`fixed: 4`, so 53 could never surface. It now uses `bestAACIId`, which tie-breaks on
`modifier` — matching the ordering `sortAaciIds` already used. Keep that tie-break if you touch
the resolver.

## Class predicates beat id lists (types 38–41)

`isAtlantaOrKai` matched only Atlanta (597) and Atlanta Kai (696), so Reno (991) and Reno Kai
(747) — the same class — never triggered their dedicated AACI. Three independent sources agree
the eligibility is class-wide: the wiki table lists these rows against `Atlanta級`, Reno's own
wiki page defers to Atlanta's, and KC3Kai uses `ctypeIdEq(99)`.

Replaced with `isAtlantaClass = ctypeIs(99)`, which absorbs future class members automatically;
only the display list `atlantaClassNames` needs updating then. **This is the general lesson in
the parent skill — prefer `ctypeIs` whenever the wiki names a class.**

## Shared group predicates (types 49–52)

Types 49–52 share one `isFubukiOr32ndDivisionK2` predicate and one
`fubukiOr32ndDivisionK2Names` display list (type 50 adds the Akizuki class on top), so adding a
new member is a one-line change.

Members include Fujinami / Hayanami / Hamanami / Tamanami Kai Ni, plus Suzunami Kai Ni (1034)
and Suzunami Kai Ni Ho (745) — the user confirmed both count as 32nd Destroyer Division Kai Ni.

**Naganami Kai Ni Ho (743) and Asashimo Kai Ni Ho (744) are NOT in this group.**

## Ship eligibility fixes applied (2026-05-27)

| Type | Was                            | Added                                       |
| ---- | ------------------------------ | ------------------------------------------- |
| 15   | Isuzu Kai Ni                   | Fubuki Kai San (1035)                       |
| 16   | Kasumi Kai Ni B                | Yuubari Kai Ni (622), Fubuki Kai San (1035) |
| 17   | Kasumi Kai Ni B                | Inagi Kai Ni (979)                          |
| 24   | Tenryuu Kai Ni, Tatsuta Kai Ni | Fubuki Kai San (1035)                       |
| 27   | Ooyodo Kai                     | Hiryuu Kai San (1031)                       |
| 31   | Tenryuu Kai Ni                 | Inagi Kai Ni (979)                          |

## Equipment rule — type 27

Type 27 previously accepted only equip 275 as the high-angle mount. The wiki allows three:

- 275 — 10cm Twin High-angle Gun Mount Kai + Additional MG (already accepted)
- 71 — 10cm Twin High-angle Gun Mount (Carriage) (added)
- 220 — 8cm High-angle Gun Kai + Additional MG (added)

## Open question

**Type 49 and the Akizuki class**: the wiki may list Akizuki class as eligible for type 49, but
this was uncertain from extraction. Type 50 already covers Akizuki with the same equipment setup
(10cm HA Gun Kai + AAFD variants, advanced AA radar, Type 94 AAFD), so practical impact is
likely low. Verify manually on the next update.

## Key ship ids

| Ship                       | Id   | Predicate      |
| -------------------------- | ---- | -------------- |
| Fubuki Kai Ni              | 426  | `isFubukiK2`   |
| Fubuki Kai San             | 1035 | `isFubukiK3`   |
| Fubuki Kai San Go (Type 6) | 1040 | `isFubukiK3Go` |
| Yuubari Kai Ni             | 622  | `isYuubariK2`  |
| Inagi Kai Ni               | 979  | `isInagiK2`    |
| Hiryuu Kai San             | 1031 | `isHiryuuK3`   |
| Isuzu Kai Ni               | 141  | `isIsuzuK2`    |
| Kasumi Kai Ni B            | 470  | `isKasumiK2B`  |
| Tenryuu Kai Ni             | 477  | `isTenryuuK2`  |
| Tatsuta Kai Ni             | 478  | `isTatsutaK2`  |
| Ooyodo Kai                 | 321  | `isOoyodoK`    |

## Key equipment ids

| Equipment                                               | Id  | Predicate                                           |
| ------------------------------------------------------- | --- | --------------------------------------------------- |
| 10cm Twin High-angle Gun Mount (Carriage)               | 71  | `is10cmTwinHAGunMountBase`                          |
| 8cm High-angle Gun Kai + Additional MG                  | 220 | `is8cmHAMountKaiExtra`                              |
| 12cm 30-tube Rocket Launcher Kai Ni                     | 274 | `isRocketK2`                                        |
| 10cm Twin High-angle Gun Mount Kai + Additional MG      | 275 | `isHighAngleMountGun`                               |
| 5inch Single Gun Mount Mk.30 Kai + GFCS Mk.37           | 308 | `is5InchSingleGunMountMk30PlusGFCS`                 |
| 10cm Twin High-angle Gun Mount Kai + AAFD Kai           | 533 | `is100mmTwinMountKaiAAFD`                           |
| 10cm Twin High-angle Gun Group, Concentrated Deployment | 464 | `is10cmTwinHighAngleGunMountConcentratedDeployment` |
