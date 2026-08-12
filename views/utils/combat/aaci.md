# AACI Module Context

## Source of Truth

Wiki table (対空カットイン一覧表): https://wikiwiki.jp/kancolle/%E5%AF%BE%E7%A9%BA%E7%A0%B2%E7%81%AB

The code was originally ported from KC3Kai commit a9edbe5. The wiki is the authoritative reference for updates.

## Last Validated

2026-08-12. Fixed/modifier values for all types 1–53 match the wiki. Discrepancies were in ship eligibility and one equipment rule (type 27).

## Added 2026-08-12

**Type 53 — 飛龍改三 dedicated AACI**: 素対空9以上の特殊高角砲 + 素対空4以上の対空電探,
固定 4, 変動 1.6. The wiki still marks the 変動ボーナス with `?`, so treat 1.6 as
provisional and re-check on the next pass.

**Types 49–52 — 涼波改二 (ID 1034) / 涼波改二補 (ID 745) added**: both count as 三十二駆改二,
so they join 藤波/早波/浜波/玉波改二. The four entries now share one `isFubukiOr32ndDivisionK2`
predicate and one `fubukiOr32ndDivisionK2Names` list (type 50 adds 秋月型 on top), so the next
member only has to be added in one place.

## Fixes Applied (2026-05-27)

### Ship eligibility — ships added to `shipValid`

| Type | Was                | Added                                 |
| ---- | ------------------ | ------------------------------------- |
| 15   | 五十鈴改二         | 吹雪改三 (ID 1035)                    |
| 16   | 霞改二乙           | 夕張改二 (ID 622), 吹雪改三 (ID 1035) |
| 17   | 霞改二乙           | 稲木改二 (ID 979)                     |
| 24   | 天龍改二, 龍田改二 | 吹雪改三 (ID 1035)                    |
| 27   | 大淀改             | 飛龍改三 (ID 1031)                    |
| 31   | 天龍改二           | 稲木改二 (ID 979)                     |

### Equipment rule — type 27

Type 27 previously only accepted equip 275 (10cm連装高角砲改+増設機銃) as the HA mount.
Wiki allows three alternatives:

- 275: 10cm連装高角砲改+増設機銃 ← was already accepted
- 71: 10cm連装高角砲(砲架) ← added
- 220: 8cm高角砲改+増設機銃 ← added

## Open Question

**Type 49 / Akizuki class**: The wiki may list 秋月型 as eligible for type 49, but this was uncertain from extraction. Type 50 already covers Akizuki + the same equip setup (10cm高角砲改+AAFD variants + advanced AA radar + type94 AAFD), so practical impact may be low. Verify manually on next update.

## Key Ship IDs

| Ship             | ID   | Predicate      |
| ---------------- | ---- | -------------- |
| 吹雪改二         | 426  | `isFubukiK2`   |
| 吹雪改三         | 1035 | `isFubukiK3`   |
| 吹雪改三護(六式) | 1040 | `isFubukiK3Go` |
| 夕張改二         | 622  | `isYuubariK2`  |
| 稲木改二         | 979  | `isInagiK2`    |
| 飛龍改三         | 1031 | `isHiryuuK3`   |
| 五十鈴改二       | 141  | `isIsuzuK2`    |
| 霞改二乙         | 470  | `isKasumiK2B`  |
| 天龍改二         | 477  | `isTenryuuK2`  |
| 龍田改二         | 478  | `isTatsutaK2`  |
| 大淀改           | 321  | `isOoyodoK`    |

## Key Equip IDs

| Equip                          | ID  | Predicate                                           |
| ------------------------------ | --- | --------------------------------------------------- |
| 10cm連装高角砲(砲架)           | 71  | `is10cmTwinHAGunMountBase`                          |
| 8cm高角砲改+増設機銃           | 220 | `is8cmHAMountKaiExtra`                              |
| 12cm30連装噴進砲改二           | 274 | `isRocketK2`                                        |
| 10cm連装高角砲改+増設機銃      | 275 | `isHighAngleMountGun`                               |
| 5inch単装砲 Mk.30改+GFCS Mk.37 | 308 | `is5InchSingleGunMountMk30PlusGFCS`                 |
| 10cm連装高角砲改+高射装置改    | 533 | `is100mmTwinMountKaiAAFD`                           |
| 10cm連装高角砲群 集中配備      | 464 | `is10cmTwinHighAngleGunMountConcentratedDeployment` |
