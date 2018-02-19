module.exports = {
  presets: [
    [
      "env",
      {
        targets: {
          electron: "1.8",
        },
        loose: true,
      },
    ],
    "stage-0",
    "react",
  ],
  plugins: [
    "transform-export-extensions",
    "dynamic-import-node",
    "add-module-exports",
  ],
  ignore: [],
  only: [/.es$/],
}
