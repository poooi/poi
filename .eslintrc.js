module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
    'mocha': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  'parserOptions': {
    'ecmaVersion': 7,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true,
    },
    'sourceType': 'module',
  },
  'plugins': [
    'import',
    'react',
  ],
  'parser': 'babel-eslint',
  'rules': {
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['warn', 2],
    'linebreak-style': ['error', 'unix'],
    'no-console': ['warn', {'allow': ['warn', 'error']}],
    'no-var': 'error',
    'no-unused-vars': ['warn', {'args': 'none'}],
    'semi': ['error', 'never'],
    'unicode-bom': 'error',
    'prefer-const': ['error', {'destructuring': 'all'}],
    'react/prop-types': [0],
    'no-irregular-whitespace': ['error', {'skipStrings': true, 'skipTemplates': true}],
    'import/no-named-as-default-member': [0],
  },
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['', '.js', '.jsx', '.es', '.coffee', '.cjsx'],
        'paths': [__dirname]
      },
    },
    'import/core-modules': ['electron', 'redux-observers'],
  },
}
