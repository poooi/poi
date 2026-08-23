# OASW Conditions Reference

OASW = 先制対潜攻撃, "opening anti-submarine warfare" — a pre-emptive anti-sub strike.

**File**: `views/utils/combat/oasw.ts`. Generic combinators and shared ship/equipment
predicates come from `views/utils/combat/{combinators,ship-predicates,equip-predicates}.ts`.

**Wiki**: https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83#oasw
(the 発動条件 / "activation conditions" section)

All logic below was validated against the wiki. Two shared predicates are used here and
elsewhere: `isTatsutaK2` (478, Tatsuta Kai Ni) and `isHyuuGaK2` (554, Hyuuga Kai Ni).

## Unconditional ships (無条件 — always get OASW)

| Predicate              | Ship id(s)               | Ship                                                                |
| ---------------------- | ------------------------ | ------------------------------------------------------------------- |
| `isIsuzuK2`            | 141                      | Isuzu Kai Ni                                                        |
| `isTatsutaK2` (shared) | 478                      | Tatsuta Kai Ni                                                      |
| `isYuubariKaiNiTei`    | 624                      | Yuubari Kai Ni Tei                                                  |
| `isFubukiK3Go`         | 1040                     | Fubuki Kai San Go                                                   |
| `isJClassKai`          | 394, 893, 906            | J-class Kai                                                         |
| `isSamuelKai`          | 681                      | Samuel B. Roberts Kai                                               |
| `isSamuelKaiNi`        | 920                      | Samuel B. Roberts Kai Ni (Mk.II)                                    |
| `isFletcherClassOrKai` | 562, 596, ctype 91 + Kai | Fletcher class                                                      |
| `isVisbyOrKai`         | 1062, 1067               | Visby                                                               |
| `isHiedaMaruOrKai`     | 1065, 1070               | Hieda Maru (stype 20, submarine tender — no other branch covers it) |

## Coastal defence ships (海防艦, DE — stype 1)

- ASW stat >= 60 **and** a sonar (icon 18), **or**
- ASW stat >= 75 **and** total equipment ASW value >= 4.

## Destroyer (2) / light cruiser (3) / torpedo cruiser (4) / training cruiser (21) / supply (22)

- ASW stat >= 100 **and** a sonar (icon 18).

## Taiyou class Kai / Kai Ni, and Kaga Kai Ni Go

Ship ids: 380, 381 (Taiyou class Kai), 529, 536 (Taiyou class Kai Ni), 646 (Kaga Kai Ni Go).

- At least one ASW aircraft of any kind: torpedo bomber (ASW >= 1), dive bomber (ASW >= 1),
  fixed-wing ASW plane (`api_type[2]` = 26), or autogyro (`api_type[2]` = 25).

## Light carriers (CVL, stype 7) — excluding Taiyou class and Mogami-class Kai Ni Toku

Excluded by: `isTaiyouClassKai`, `isTaiyouClassKaiNi`, `isMogamiClassKouKaiNi` (508, 509).

- Option A: ASW >= 65 + torpedo bomber (ASW >= 7) or ASW aircraft
- Option B: ASW >= 50 + sonar + torpedo bomber (ASW >= 7) or ASW aircraft
- Option C: ASW >= 100 + sonar + torpedo bomber (ASW >= 1) **or** dive bomber (ASW >= 1) —
  the wiki confirms both qualify.

**Mogami-class Kai Ni Toku**: the wiki says "the Mogami-class light carriers are special" with
no defined condition, so they are correctly excluded.

## Hyuuga Kai Ni (554)

- At least one S-51J-series autogyro (autogyro with ASW >= 12), **or**
- At least two autogyros of any kind.

## Shinshuu Maru Kai (626) / Yamato Kai Ni Juu (916)

- ASW >= 100 + sonar + (autogyro **or** seaplane bomber, `api_type[2]` = 11).

## Kumano Maru / Kai (943, 948)

- ASW >= 100 + sonar + (dive bomber with ASW >= 1 **or** autogyro **or** fixed-wing ASW plane).

## Fusou Kai Ni / Yamashiro Kai Ni (411, 412)

- ASW >= 100 + sonar (icon 18) + (seaplane bomber **or** autogyro **or** depth charge, icon 17).
- The wiki specifies _large_ sonar, but `iconIs(18)` is correct here: these ships cannot equip
  small sonar, so the game's own slot restriction already enforces it.

## Equipment predicate reference

| Predicate                      | Matches                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `isSonar` = `iconIs(18)`       | all sonar (small and large both use icon 18)                    |
| `isDepthCharge` = `iconIs(17)` | depth charges                                                   |
| `isAutogyro`                   | `api_type[2]` = 25                                              |
| `isFixedWingASWAircraft`       | `api_type[2]` = 26 (e.g. Type 3 Command Liaison Aircraft (ASW)) |
| `isSeaplaneBomber`             | `api_type[2]` = 11                                              |
| `isTorpedoBomber`              | `api_type[2]` = 8                                               |
| `isDiveBomber`                 | `api_type[2]` = 7                                               |

## When updating

1. Check the wiki's activation-condition table for new ships or changed conditions.
2. Add ship ids to the appropriate predicate, or add a new branch to `isOASW`.
3. Compose branches with the **module-local** `overSome` / `overEvery` in `oasw.ts`, not with
   `validAll` / `validAny` from `combinators.ts`. OASW predicates are two-arity
   (`(ship, equips) => boolean`, the `OASWPredicate` type), whereas the `valid*` combinators
   take a single `GameEquip[]`; mixing them will not typecheck. `oasw.ts` defines its own pair
   precisely because lodash's `overSome`/`overEvery` cannot type mixed-arity predicates — the
   comment above them says so. Use `overEquips(...)` to lift an equips-only predicate into an
   `OASWPredicate`.
4. Use `shipIdIs(n)` for a single remodel form; `ctypeIs(n)` when the whole class qualifies
   (preferred — see the main skill).
5. Run `npm run typecheck` and the `combat` jest suite.
