module.exports = {
  'extends': [
    'stylelint-config-standard',
  ],
  'customSyntax': 'postcss-styled-syntax',
  rules: {
    'alpha-value-notation': 'number',
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['kan-game', '/^poi-/', 'title-bar', 'webview'],
      },
    ],
    'block-no-empty': null,
    'value-keyword-case': ['lower', { ignoreKeywords: [/dummyValue/] }],
    'keyframes-name-pattern': null,
    'function-no-unknown': [true, { ignoreFunctions: ['-webkit-gradient', 'from', 'to'] }],
  },
}
