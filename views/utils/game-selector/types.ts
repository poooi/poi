/** Rows visible per page in the in-game ship / equipment pickers. */
export const ROWS_PER_PAGE = 10

/**
 * The land-base squadron picker is a different list with a shorter page:
 * `AirUnitList` paginates by 9, not by `ShipList`'s 10.
 */
export const AIRBASE_ROWS_PER_PAGE = 9

/** Where an entry lands in the in-game picker. */
export interface SelectorPosition {
  /** 1-based page. */
  page: number
  /** 1-based row within the page. */
  index: number
  /** 0-based index within the whole filtered list. */
  offset: number
}

export const positionOf = (offset: number, perPage = ROWS_PER_PAGE): SelectorPosition => ({
  page: Math.floor(offset / perPage) + 1,
  index: (offset % perPage) + 1,
  offset,
})
