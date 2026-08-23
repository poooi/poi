# Special Attack Conditions Reference

**File**: `views/utils/combat/sp-attack.ts`. `views/utils/sp_attack.ts` is a deprecated
pair-based compat shim (kept for plugins). The API takes merged `GameShip[]` objects
(`{ ...$ship, ...ship }`), not `[ship, $ship]` pairs.

Shared predicates use the AACI-style names: `isYamatoK2`, `isMusashiK2`, `isIseK2`,
`isHyuuGaK2`, `isNotSubmarine`, `ctypeIs`.

**Wiki**: https://wikiwiki.jp/kancolle/ — per-attack links are in the file comments.

Damage-state shorthand used below: _light damage_ = 小破, _medium damage_ = 中破,
_heavy damage_ = 大破. `isNotMidDmg` means "less than medium damage"; `isNotHeavyDmg` means
"less than heavy damage" (so medium damage still passes).

## Special attack ids

| Constant                     | Id  |
| ---------------------------- | --- |
| `Nelson_Touch`               | 100 |
| `Nagato_Punch`               | 101 |
| `Mutsu_Splash`               | 102 |
| `Colorado_Fire`              | 103 |
| `Kongo_Class_Kaini_C_Charge` | 104 |
| `Baguette_Charge`            | 105 |
| `QE_Touch`                   | 106 |
| `Yamato_Attack_Triple`       | 400 |
| `Yamato_Attack_Double`       | 401 |
| `Submarine_Special_Attack`   | 302 |

## Key predicates

| Predicate                      | Ship id(s) / ctype           |
| ------------------------------ | ---------------------------- |
| `isNagatoKaiNi`                | 541                          |
| `isMutsuKaiNi`                 | 573                          |
| `isNelsonClass`                | ctype 88 (Nelson and Rodney) |
| `isNelsonClassKai`             | ctype 88 + `isKai`           |
| `isColoradoClass`              | ctype 93                     |
| `isKongoKaiNiC`                | 591                          |
| `isHieiKaiNiC`                 | 592                          |
| `isHarunaKaiNi`                | 151                          |
| `isHarunaKaiNiB`               | 593                          |
| `isHarunaKaiNiC`               | 954                          |
| `isKirishimaKaiNi`             | 152                          |
| `isKirishimaKaiNiC`            | 694                          |
| `isWarspite` / `isWarspiteKai` | 364, 439 / 364               |
| `isValiant` / `isValiantKai`   | 927, 733 / 733               |
| `isRichelieuKaiOrDeux`         | 392, 969                     |
| `isJeanBartKai`                | 724                          |
| `isYamatoKaiNi`                | 911, 916                     |
| `isMusashiKaiNi`               | 546                          |
| `isBismarckDrei`               | 178                          |
| `isIowaKai`                    | 360                          |
| `isIseKaiNi`                   | 553                          |
| `isHyugaKaiNi`                 | 554                          |
| `isFusoKaiNi`                  | 411                          |
| `isYamashiroKaiNi`             | 412                          |
| `isItalia`                     | 446                          |
| `isRomaKai`                    | 447                          |
| `isSouthDakotaKai`             | 697                          |
| `isWashingtonKai`              | 659                          |
| `isKai`                        | `api_getmes === '<br>'`      |

## Conditions

### Nelson Touch (100)

Once per sortie, full fleet, Nelson-class flagship (not medium-damaged).
Slots 1, 3, 5: not submarine. Slots 2, 4: not submarine and not carrier.

### Nagato Punch / Mutsu Splash (101 / 102)

Once per sortie, full fleet. Flagship: Nagato Kai Ni / Mutsu Kai Ni (not medium-damaged).
Slot 2: any battleship (not heavy-damaged). Slots 2–5: not submarine.

### Colorado Fire (103)

Once per sortie, full fleet. Flagship: Colorado class (not medium-damaged).
Slots 2 and 3: battleship (not heavy-damaged). Slots 3–5: not submarine.

### Kongo-class Kai Ni C Charge (104)

Max 3 per sortie (trigger count < 3, counted separately from other special attacks);
5+ non-submarines in fleet.

**Damage rule: below heavy damage only — medium damage still triggers.** Uses `isNotHeavyDmg`
on _both_ slot 0 and slot 1, unlike every other special attack (which uses `isNotMidDmg` on the
flagship). Corrected 2026-08-12; it was wrongly `isNotMidDmg` before. Source: wikiwiki
金剛改二丙, "flagship and companion both below heavy damage".

Valid flagship + companion pairs (flagship in slot 0, companion in slot 1):

- **Kongo Kai Ni C**: Hiei Kai Ni C, Haruna Kai Ni / Kai Ni B / Kai Ni C, Kirishima Kai Ni C,
  Warspite, Valiant
- **Hiei Kai Ni C**: Kongo Kai Ni C, Haruna Kai Ni B / Kai Ni C, Kirishima Kai Ni / Kai Ni C
- **Haruna Kai Ni B or Kai Ni C**: Kongo Kai Ni C, Hiei Kai Ni C, Kirishima Kai Ni C
- **Kirishima Kai Ni C**: Kongo Kai Ni C, Hiei Kai Ni C, Haruna Kai Ni B / Kai Ni C,
  South Dakota Kai

### Baguette Charge (105)

Once per sortie, full fleet. Richelieu Kai/Deux + Jean Bart Kai (either as flagship);
flagship not medium-damaged, slot 2 not heavy-damaged. Slots 2–5: not submarine.

### QE Touch (106)

Once per sortie, full fleet. Warspite Kai + Valiant Kai (either as flagship);
flagship not medium-damaged, slot 2 not heavy-damaged. Slots 2–5: not submarine.

### Yamato Double Attack (401)

Full fleet; Yamato Kai Ni / Kai Ni Juu or Musashi Kai Ni as flagship.
Companions for Yamato: Musashi Kai Ni, Bismarck Drei, Iowa Kai, Richelieu Kai/Deux,
Jean Bart Kai. Musashi Kai Ni as flagship takes Yamato Kai Ni / Kai Ni Juu as companion.
Slots 0 and 1 not medium-damaged; slots 2–5 not submarine.

### Yamato Triple Attack (400)

Full fleet; Yamato Kai Ni / Kai Ni Juu in slot 0 (not medium-damaged).
Slots 1 and 2 not medium-damaged; slots 3–5 not submarine.

Valid pairs for slots 1 and 2 — most are order-independent; the Musashi pairs are order-fixed:

- Musashi Kai Ni -> Nagato Kai Ni (fixed order)
- Musashi Kai Ni -> Mutsu Kai Ni (fixed order)
- Nagato Kai Ni <-> Mutsu Kai Ni
- Ise Kai Ni <-> Hyuuga Kai Ni
- Fusou Kai Ni <-> Yamashiro Kai Ni
- Nelson class <-> Warspite
- Valiant <-> Warspite
- Nelson class Kai <-> Nelson class Kai (Nelson Kai + Rodney Kai; uses `isNelsonClassKai`)
- Kongo Kai Ni C <-> Hiei Kai Ni C
- Kongo Kai Ni C <-> Haruna Kai Ni B
- Kongo Kai Ni C <-> Haruna Kai Ni C
- Kongo Kai Ni C <-> Kirishima Kai Ni C
- Hiei Kai Ni C <-> Kirishima Kai Ni C
- South Dakota Kai <-> Washington Kai
- Italia <-> Roma Kai
- Colorado class <-> Colorado class
- Richelieu Kai/Deux <-> Jean Bart Kai

### Submarine Special Attack (302)

3+ ships, submarine supply available, not in a combined fleet.
Slot 0: submarine tender, level >= 30, not heavy-damaged.
Slots 1 and 2: submarines. At least 2 of: slot 1 not medium-damaged, slot 2 not
medium-damaged, slot 3 is a submarine and not medium-damaged (requires 4+ ships).

## When updating

1. Check each attack's wiki page (links in the file comments) for new ships or changes.
2. For new combos in Yamato Triple, add **both directions** unless the wiki marks the order as
   fixed (順番固定).
3. Use `shipIdIs(n)` for a specific remodel form; `ctypeIs(n)` when all class members qualify.
4. Run `npm run typecheck` and the `combat` jest suite.
