/**
 * FIXME: remove this polyfill when plugins have migrated to react-window v2
 * react-window v2 merged VariableSizeList/FixedSizeList into List, and
 * VariableSizeGrid/FixedSizeGrid into Grid.
 */
const reactWindow = require('react-window')

if (!reactWindow.VariableSizeList) reactWindow.VariableSizeList = reactWindow.List
if (!reactWindow.FixedSizeList) reactWindow.FixedSizeList = reactWindow.List
if (!reactWindow.VariableSizeGrid) reactWindow.VariableSizeGrid = reactWindow.Grid
if (!reactWindow.FixedSizeGrid) reactWindow.FixedSizeGrid = reactWindow.Grid
