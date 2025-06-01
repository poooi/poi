module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          electron: '36.3',
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
    [require.resolve('@babel/plugin-proposal-pipeline-operator'), { proposal: 'minimal' }],
  ].concat(
    [
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-function-bind',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-throw-expressions',
      'babel-plugin-add-module-exports',
      'babel-plugin-dynamic-import-node',
    ].map((plugin) => require.resolve(plugin)),
  ),
  ignore: [],
  only: [/\.(es|ts|tsx)$/],
  babelrc: false,
}
