import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import type { Linter } from 'eslint'
import { includeIgnoreFile } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import globals from 'globals'
import perfectionist from 'eslint-plugin-perfectionist'

import babelParser from '@babel/eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsEslint from '@typescript-eslint/eslint-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const config: Linter.Config[] = [
  // Keep behavior in sync with the previous CLI use of --ignore-path .gitignore
  includeIgnoreFile(join(__dirname, '.gitignore')),

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
          configFile: join(__dirname, 'babel.config.js'),
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
        version: 'detect',
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
          project: join(__dirname, 'tsconfig.json'),
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.es', '.json'],
        },
      },
      // Not standard npm packages; resolved via tsconfig paths / bundler.
      'import-x/external-module-folders': ['node_modules', __dirname],
      'import-x/core-modules': ['electron', 'redux-observers'],
      'import-x/ignore': ['react-i18next'],
    },
  },

  // TypeScript/TSX files configuration
  ...compat.extends('plugin:import-x/typescript').map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // Spread the TypeScript ESLint recommended configs (array)
  ...tsEslint.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: join(__dirname, 'tsconfig.json'),
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
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
      '@typescript-eslint/consistent-type-imports': 'error',
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
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': 'error',
    },
  },
]

export default config
