module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          electron: '2.0',
        },
        loose: true,
      },
    ],
    [
      require.resolve('@babel/preset-stage-0'),
      {
        decoratorsLegacy: true,
        pipelineProposal: 'minimal',
      },
    ],
    require.resolve('@babel/preset-react'),
  ],
  plugins: [
    require.resolve('babel-plugin-dynamic-import-node'),
    require.resolve('babel-plugin-add-module-exports'),
  ],
  ignore: [],
  only: [/.es$/],
  babelrc: false,
  cache: false,
}
