module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          electron: '38',
        },
        loose: true,
        exclude: ['transform-dynamic-import'],
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
    ].map((plugin) => require.resolve(plugin)),
  ),
  overrides: [
    {
      // Plugin files live outside poi's root directory. They need import() transformed
      // to require() so bare specifiers resolve through @babel/register's path patches.
      test: (filename) => {
        if (!filename) return false
        const path = require('path')
        const root = __dirname + path.sep
        return !filename.startsWith(root) && filename !== __dirname
      },
      plugins: [require.resolve('@babel/plugin-transform-dynamic-import')],
    },
  ],
  ignore: [],
  only: process.env.JEST_WORKER_ID ? [/\.(js|es|ts|tsx)$/] : [/\.(es|ts|tsx)$/],
  babelrc: false,
}
