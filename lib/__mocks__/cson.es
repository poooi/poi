export const parseCSONFile = jest.fn(() => ({}))

export const stringify = jest.fn(() => 'CSON Stringified')

module.exports = {
  parseCSONFile,
  stringify,
}
