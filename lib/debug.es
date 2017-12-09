//////////////////////////////////////////////////////////////////////////////////
//                                 Debug Suite                                  //
//////////////////////////////////////////////////////////////////////////////////

const chalk = require('chalk')

// Debug wrapper class is only for the purpose of beautifying
// when certain function is called through the dev-tool console.
// (e.g., shows "Debug {enabled: true}" instead of "undefined")
// It should NOT be used for any other purpose.
class Debug {
  static wrap(o) {
    if (typeof o === 'string') {
      return Object.assign(new Debug, {msg: o})
    } else if (typeof o === 'object') {
      return Object.assign(new Debug, o)
    } else {
      return o
    }
  }
}

// Globals
// eslint-disable-next-line no-console
console.assert(process, "process doesn't exist")

// The debug instance depends on Electron process type
const isRenderer = (process || {}).type === 'renderer'

// debugger enable flag, and extra options set
let enabled = false
const extraOpts = new Set()

const doNothing = () => {}

// helper method to assign function to a class
const definePureVirtual = (obj, name, defaultReturn = false) =>
  Object.defineProperty(obj, name, {
    value: () => {
      console.error(`[ERROR] Child class must implement "${name}!"`)
      return defaultReturn
    },
    writable: true,
  }
  )

// the very base class
class IDebugger {
  get log() {
    if (this.isEnabled()) {
      return this._log
    } else {
      return doNothing
    }
  }

  get assert() {
    if (this.isEnabled()) {
      // eslint-disable-next-line no-console
      return console.assert.bind(console)
    } else {
      return doNothing
    }
  }
}

// add fallback function for IDebugger
definePureVirtual(IDebugger.prototype, 'isEnabled')
definePureVirtual(IDebugger.prototype, '_log')

// Extra Option Handler
class ExOptHandler extends IDebugger {}

// Extra options container (just need the name)
class ExtraDebugOptions {}

// Base Implementation
class DebuggerBase extends IDebugger {
  constructor () {
    super()
    this.main()
  }

  initialised = false
  _log = this._getLogFunc('[DEBUG]')

  isInitialised()  {
    const r = this.initialised
    this.initialised = true
    return r
  }

  init() {
    this.log("Debug Mode")
    if (extraOpts.size === 1) {
      this._log(`Extra Option: ${process.env.DEBUG_EXTRA}`)
    } else if (extraOpts.size > 1) {
      this._log(`Extra Options: ${process.env.DEBUG_EXTRA}`)
    }
  }


  setEnabled(b = true) {
    enabled = b
    return Debug.wrap({enabled: b})
  }

  enable() {
    this.setEnabled(true)
  }

  disable() {
    this.setEnabled(false)
  }

  isEnabled = () => enabled || false

  validateTagName(tag) {
    const valid = typeof tag === 'string' && tag.length > 0
    // eslint-disable-next-line no-console
    console.assert(valid, 'You must pass a non-empty string! Current:', tag)
    return valid
  }

  enableExtra(tag) {
    if (!this.extra(tag)) {
      return Debug.wrap('Invalid extra option name')
    }
    extraOpts.add(tag.toString())
    return Debug.wrap({enabledExtra: tag})
  }

  disableExtra(tag) {
    if (!this.validateTagName(tag)) {
      return Debug.wrap('Invalid extra option name')
    }
    extraOpts.delete(tag.toString())
    return Debug.wrap({disabledExtra: tag})
  }

  isExtraEnabled(tag) {
    if (!this.validateTagName(tag)) {
      return false
    }
    return extraOpts.has(tag)
  }

  getAllExtraOptionsAsArray() {
    return Array.from(extraOpts)
  }

  extra(tag) {
    if (this.validateTagName(tag) && this.h[tag] == null) {
      Object.defineProperty(this.h, tag,{
        value: new ExOptHandler,
        enumerable: true,
      })
      Object.defineProperties(this.h[tag],{
        enable: {
          value: this.enableExtra.bind(this, tag),
        },
        disable: {
          value: this.disableExtra.bind(this, tag),
        },

        isEnabled: {
          value: this.isExtraEnabled.bind(this, tag),
        },
        _log: {
          value: this._getLogFunc(`[${tag}]`),
        },
        toString: {
          value: () => `[${tag}: ${this.isEnabled() ? 'enabled' : 'disabled'}]`,
        },
      })
    }
    return this.h[tag]
  }

  main() {
    if (this.h.main == null) {
      Object.defineProperty(this.h, 'main',{
        value: new ExOptHandler,
        enumerable: true,
      })
      Object.defineProperties (this.h.main,{
        enable: {
          value: this.enable.bind(this),
        },
        disable: {
          value: this.disable.bind(this),
        },
        isEnabled: {
          value: this.isEnabled.bind(this),
        },
        _log: {
          value: this._log,
        },
        toString: {
          value: () => `[main: ${this.isEnabled() ? 'enabled' : 'disabled'}]`,
        },
      })
    }
    return this.h.main
  }
}

// add fallback function for _getLogFunc
definePureVirtual(DebuggerBase.prototype, '_getLogFunc', doNothing)

// manually set h to be enumerable
Object.defineProperty(DebuggerBase.prototype, 'h', {
  value: new ExtraDebugOptions,
  enumerable: true,
})

// For the Main Process
class DebuggerMain extends DebuggerBase {
  _getLogFunc(prefix) {
    // eslint-disable-next-line no-console
    return console.log.bind(console, chalk.cyan(`${prefix} %s`))
  }

  init() {
    if (this.isInitialised()) {
      return Debug.wrap('Already initialised')
    }
    if (this.isEnabled()) {
      process.env.DEBUG = 1
    }
    if (extraOpts.size > 0) {
      process.env.DEBUG_EXTRA = Array.from(extraOpts).join(',')
    }
    super.init()
  }
}

// Helper classes to make life easier with DevTools
class DevToolsBooster {}

// add two clickable method to enable/disable
class Booster {
  constructor(dbgr, type, relistFunc) {
    this.Enabled = dbgr.isEnabled()
    this.Type = type
    const enable = dbgr.enable.bind(dbgr)
    const disable = dbgr.disable.bind(dbgr)
    if (this.Enabled) {
      Object.defineProperty (this, 'ClickToDisable -->',{
        get: () => {
          disable()
          relistFunc()
          return 'Disabled'
        },
      })
    } else {
      Object.defineProperty(this, 'ClickToEnable -->',{
        get: () => {
          enable()
          relistFunc()
          return 'Enabled'
        },
      })
    }
  }
}

// For the Renderer Processes
class DebuggerRenderer extends DebuggerBase {
  _getLogFunc(prefix) {
    if (prefix != null) {
      // eslint-disable-next-line no-console
      return console.log.bind(console, `%c${prefix}`, 'background: linear-gradient(30deg, cyan, white 3ex)')
    } else {
      // eslint-disable-next-line no-console
      return console.log.bind(console)
    }
  }
  init() {
    if (this.isInitialised()) {
      return Debug.wrap('Already initialised')
    }
    this.setEnabled(process.env.DEBUG != null)
    if (process.env.DEBUG_EXTRA != null) {
      process.env.DEBUG_EXTRA.split(',').forEach(this.enableExtra.bind(this))
    }
    super.init()
  }
  list() {
    const relist = this.list.bind(this)
    const output = new DevToolsBooster
    output['DEBUG'] = new Booster(this, 'main', relist)
    for (const opt of Object.keys(this.h)) {
      if (opt === 'main') {
        continue
      }
      output[opt] = new Booster(this.h[opt], 'extra', relist)
    }
    // eslint-disable-next-line no-console
    console.table(output)
  }
}

const dbg = isRenderer ? new DebuggerRenderer : new DebuggerMain

export default dbg
