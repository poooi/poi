export const parseCSONFile = jest.fn(() => ({}))

export const stringify = jest.fn(() => 'CSON Stringified')

// Overwrite the ESM-shaped exports with a plain CJS object (no __esModule
// flag) so that `import CSON from 'cson'` interop resolves to this object.
module.exports = {
  parseCSONFile,
  stringify,
}
