// Process Command Line Arguments
import chalk from 'chalk'
import Debug from './debug'
import { app } from 'electron'
import { warn } from './utils'
import yargs from 'yargs'

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
  .parse(rawArgv)

// Print Version Info to Console and Exit
const printVersionAndExit = () => {
  console.warn(chalk.blue.bold(`${app.getName()} ${app.getVersion()}`))
  console.warn(chalk.cyan([
    `(electron@${process.versions.electron}`,
    `node@${process.versions.node}`,
    `chrome@${process.versions.chrome}`,
    `react@${require('react').version})`,
  ].join(' ')))
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
  argv.extra.forEach(extra => Debug.enableExtra(extra))
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
