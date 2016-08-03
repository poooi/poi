const getPluginIndexByPackageName = (plugins, packageName) => {
  for (let i = 0; i < plugins.length; i++) {
    if (plugins[i].packageName === packageName) {
      return i
    }
  }
  return -1
}

export {
  getPluginIndexByPackageName,
}
