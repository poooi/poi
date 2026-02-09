/* eslint-disable @typescript-eslint/no-namespace */
// Process Command Line Arguments
import chalk from 'chalk'
import { app } from 'electron'
import yargs from 'yargs'

import Debug from './debug'
import { warn } from './utils'

declare global {
  namespace NodeJS {
    interface Global {
      LATEST_COMMIT: string
      isSafeMode: boolean
      isDevVersion: boolean
      dbg: typeof Debug
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageMeta = require('../package.json')
global.LATEST_COMMIT = packageMeta.latestCommit

// check if starts with Electron app, e.g. `electron .`
// with Electron app: process.argv = [path to electron bin, '.', ...args ]
// without: process.argv = [path to poi bin, ...args]
const rawArgv = process.defaultApp ? process.argv.slice(2) : process.argv.slice(1)

const argv = yargs
  .help('h')
  .alias('h', 'help')
  // .alias('v', 'version')
  .describe('v', 'Print version')
  .boolean('d')
  .alias('d', 'dev')
  .describe('dev', 'Enable developer debug mode')
  .array('extra')
  .alias('extra', 'dev-extra')
  .describe('extra', 'Enable extra debug option, usage --dev-extra extraA extraB')
  .boolean('s')
  .alias('s', 'safe')
  .describe('s', 'Enable safe mode')
  .parseSync(rawArgv)

// Print Version Info to Console and Exit
const printVersionAndExit = () => {
  console.warn(chalk.blue.bold(`${app.getName()} ${app.getVersion()}`))
  if (global.LATEST_COMMIT) {
    console.warn(chalk.green`${global.LATEST_COMMIT}`)
  }
  console.warn(
    chalk.cyan(
      [
        `(electron@${process.versions.electron}`,
        `node@${process.versions.node}`,
        `chrome@${process.versions.chrome}`,
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        `react@${require('react').version})`,
      ].join(' '),
    ),
  )
  app.exit(0)
}

if (argv.v) {
  printVersionAndExit()
}

// dev, debug mode
if (argv.d) {
  Debug.setEnabled()
}

if (argv.extra) {
  argv.extra.forEach((extra) => Debug.enableExtra(String(extra)))
}

// safe mode
if (argv.s) {
  global.isSafeMode = true
  warn('Entering SAFE MODE.')
}

// Finish initialization of debug environment
Debug.init()
global.dbg = Debug

// detect git version or release
global.isDevVersion = !!process.defaultApp
