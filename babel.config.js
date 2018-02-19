module.exports = {
  presets: [
    ["env", {
      "targets": {
        "node": "8.2",
      },
    }], "stage-0", "react"],
  plugins: [
    "dynamic-import-node",
  ],
  only: [/.es$/],
}
