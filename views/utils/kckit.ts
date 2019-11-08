/**
 * Adapter for kckit library
 */
import { check, AACIDatum } from 'kckit'
import _ from 'lodash'

/* AACI = Anti-Air Cut-In */
/**
 * Gets all match aaci based on the configuration: ship and equipments
 * @param shipId api_ship_id
 * @param equipments api_slotitem_id of all slots
 */
export const getShipAACIs = (shipId: number, equipments: number[]): AACIDatum[] =>
  check.aaci(shipId, equipments)

/**
 * Gets all aaci that the ship could make given all possibilities of equipments
 * @param shipId api_ship_id
 */
export const getShipPossibleAACIs = (shipId: number): AACIDatum[] => check.aaci(shipId)

/**
 * Checks if a configuration has reached the maximal fixed shot down
 * @param shipId api_ship_id
 * @param equipments api_slotitem_id of all slots
 */
export const isMaximalFixed = (shipId: number, equipments: number[]): boolean =>
  _.maxBy<AACIDatum>(getShipAACIs(shipId, equipments), 'fixed')?.id ===
  _.maxBy<AACIDatum>(getShipPossibleAACIs(shipId), 'fixed')?.id
