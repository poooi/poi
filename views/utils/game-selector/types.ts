/** Rows visible per page in the in-game ship / equipment pickers. */
export const ROWS_PER_PAGE = 10

export type SortDirection = 'desc' | 'asc'

/** Where an entry lands in the in-game picker. */
export interface SelectorPosition {
  /** 1-based page. */
  page: number
  /** 1-based row within the page. */
  index: number
  /** 0-based index within the whole filtered list. */
  offset: number
}

export const positionOf = (offset: number): SelectorPosition => ({
  page: Math.floor(offset / ROWS_PER_PAGE) + 1,
  index: (offset % ROWS_PER_PAGE) + 1,
  offset,
})

/** Chain comparators, using the first one that returns a non-zero result. */
export const chainCompare =
  <T>(...comparators: ((a: T, b: T) => number)[]) =>
  (a: T, b: T): number => {
    for (const compare of comparators) {
      const result = compare(a, b)
      if (result !== 0) return result
    }
    return 0
  }
