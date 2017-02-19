// Process Command Line Arguments
import Debug from './debug'
import { app } from 'electron'
// At this stage we only support a few flags,
// so it's OK to process them one by one like this
// If one day we need to process more command line arguments,
// it's better to find a 3rd party command line library to do this job.

// Pre-process Arguments
let ignore2ndArg = false

const reElectron = /electron(.exe)?$/i

const preprocessArg = (arg, idx) => {
  switch (idx) {
  case 0:
    if (reElectron.test(arg)) {
      ignore2ndArg = true
    }
    return true
  case 1:
    return ignore2ndArg
  default:
    return false
  }
}

// Print Version Info to Console and Exit
const printVersionAndExit = () => {
  console.warn(`${app.getName()} ${app.getVersion()}`.bold.blue,
    `(electron v${process.versions.electron},
      node v${process.versions.node},
      chrome v${process.versions.chrome},
      react v${require('react').version})`.cyan)
  app.exit(0)
}

const reVersion = /^-(-version|v)$/i

const checkShowVersion = (arg) => {
  if (!reVersion.test(arg)) {
    return false
  }
  printVersionAndExit()
}
// Parse Debug Options
const reDebug = /^-(?:-debug(?:=(true|false))?|d)$/i
const ex = "[A-Za-z_]\\w*"
const reDebugEx = new RegExp(`^--debug-extra=${ex}(,${ex})*$`, 'i')
const reDebugExD = new RegExp(`^--debug-extra-d=${ex}(,${ex})*$`, 'i')
const reExtra = new RegExp(`${ex}(?=,|$)`, 'gi')
const reDebugBrk = /^--debug-brk$/ // CLI for node. You'll need node debugger to continue.
const parseDebugOptions = (arg) => {
  switch (true) {
  case reDebug.test(arg):
    Debug.setEnabled(reDebug.exec(arg)[1] !== 'false')
    break
  case reDebugEx.test(arg): {
    for (let i = 0; i < arg.match(reExtra).length; i++) {
      Debug.enableExtra(arg.match(reExtra)[i])
    }
    break
  }
  case reDebugExD.test(arg): {
    for (let i = 0; i < arg.match(reExtra).length; i++) {
      Debug.disableExtra(arg.match(reExtra)[i])
    }
    break
  }
  case reDebugBrk.test(arg):
    Debug.enableExtra('brk')
    break
  default:
    return false
  }
  return true
}

const reSafeMode = /^-(-safe|S)$/i

const checkSafeMode = (arg) => {
  if (reSafeMode.test(arg)) {
    global.isSafeMode = true
    return true
  } else {
    return false
  }
}

// Process Command Line Arguments one by one
process.argv.forEach((arg, idx) =>{
  switch (true) {
  case preprocessArg(arg, idx): return
  case checkShowVersion(arg): return
  case parseDebugOptions(arg): return
  case checkSafeMode(arg): return
  // case parseWhateverOtherOptions(arg): return
  // else - unrecognized argument, just ignore.
  }
})

// Finish initialization of debug environment
Debug.init()
global.dbg = Debug
