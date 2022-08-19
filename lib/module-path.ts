/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore: module seems to be special
import { Module } from 'module'

// @ts-ignore: patching internal variables
const { _nodeModulePaths } = Module

const allowedPaths = new Set<string>()

/**
 * we search for a package in node modules, we will node_modules at every level
 * but some unexpected packages from upper node_modules would break our app
 * we use this to filter out upper folders
 * @param allowedPaths {string[]} the limit we want
 */
export const setAllowedPath = function (...modulePaths: string[]) {
  modulePaths.forEach(function (modulePath) {
    allowedPaths.add(modulePath)
  })
  const allowedPathsArray = Array.from(allowedPaths)
  // @ts-ignore: patching internal variables
  Module._nodeModulePaths = function (from: string) {
    // use function style instead of arrows, expecting some possible perf gain

    // putting allowed path in back so that main program's module path has lower priority
    return _nodeModulePaths.call(this, from).concat(allowedPathsArray)
  }
}
