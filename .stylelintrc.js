module.exports = {
  extends: 'stylelint-config-standard',
  rules: {
    'selector-type-no-unknown': [true, {
      ignoreTypes: [
        'kan-game',
        '/^poi-/',
        'title-bar',
        'webview',
      ],
    }]
  },
  'ignoreFiles': [
    "**/*.es",
    "**/*.js"
  ]
}
