module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    mocha: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
    'prettier/react',
  ],
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ['import', 'react', 'prettier', 'react-hooks'],
  parser: 'babel-eslint',
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'linebreak-style': ['error', 'unix'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-var': 'error',
    'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
    semi: ['error', 'never'],
    'unicode-bom': 'error',
    'prefer-const': ['error', { destructuring: 'all' }],
    'react/prop-types': [0],
    'no-irregular-whitespace': [
      'error',
      { skipStrings: true, skipTemplates: true },
    ],
    'import/no-named-as-default-member': [0],
    'jsx-quotes': ['error', 'prefer-double'],
    'react-hooks/rules-of-hooks': 'error',
    'prettier/prettier': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['', '.js', '.jsx', '.es', '.coffee', '.cjsx'],
        paths: [__dirname],
      },
    },
    'import/core-modules': ['electron', 'redux-observers'],
    react: {
      version: require('react').version,
    },
  },
}
