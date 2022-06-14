const postCssSyntax = require('postcss-syntax')

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier',
    'stylelint-config-styled-components',
  ],
  rules: {
    'alpha-value-notation': 'number',
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['kan-game', '/^poi-/', 'title-bar', 'webview'],
      },
    ],
    'block-no-empty': null,
    'declaration-colon-newline-after': null,
    'value-keyword-case': ['lower', { ignoreKeywords: [/dummyValue/] }],
    'keyframes-name-pattern': null,
    'function-no-unknown': [true, { 'ignoreFunctions': ['-webkit-gradient', 'from', 'to'] }]
  },
  overrides: [
    {
      files: ['**/*.es', '**/*.tsx'],
      customSyntax: postCssSyntax({
        'styled-components': true,
      })
    }
  ]
}
