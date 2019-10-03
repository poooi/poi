module.exports = {
  processors: [
    [
      'stylelint-processor-styled-components',
      {
        parserPlugins: [
          'jsx',
          'objectRestSpread',
          ['decorators', { decoratorsBeforeExport: true }],
          'classProperties',
          'exportExtensions',
          'asyncGenerators',
          'functionBind',
          'functionSent',
          'dynamicImport',
          'optionalCatchBinding',
          'optionalChaining',
          'doExpressions',
          'exportDefaultFrom',
        ],
      },
    ],
  ],
  extends: ['stylelint-config-standard', 'stylelint-config-styled-components'],
  rules: {
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['kan-game', '/^poi-/', 'title-bar', 'webview'],
      },
    ],
    'block-no-empty': null,
    'declaration-colon-newline-after': null,
  },
}
