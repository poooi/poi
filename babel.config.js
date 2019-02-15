module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          electron: '3.0',
        },
        loose: true,
      },
    ],
    require.resolve('@babel/preset-react'),
    require.resolve('@babel/preset-typescript'),
  ],
  plugins: [
    require.resolve('babel-plugin-styled-components'),
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
    [require.resolve('@babel/plugin-proposal-pipeline-operator'), { proposal: 'minimal' }],
  ].concat(
    [
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-function-bind',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-json-strings',
      '@babel/plugin-proposal-logical-assignment-operators',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-import-meta',
      'babel-plugin-add-module-exports',
      'babel-plugin-dynamic-import-node',
    ].map(plugin => require.resolve(plugin)),
  ),
  ignore: [],
  only: [/\.(es|ts|tsx)$/],
  babelrc: false,
}
