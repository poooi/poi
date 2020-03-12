import { Module } from 'module'
import path from 'path-extra'

const { _nodeModulePaths } = Module

/**
 * this is the same function from views/utils, we cannot share because we want to also use it in main
 */
function isSubdirectory(parent, dir) {
  const relative = path.relative(parent, dir)
  return !relative || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

/**
 * we search for a package in node modules, we will node_modules at every level
 * but some unexpected packages from upper node_modules would break our app
 * we use this to filter out upper folders
 * @param allowedPath {string[]} the limit we want
 */
export const setAllowedPath = function(allowedPath) {
  Module._nodeModulePaths = function(from) {
    // use function style instead of arrows, expecting some possible perf gain
    return _nodeModulePaths.call(this, from).filter(function(dir) {
      return allowedPath.some(function(parent) {
        return isSubdirectory(parent, dir)
      })
    })
  }
}
