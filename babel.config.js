module.exports = {
  presets: [["es2015-node6", { "loose": true }], "stage-0", "react"],
  plugins: [
    "add-module-exports",
    ["transform-async-to-module-method", {
      module: "bluebird",
      method: "coroutine"
    }]
  ],
  ignore: false,
  only: /.es$/
}
