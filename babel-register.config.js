const babelConfig = require('./babel.config')

module.exports = {
  ...babelConfig,
  extensions: ['.es', '.ts', '.tsx'],
  cache: false,
}
