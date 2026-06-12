/**
 * react-window v2 merged VariableSizeList/FixedSizeList → List, and the prop API
 * changed completely: v1's children render-prop became rowComponent, itemCount →
 * rowCount, itemData → rowProps (spread), itemSize (fn) → rowHeight object, and
 * height/width are now part of the style prop.
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
  const RowComponent = _react.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function Row({ index, style }: any) {
        return children({ index, style, data: itemData })
      },
    [children, itemData],
  )

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
  const RowComponent = _react.useMemo(
    () =>
      function Row({ index, style }: any) {
        return children({ index, style, data: itemData })
      },
    [children, itemData],
  )

  // v2 variable-height rowHeight: object with getRowHeight + getAverageRowHeight + observeRowElements.
  // observeRowElements is a no-op since the plugin supplies all sizes via itemSize already.
  const rowHeight = _react.useMemo(
    () => ({
      getRowHeight: (index: number) => itemSize(index),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      getAverageRowHeight: () => estimatedItemSize as number,
      observeRowElements: () => () => {},
    }),
    [itemSize, estimatedItemSize],
  )

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

reactWindow.VariableSizeList = VariableSizeList
reactWindow.FixedSizeList = FixedSizeList
// Alias for plugins using the old names directly
if (!reactWindow.VariableSizeGrid) reactWindow.VariableSizeGrid = reactWindow.Grid
if (!reactWindow.FixedSizeGrid) reactWindow.FixedSizeGrid = reactWindow.Grid
