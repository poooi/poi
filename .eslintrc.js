//@ts-check

const configExtends = [
  'eslint:recommended',
  'plugin:react/recommended',
  'plugin:react-hooks/recommended',
  'plugin:import/errors',
  'plugin:import/warnings',
]

const configExtendsPrettier = ['prettier']

/** @type { import("eslint").Linter.Config } */
module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: [...configExtends, ...configExtendsPrettier],
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ['import', 'react', 'prettier', 'react-hooks'],
  parser: '@babel/eslint-parser',
  rules: {
    'linebreak-style': ['error', 'unix'],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-var': 'error',
    'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
    'unicode-bom': 'error',
    'prefer-const': ['error', { destructuring: 'all' }],
    'react/prop-types': 'off',
    'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
    'import/no-named-as-default-member': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'prettier/prettier': 'warn',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['', '.js', '.jsx', '.es', '.ts', '.tsx'],
        paths: [__dirname],
      },
    },
    'import/core-modules': ['electron', 'redux-observers'],
    'import/ignore': ['react-i18next'],
    react: {
      version: require('react').version,
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'import', 'react', 'prettier', 'react-hooks'],
      extends: [
        ...configExtends,
        'plugin:import/typescript',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        ...configExtendsPrettier,
      ],
      rules: {
        // Keep repo behavior: report but don't hard-fail on these.
        '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
        '@typescript-eslint/no-explicit-any': 'warn',
      },
      settings: {
        'import/resolver': {
          node: {
            extensions: ['', '.js', '.jsx', '.es', '.ts', '.tsx'],
            paths: [__dirname],
          },
        },
      },
    },
  ],
}
