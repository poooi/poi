import type { AACIEntry } from './types'

// avoid modifying this structure directly, use "declareAACI" instead.
// The table is populated by './entries' (imported for its side effect in
// './index'); querying it before that import has run yields an empty table.
export const AACITable: Record<number, AACIEntry> = {}

// typeIcons is a array including [ship icon, equip icon, ...]
// predicateShipMst is a function f: f(mst)
// predicateShipObj is a function f: f(shipObj)
// returns a boolean to indicate whether the ship in question (with equipments)
// is capable of performing such type of AACI
export const declareAACI = ({
  name = [],
  id,
  fixed,
  modifier,
  shipValid,
  equipsValid,
}: AACIEntry) => {
  AACITable[id] = {
    name,
    id,
    fixed,
    modifier,
    shipValid,
    equipsValid,
  }
}
