/**
 * react-window v2 merged VariableSizeList/FixedSizeList → List, and the prop API
 * changed completely: v1's children render-prop became rowComponent, itemCount →
 * rowCount, itemData → rowProps (spread), itemSize (fn) → rowHeight object, and
 * height/width are now part of the style prop.
 *
 * These shims translate v1 usage to v2's API so old plugins continue to work.
 */
export {}
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const _react = require('react')
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FixedSizeList = function FixedSizeList({
  children,
  height,
  width,
  itemCount,
  itemSize,
  itemData,
  overscanCount,
  onItemsRendered,
  direction,
  ...rest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  // Capture children+itemData in a stable RowComponent via useMemo.
  // rowProps is passed as {} so Object.values([]) never crashes.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const RowComponent = _react.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function Row({ index, style }: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return children({ index, style, data: itemData })
      },
    [children, itemData],
  )

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return _react.createElement(reactWindow.List, {
    rowCount: itemCount,
    rowHeight: itemSize,
    rowComponent: RowComponent,
    rowProps: {},
    overscanCount,
    onRowsRendered: makeOnRowsRendered(onItemsRendered),
    direction,
    style: { height, width },
    ...rest,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VariableSizeList = function VariableSizeList({
  children,
  height,
  width,
  itemCount,
  itemSize,
  itemData,
  estimatedItemSize = 50,
  overscanCount,
  onItemsRendered,
  direction,
  ...rest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const RowComponent = _react.useMemo(
    () =>
      function Row({ index, style }: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return children({ index, style, data: itemData })
      },
    [children, itemData],
  )

  // v2 variable-height rowHeight: object with getRowHeight + getAverageRowHeight + observeRowElements.
  // observeRowElements is a no-op since the plugin supplies all sizes via itemSize already.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const rowHeight = _react.useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      getRowHeight: (index: number) => itemSize(index),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      getAverageRowHeight: () => estimatedItemSize as number,
      observeRowElements: () => () => {},
    }),
    [itemSize, estimatedItemSize],
  )

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return _react.createElement(reactWindow.List, {
    rowCount: itemCount,
    rowHeight,
    rowComponent: RowComponent,
    rowProps: {},
    overscanCount,
    onRowsRendered: makeOnRowsRendered(onItemsRendered),
    direction,
    style: { height, width },
    ...rest,
  })
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
reactWindow.VariableSizeList = VariableSizeList
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
reactWindow.FixedSizeList = FixedSizeList
// Alias for plugins using the old names directly
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!reactWindow.VariableSizeGrid) reactWindow.VariableSizeGrid = reactWindow.Grid
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!reactWindow.FixedSizeGrid) reactWindow.FixedSizeGrid = reactWindow.Grid
