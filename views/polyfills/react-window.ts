/**
 * react-window v2 merged VariableSizeList/FixedSizeList → List, and the prop API
 * changed completely: v1's children render-prop became rowComponent, itemCount →
 * rowCount, itemData → rowProps (spread), itemSize (fn) → rowHeight function,
 * height/width are now part of the style prop, and the imperative ref API
 * (resetAfterIndex/scrollToItem/scrollTo) became listRef with scrollToRow.
 *
 * These shims translate v1 usage to v2's API so old plugins continue to work.
 */
export {}

const _react = require('react')
const reactWindow = require('react-window')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeOnRowsRendered(onItemsRendered: any) {
  if (!onItemsRendered) return undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (visible: any, overscan: any) => {
    onItemsRendered({
      overscanStartIndex: overscan.startIndex,
      overscanStopIndex: overscan.stopIndex,
      visibleStartIndex: visible.startIndex,
      visibleStopIndex: visible.stopIndex,
    })
  }
}

// Expose the v1 imperative API (scrollToItem/scrollTo, plus optional extras like
// resetAfterIndex) backed by v2's listRef ({ element, scrollToRow }).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useV1ImperativeAPI(ref: any, v2Ref: any, itemCount: number, extras?: object) {
  _react.useImperativeHandle(
    ref,
    () => ({
      scrollToItem(index: number, align = 'auto') {
        if (itemCount <= 0) return
        // v1 clamped out-of-range indices; v2 throws RangeError
        const clamped = Math.max(0, Math.min(index, itemCount - 1))
        v2Ref.current?.scrollToRow({ align, index: clamped })
      },
      scrollTo(offset: number) {
        v2Ref.current?.element?.scrollTo({ top: offset })
      },
      ...extras,
    }),
    [v2Ref, itemCount, extras],
  )
}

const FixedSizeList = _react.forwardRef(function FixedSizeList(
  {
    children,
    height,
    width,
    itemCount,
    itemSize,
    itemData,
    overscanCount,
    onItemsRendered,
    direction,
    // v1-only props that must not leak onto the root DOM element
    useIsScrolling,
    itemKey,
    initialScrollOffset,
    outerRef,
    innerRef,
    outerElementType,
    innerElementType,
    layout,
    ...rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any,
) {
  // Capture children+itemData in a stable RowComponent via useMemo.
  // rowProps is passed as {} so Object.values([]) never crashes.
  const RowComponent = _react.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function Row({ index, style }: any) {
        return children({ index, style, data: itemData })
      },
    [children, itemData],
  )

  const v2Ref = _react.useRef(null)
  useV1ImperativeAPI(ref, v2Ref, itemCount)

  return _react.createElement(reactWindow.List, {
    rowCount: itemCount,
    rowHeight: itemSize,
    rowComponent: RowComponent,
    rowProps: {},
    overscanCount,
    onRowsRendered: makeOnRowsRendered(onItemsRendered),
    listRef: v2Ref,
    // v1 direction is 'ltr' | 'rtl' (or deprecated 'horizontal'/'vertical');
    // v2 only understands the dir attribute
    dir: direction === 'rtl' || direction === 'ltr' ? direction : undefined,
    style: { height, width },
    ...rest,
  })
})

const VariableSizeList = _react.forwardRef(function VariableSizeList(
  {
    children,
    height,
    width,
    itemCount,
    itemSize,
    itemData,
    // v1 used this only as a pre-measure estimate; v2 computes bounds from rowHeight
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    estimatedItemSize,
    overscanCount,
    onItemsRendered,
    direction,
    // v1-only props that must not leak onto the root DOM element
    useIsScrolling,
    itemKey,
    initialScrollOffset,
    outerRef,
    innerRef,
    outerElementType,
    innerElementType,
    layout,
    ...rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any,
) {
  const RowComponent = _react.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function Row({ index, style }: any) {
        return children({ index, style, data: itemData })
      },
    [children, itemData],
  )

  // v2 memoizes its cumulative bounds cache on the rowHeight identity, so v1's
  // resetAfterIndex maps to bumping resetSeq to mint a new rowHeight function.
  const [resetSeq, setResetSeq] = _react.useState(0)
  const rowHeight = _react.useMemo(
    () => (index: number) => itemSize(index),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemSize, resetSeq],
  )

  const v2Ref = _react.useRef(null)
  const extras = _react.useMemo(
    () => ({
      resetAfterIndex() {
        // full invalidation is a superset of v1's from-index reset
        setResetSeq((seq: number) => seq + 1)
      },
    }),
    [],
  )
  useV1ImperativeAPI(ref, v2Ref, itemCount, extras)

  return _react.createElement(reactWindow.List, {
    rowCount: itemCount,
    rowHeight,
    rowComponent: RowComponent,
    rowProps: {},
    overscanCount,
    onRowsRendered: makeOnRowsRendered(onItemsRendered),
    listRef: v2Ref,
    dir: direction === 'rtl' || direction === 'ltr' ? direction : undefined,
    style: { height, width },
    ...rest,
  })
})

reactWindow.VariableSizeList = VariableSizeList
reactWindow.FixedSizeList = FixedSizeList
// Alias for plugins using the old names directly
if (!reactWindow.VariableSizeGrid) reactWindow.VariableSizeGrid = reactWindow.Grid
if (!reactWindow.FixedSizeGrid) reactWindow.FixedSizeGrid = reactWindow.Grid
