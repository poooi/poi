/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore: module seems to be special
import { Module } from 'module'
import path from 'path'

// @ts-ignore: patching internal variables
const { _nodeModulePaths } = Module

const allowedPaths = new Set<string>()

/**
 * this is the same function from views/utils, we cannot share because we want to also use it in main
 */
function isSubdirectory(parent: string, dir: string) {
  const relative = path.relative(parent, dir)
  return !relative || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

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

    // putting allowed path in front so that main program's module path has higher priority
    return allowedPathsArray.concat(
      _nodeModulePaths.call(this, from).filter(function (dir: string) {
        return allowedPathsArray.some(function (parent) {
          return isSubdirectory(parent, dir)
        })
      }),
    )
  }
}
