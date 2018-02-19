module.exports = {
  presets: [
    ["env", {
      "targets": {
        "electron": "1.8",
      },
    }], "stage-0", "react"],
  plugins: [
    "dynamic-import-node",
  ],
  only: [/.es$/],
}
