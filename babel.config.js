module.exports = {
  presets: ["es2015-node4", "stage-0", "react"],
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
