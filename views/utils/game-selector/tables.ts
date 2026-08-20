/**
 * The parts of the picker model that the game hardcodes in `main.js`.
 *
 * Everything here is *data* the bundle carries rather than anything the API
 * announces, so it can change under us whenever the game ships a new ship type,
 * equipment category, or special-cased item. Keeping it in one shape lets it
 * ride on fcd (`assets/data/fcd/gameselector.json`) and be corrected without a
 * poi release; the values below are the built-in fallback used until — or if —
 * fcd delivers a newer copy.
 *
 * Comparator *logic* (the sort key order, the two list modes, pagination) is
 * deliberately not here: that is behaviour, not a lookup table, and a change to
 * it would be a visible redesign rather than a silent data update.
 */

/** One tab of the 艦船選択 filter strip, from `ShipUtil.filterByShipFilterType`. */
export interface ShipFilterTab {
  /** Tab index, matching the game's own filter type. */
  id: number
  /** Japanese tab caption, as printed in game. */
  name: string
  stypes: number[]
}

/** One tab of the 装備選択 category list, from `SlotConst.FILTERING_CATEGORIES`. */
export interface EquipFilterCategory {
  id: number
  name: string
  details: number[]
}

/**
 * A type that splits into a night-capable (or high-angle) variant when the item
 * carries a particular icon.
 */
export interface EquipTypeSplit {
  /** `api_type[2]` values this rule applies to. */
  types: number[]
  /** `api_type[3]` that triggers the split. */
  icon: number
  /** The synthetic type the item is treated as. */
  result: number
}

export interface SelectorTables {
  shipFilterTabs: ShipFilterTab[]
  equipFilterCategories: EquipFilterCategory[]
  /** Detail category id → accepted `equipTypeForFilter` values. */
  filteringDetailCategories: Record<number, number[]>
  /** Master id → the type `equipTypeSp` reports instead of `api_type[2]`. */
  equipTypeSpOverrides: Record<number, number>
  filterTypeSplits: EquipTypeSplit[]
  /** Master id → type, applied only inside the picker's equippability check. */
  pickerTypeOverrides: Record<number, number>
}

export const DEFAULT_SELECTOR_TABLES: SelectorTables = {
  shipFilterTabs: [
    { id: 0, name: '戦艦級', stypes: [8, 9, 10, 12] },
    { id: 1, name: '航空母艦級', stypes: [7, 11, 18] },
    { id: 2, name: '重巡級', stypes: [5, 6] },
    { id: 3, name: '軽巡級', stypes: [3, 4, 21] },
    { id: 4, name: '駆逐艦', stypes: [2] },
    { id: 5, name: '海防艦', stypes: [1] },
    { id: 6, name: '潜水艦', stypes: [13, 14] },
    { id: 7, name: '補助艦艇', stypes: [15, 16, 17, 19, 20, 22] },
  ],

  equipFilterCategories: [
    { id: 0, name: '全装備', details: [] },
    { id: 1, name: '艦上戦闘機', details: [11, 12] },
    { id: 2, name: '艦上爆撃機・攻撃機', details: [21, 23, 22, 24] },
    { id: 3, name: '偵察機・水上機', details: [31, 32, 33, 35, 34] },
    { id: 4, name: '主砲', details: [41, 42, 43] },
    { id: 5, name: '特殊砲弾・強化装備', details: [51, 52, 53] },
    { id: 6, name: '副砲・対空', details: [61, 62, 63, 64] },
    { id: 7, name: '魚雷・潜航艇', details: [71, 72, 73] },
    { id: 8, name: '対潜装備', details: [81, 82] },
    { id: 9, name: '電探', details: [91, 92, 93] },
    { id: 10, name: '上陸・輸送', details: [101, 102, 103] },
    { id: 11, name: '要員・物資', details: [111, 112, 113, 114] },
    { id: 12, name: '陸上機', details: [121, 122, 123] },
    { id: 13, name: '装甲・機関', details: [131, 132] },
    { id: 14, name: 'その他', details: [141, 142, 143, 144] },
  ],

  filteringDetailCategories: {
    11: [6, 56],
    12: [82],
    21: [7, 57],
    22: [8, 58],
    23: [83],
    24: [84],
    31: [10, 85],
    32: [9, 94],
    33: [11],
    34: [26, 45, 59],
    35: [25],
    41: [1],
    42: [2],
    43: [3, 38],
    51: [19],
    52: [18],
    53: [20, 33],
    61: [4, 95],
    62: [81],
    63: [21],
    64: [36],
    71: [5],
    72: [22],
    73: [32],
    81: [14, 40],
    82: [15],
    91: [12],
    92: [13, 93],
    93: [51],
    101: [24],
    102: [46],
    103: [30, 50, 52],
    111: [43],
    112: [23],
    113: [39],
    114: [35, 44],
    121: [47, 91],
    122: [48],
    123: [49, 53, 41],
    131: [17],
    132: [16, 27, 28],
    141: [29, 42],
    142: [37],
    143: [54],
    144: [31, 34],
  },

  equipTypeSpOverrides: {
    128: 38, // 大口径主砲 variants
    281: 38,
    465: 38,
    142: 93, // 大型電探 variants
    460: 93,
    151: 94, // 艦上偵察機 variant
    561: 91, // 噴式爆撃機 variant
  },

  filterTypeSplits: [
    { types: [1, 2, 3, 4], icon: 16, result: 81 }, // 主砲/副砲 with the AA icon → 高角砲
    { types: [6, 56], icon: 45, result: 82 }, // 艦上戦闘機 → 夜間戦闘機
    { types: [7, 57], icon: 58, result: 83 }, // 艦上爆撃機 → 夜間爆撃機
    { types: [8, 58], icon: 46, result: 84 }, // 艦上攻撃機 → 夜間攻撃機
    { types: [10], icon: 50, result: 85 }, // 水上偵察機 → 夜間偵察機
  ],

  pickerTypeOverrides: {
    467: 95, // special-cased inside isEquipAbleSlot itself
  },
}

/**
 * The tables in force. fcd replaces this at runtime; everything that reads it
 * takes an explicit `tables` argument, so this is only the default.
 */
let currentTables: SelectorTables = DEFAULT_SELECTOR_TABLES

export const getSelectorTables = (): SelectorTables => currentTables

/**
 * Applies an fcd payload over the built-in tables. Unknown or missing fields
 * fall back, so a partial or malformed update degrades to the bundled values
 * rather than emptying the picker.
 */
export const setSelectorTables = (tables: Partial<SelectorTables> | undefined): SelectorTables => {
  currentTables = mergeSelectorTables(tables)
  return currentTables
}

export const mergeSelectorTables = (
  tables: Partial<SelectorTables> | undefined,
): SelectorTables => {
  if (!tables) return DEFAULT_SELECTOR_TABLES
  return {
    shipFilterTabs: nonEmpty(tables.shipFilterTabs) ?? DEFAULT_SELECTOR_TABLES.shipFilterTabs,
    equipFilterCategories:
      nonEmpty(tables.equipFilterCategories) ?? DEFAULT_SELECTOR_TABLES.equipFilterCategories,
    filteringDetailCategories:
      tables.filteringDetailCategories ?? DEFAULT_SELECTOR_TABLES.filteringDetailCategories,
    equipTypeSpOverrides:
      tables.equipTypeSpOverrides ?? DEFAULT_SELECTOR_TABLES.equipTypeSpOverrides,
    filterTypeSplits: nonEmpty(tables.filterTypeSplits) ?? DEFAULT_SELECTOR_TABLES.filterTypeSplits,
    pickerTypeOverrides: tables.pickerTypeOverrides ?? DEFAULT_SELECTOR_TABLES.pickerTypeOverrides,
  }
}

const nonEmpty = <T>(value: T[] | undefined): T[] | undefined =>
  Array.isArray(value) && value.length > 0 ? value : undefined

export const resetSelectorTables = (): void => {
  currentTables = DEFAULT_SELECTOR_TABLES
}
