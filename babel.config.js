module.exports = {
  presets: ["es2017-node7", "stage-0", "react"],
  plugins: [
    "add-module-exports",
    "dynamic-import-node",
  ],
  ignore: false,
  only: /.es$/,
}
