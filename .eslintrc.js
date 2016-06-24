module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  'installedESLint': true,
  'parserOptions': {
    'ecmaVersion': 7,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true,
    },
    'sourceType': 'module',
  },
  'plugins': [
    'react',
  ],
  'parser': 'babel-eslint',
  'rules': {
    'no-console': ['warn', {'allow': ['warn', 'error']}],
    'no-unused-vars': ['warn', {'args': 'none'}],
  },
}
