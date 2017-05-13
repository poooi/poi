// Process Command Line Arguments
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
  .alias('v', 'version')
  .describe('v', 'prints the version')
  .boolean('d')
  .alias('d', 'dev')
  .describe('dev', 'enable developer debug mode')
  .array('extra')
  .alias('extra', 'dev-extra')
  .describe('extra', `enable extra debug option, usage --dev-extra extraA extraB`)
  .boolean('s')
  .alias('s', 'safe')
  .describe('s', 'enables safe mode, reset the redux store and disables all plugins')
  .parse(rawArgv)

// Print Version Info to Console and Exit
const printVersionAndExit = () => {
  console.warn(`${app.getName()} ${app.getVersion()}`.bold.blue)
  console.warn([
    `(electron@${process.versions.electron}`,
    `node@${process.versions.node}`,
    `chrome@${process.versions.chrome}`,
    `react@${require('react').version})`,
  ].join(' ').cyan)
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
