import type { EquipsPredicate, ShipPredicate } from '../types'

export interface AACIEntry {
  name?: string[]
  id: number
  fixed: number
  modifier: number
  shipValid: ShipPredicate
  equipsValid: EquipsPredicate
}
