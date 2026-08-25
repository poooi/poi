// Generic predicate builders shared by the combat mechanics modules
// (AACI, AAPB, OASW, special attacks). All combinators are pure.
import type { GameEquip, GameShip, EquipsPredicate } from './types'

// check for $slotitemtypes
export const itemTypeIs = (n: number) => (equip: GameEquip) => equip.api_type?.[2] === n

// type for slot item
export const iconIs = (n: number) => (equip: GameEquip) => equip.api_type?.[3] === n

// validAll(f,g...)(x) = f(x) && g(x) && ...
export const validAll =
  (...func: EquipsPredicate[]) =>
  (x: GameEquip[]) =>
    func.every((f) => f(x))
export const validNot = (f: EquipsPredicate) => (x: GameEquip[]) => !f(x)
export const validAny =
  (...func: EquipsPredicate[]) =>
  (x: GameEquip[]) =>
    func.some((f) => f(x))

export const shipIdIs = (n: number) => (ship: GameShip) => ship.api_ship_id === n
export const equipIdIs = (n: number) => (equip: GameEquip) => equip.api_slotitem_id === n
export const shipIdIsOneOf =
  (...shipIds: number[]) =>
  (ship: GameShip) =>
    shipIds.includes(ship.api_ship_id ?? -1)

// check for ship class ($ship.api_ctype)
export const ctypeIs = (n: number) => (ship: GameShip) => ship.api_ctype === n

// "hasAtLeast(pred)(n)(xs)" is the same as:
// xs.filter(pred).length >= n
export const hasAtLeast = (pred: (e: GameEquip) => boolean, n: number) => (xs: GameEquip[]) =>
  xs.filter(pred).length >= n

// "hasSome(pred)(xs)" is the same as:
// xs.some(pred)
export const hasSome = (pred: (e: GameEquip) => boolean) => (xs: GameEquip[]) => xs.some(pred)

// check if slot num of ship (excluding ex slot) equals or greater
export const slotNumAtLeast = (n: number) => (ship: GameShip) => (ship.api_slot_num ?? 0) >= n

/**
 * Whether the ship's displayed 対潜 (`api_taisen[0]`) reaches `value`.
 *
 * This is the stat the 先制対潜 thresholds are judged on: "先制対潜に必要な対潜値は、
 * 艦娘の素対潜値と装備品の（対潜値＋対潜値ボーナス）の合計による。ただし、改修はこの
 * 条件に影響しない" — so **do not** add ★ improvement bonuses here, however
 * tempting it looks now that views/utils/improvement can supply them.
 * `api_taisen[0]` is exactly the displayed value, and excludes them already.
 * https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83
 */
export const taisenAbove = (value: number) => (ship: GameShip) =>
  (ship.api_taisen?.[0] ?? 0) >= value
