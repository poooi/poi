import type { ExtraData } from '../sp-attack'
import type { GameShip } from '../types'

import { isSpAttackAvailable as isSpAttackAvailableCompat } from '../../sp_attack'
import { isSpAttackAvailable } from '../sp-attack'
const {
  ship: baseShip,
}: {
  ship: GameShip
} = require('./fixtures/aaci-sample-ship.json')

// fixture ship: Akizuki — healthy (37/37 HP), lv 97, DD (stype 2), not a carrier/sub
const dd = baseShip

const extra: ExtraData = { spAttackCount: {}, submarineSupplyCount: 0, fleetId: 0 }

describe('isSpAttackAvailable', () => {
  describe('Nelson Touch', () => {
    // Nelson class via ctype 88
    const nelson: GameShip = { ...baseShip, api_ctype: 88, api_stype: 9 }
    const fleet = [nelson, dd, dd, dd, dd, dd]

    it('triggers with a healthy Nelson-class flagship in a full fleet', () => {
      expect(isSpAttackAvailable(fleet, extra)).toBe(true)
    })

    it('does not trigger twice per sortie', () => {
      expect(isSpAttackAvailable(fleet, { ...extra, spAttackCount: { 100: 1 } })).toBe(false)
    })

    it('requires a full fleet', () => {
      expect(isSpAttackAvailable(fleet.slice(0, 5), extra)).toBe(false)
    })

    it('does not trigger when the flagship is at medium damage', () => {
      const damaged: GameShip = { ...nelson, api_nowhp: 18 }
      expect(isSpAttackAvailable([damaged, dd, dd, dd, dd, dd], extra)).toBe(false)
    })

    it('rejects a carrier in the 3rd slot but allows one in the 4th', () => {
      const cv: GameShip = { ...dd, api_stype: 11 }
      expect(isSpAttackAvailable([nelson, dd, cv, dd, dd, dd], extra)).toBe(false)
      expect(isSpAttackAvailable([nelson, dd, dd, cv, dd, dd], extra)).toBe(true)
    })
  })

  describe('Yamato special attacks', () => {
    const yamatoK2: GameShip = { ...baseShip, api_ship_id: 911, api_stype: 9 }
    const musashiK2: GameShip = { ...baseShip, api_ship_id: 546, api_stype: 9 }
    const iseK2: GameShip = { ...baseShip, api_ship_id: 553, api_stype: 10 }
    const hyuugaK2: GameShip = { ...baseShip, api_ship_id: 554, api_stype: 10 }

    it('triggers the double attack for 大和改二 + 武蔵改二', () => {
      expect(isSpAttackAvailable([yamatoK2, musashiK2, dd, dd, dd, dd], extra)).toBe(true)
    })

    it('triggers the triple attack for 大和改二 + 伊勢改二 + 日向改二', () => {
      expect(isSpAttackAvailable([yamatoK2, iseK2, hyuugaK2, dd, dd, dd], extra)).toBe(true)
    })

    it('does not trigger after either Yamato attack already fired', () => {
      expect(
        isSpAttackAvailable([yamatoK2, musashiK2, dd, dd, dd, dd], {
          ...extra,
          spAttackCount: { 401: 1 },
        }),
      ).toBe(false)
    })
  })

  describe('Submarine special attack', () => {
    const tender: GameShip = { ...baseShip, api_stype: 20, api_lv: 30 }
    const sub: GameShip = { ...baseShip, api_stype: 13 }
    const fleet = [tender, sub, sub, dd]
    const withSupply: ExtraData = { ...extra, submarineSupplyCount: 1 }

    it('triggers for a tender flagship with two healthy submarines and supplies', () => {
      expect(isSpAttackAvailable(fleet, withSupply)).toBe(true)
    })

    it('requires submarine supplies', () => {
      expect(isSpAttackAvailable(fleet, extra)).toBe(false)
    })

    it('requires tender level 30+', () => {
      const lowLevelTender: GameShip = { ...tender, api_lv: 29 }
      expect(isSpAttackAvailable([lowLevelTender, sub, sub, dd], withSupply)).toBe(false)
    })

    it('is blocked in the main fleets of a combined fleet', () => {
      expect(isSpAttackAvailable(fleet, { ...withSupply, combinedFlag: true })).toBe(false)
      expect(isSpAttackAvailable(fleet, { ...withSupply, combinedFlag: true, fleetId: 2 })).toBe(
        true,
      )
    })
  })

  describe('金剛型改二丙 charge', () => {
    const kongouK2C: GameShip = { ...baseShip, api_ship_id: 591, api_stype: 8 }
    const hieiK2C: GameShip = { ...baseShip, api_ship_id: 592, api_stype: 8 }
    const fleet = [kongouK2C, hieiK2C, dd, dd, dd]

    it('triggers with a valid pair and 5 non-submarines', () => {
      expect(isSpAttackAvailable(fleet, extra)).toBe(true)
    })

    it('allows up to 3 triggers per sortie', () => {
      expect(isSpAttackAvailable(fleet, { ...extra, spAttackCount: { 104: 2 } })).toBe(true)
      expect(isSpAttackAvailable(fleet, { ...extra, spAttackCount: { 104: 3 } })).toBe(false)
    })
  })

  it('handles short fleets without throwing', () => {
    const nelson: GameShip = { ...baseShip, api_ctype: 88, api_stype: 9 }
    expect(isSpAttackAvailable([nelson], extra)).toBe(false)
    expect(isSpAttackAvailable([], extra)).toBe(false)
  })

  it('deprecated pair-based shim returns the same results', () => {
    const nelson: GameShip = { ...baseShip, api_ctype: 88, api_stype: 9 }
    const trigger = [nelson, dd, dd, dd, dd, dd]
    const noTrigger = [dd, dd, dd, dd, dd, dd]
    expect(
      isSpAttackAvailableCompat(
        trigger.map((ship) => [ship, ship]),
        extra,
      ),
    ).toBe(isSpAttackAvailable(trigger, extra))
    expect(
      isSpAttackAvailableCompat(
        noTrigger.map((ship) => [ship, ship]),
        extra,
      ),
    ).toBe(isSpAttackAvailable(noTrigger, extra))
  })
})
