// @ts-check

const path = require('node:path')

const { includeIgnoreFile } = require('@eslint/compat')
const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const globals = require('globals')

const babelParser = require('@babel/eslint-parser')
const tsParser = require('@typescript-eslint/parser')
const tsEslint = require('@typescript-eslint/eslint-plugin')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Keep behavior in sync with the previous CLI use of --ignore-path .gitignore
  includeIgnoreFile(path.join(__dirname, '.gitignore')),

  ...compat.extends(
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import-x/errors',
    'plugin:import-x/warnings',
    'plugin:prettier/recommended',
  ),

  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaFeatures: {
          legacyDecorators: true,
        },
        requireConfigFile: false,
        babelOptions: {
          configFile: path.join(__dirname, 'babel.config.js'),
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-var': 'error',
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      'unicode-bom': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'react/prop-types': 'off',
      'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
      'import-x/no-named-as-default-member': 'off',
      // import-x is stricter about CJS packages (lodash/bluebird, etc.) than eslint-plugin-import.
      // This repo historically relies on named imports from those packages.
      'import-x/named': 'off',
      'react-hooks/rules-of-hooks': 'error',
      // Keep repo behavior: report but don't hard-fail on formatting.
      'prettier/prettier': 'warn',
    },
    settings: {
      react: {
        version: require('react').version,
      },
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver': {
        node: {
          extensions: ['', '.js', '.jsx', '.es', '.ts', '.tsx'],
          paths: [__dirname],
        },
        typescript: {
          project: path.join(__dirname, 'tsconfig.json'),
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.es', '.json'],
        },
      },
      // Not standard npm packages; resolved via tsconfig paths / bundler.
      'import-x/external-module-folders': ['node_modules', __dirname],
      'import-x/core-modules': ['electron', 'redux-observers'],
      'import-x/ignore': ['react-i18next'],
    },
  },

  // Mirror the legacy TS override (ts parser + @typescript-eslint recommended configs).
  ...compat
    .extends(
      'plugin:import-x/typescript',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
    )
    .map((config) => ({
      ...config,
      files: ['**/*.{ts,tsx}'],
    })),

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      // Keep repo behavior: report but don't hard-fail on these.
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Keep repo behavior: allow CommonJS requires in TS.
      '@typescript-eslint/no-require-imports': 'off',
      // Keep repo behavior: allow short-circuit expressions like `cond && fn()`.
      '@typescript-eslint/no-unused-expressions': 'off',

      // TS/DOM types are compile-time only.
      'no-undef': 'off',
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },

  {
    files: ['views/components/etc/webview.tsx', 'views/components/settings/about/gpu-status.es'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },

  {
    files: ['views/polyfills/react-bootstrap.es', 'views/polyfills/react-i18next.es'],
    rules: {
      'import-x/namespace': 'off',
      'no-import-assign': 'off',
    },
  },
]
