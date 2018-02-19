module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          electron: "1.8",
        },
        loose: true,
      },
    ],
    "@babel/preset-stage-0",
    "@babel/preset-react",
  ],
  plugins: [
    "transform-export-extensions",
    "dynamic-import-node",
    "add-module-exports",
  ],
  ignore: [],
  only: [/.es$/],
}
