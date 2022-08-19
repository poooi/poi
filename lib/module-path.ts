/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore: module seems to be special
import { Module } from 'module'
import path from 'path'

// @ts-ignore: patching internal variables
const { _nodeModulePaths } = Module

const allowedPaths = new Set<string>()

const MODULE_PATH = path.join(__dirname, '..', 'node_modules')

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

    const originResult = _nodeModulePaths.call(this, from)

    // if require path is including module path, do not put allowed path so that
    // require priority won't be messed up
    const ignoreAllowedPath = from.startsWith(MODULE_PATH)

    // put allowed path in front so that main program's module path has higher priority
    return ignoreAllowedPath ? originResult : allowedPathsArray.concat(originResult)
  }
}
