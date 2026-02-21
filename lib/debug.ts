/*
eslint-disable no-console
*/

import chalk from 'chalk'
import _ from 'lodash'
import moment from 'moment'

type LogType = 'assert' | 'debug' | 'error' | 'info' | 'log' | 'table' | 'trace' | 'warn'

type DefaultLogger = Console['log']

const logLevels = {
  assert: {
    color: '#ed556a',
  },
  debug: {
    color: '#EEAEEE',
  },
  error: {
    color: '#ed556a',
  },
  info: {
    color: 'cyan',
  },
  log: {
    color: '#66ff66',
  },
  table: {
    color: '#913999',
  },
  trace: {
    color: '#FFAEB9',
  },
  warn: {
    color: '#ff9900',
  },
}

const getLogformatArgs = (logLevel: LogType = 'log', prefix: string) => [
  `%c${moment().format('YYYY-MM-DD HH:mm:ss')} <${logLevel.toUpperCase()}> ${prefix.toUpperCase()}`,
  `
    background: ${logLevels[logLevel]?.color};
    font-weight: bold;
    padding: 3px 5px;
    margin-bottom: 5px;
    color: ${logLevel === 'error' ? '#fff' : '#000'};
    border-radius: 5px;
  `,
  `\n`,
]

// Debug wrapper class is only for the purpose of beautifying
// when certain function is called through the dev-tool console.
// (e.g., shows 'Debug {enabled: true}' instead of 'undefined')
// It should NOT be used for any other purpose.
class Debug {
  public static wrap(o: string | object) {
    if (typeof o === 'string') {
      return Object.assign(new Debug(), { msg: o })
    } else if (typeof o === 'object') {
      return Object.assign(new Debug(), o)
    } else {
      return o
    }
  }
}

// Globals
console.assert(process, `process doesn't exist`)

// The debug instance depends on Electron process type
const isRenderer = (process || {}).type === 'renderer'

// the very base class
abstract class BaseDebugger {
  public debug: Console['debug'] = (...args: never[]) => this.getLeveledLog('debug')(...args)

  public log: Console['log'] = (...args: never[]) => this.getLeveledLog('log')(...args)

  public info: Console['info'] = (...args: never[]) => this.getLeveledLog('info')(...args)

  public warn: Console['warn'] = (...args: never[]) => this.getLeveledLog('warn')(...args)

  public error: Console['error'] = (...args: never[]) => this.getLeveledLog('error')(...args)

  public trace: Console['trace'] | void = (...args: never[]) => this.getLeveledLog('trace')(...args)

  public table: Console['table'] = (...args: never[]) =>
    (this.getLeveledLog('table') as Console['table'])(...args)

  public assert: Console['assert'] = (...args: never[]) => this.getLeveledLog('assert')(...args)

  protected prefix = '[MAIN]'

  protected _enabled = false

  public isEnabled() {
    return this._enabled
  }

  public setEnabled(b = true) {
    this._enabled = b
    return Debug.wrap({ enabled: b })
  }

  public enable() {
    this.setEnabled(true)
  }

  public disable() {
    this.setEnabled(false)
  }

  protected abstract getLogFunc(level: LogType): DefaultLogger

  protected getLeveledLog(level: LogType): (...args: never[]) => void {
    if (this.isEnabled()) {
      switch (level) {
        case 'assert':
          return console.assert.bind(console)
        case 'table':
          return console.table.bind(console)
        default:
          return this.getLogFunc(level)
      }
    } else {
      return _.noop
    }
  }
}

// Extra Option Handler
class ExtraDebugger extends BaseDebugger {
  constructor(tag: string) {
    super()
    this.prefix = tag
  }

  protected getLogFunc(level: LogType = 'log') {
    if (this.prefix != null) {
      return console[level as 'log'].bind(console, ...getLogformatArgs(level, this.prefix))
    } else if (level === 'assert' || level === 'table') {
      // Fallback to console.log for non-standard log methods to avoid runtime errors
      return console.log.bind(console)
    } else {
      return console[level].bind(console)
    }
  }
}

// Base Implementation
abstract class DebuggerBase extends BaseDebugger {
  public h = new Map<string, ExtraDebugger>()
  public internalLog = this.getLogFunc('log')

  protected initialised = false

  constructor() {
    super()
    this.init()
  }

  public isInitialised() {
    const r = this.initialised
    this.initialised = true
    return r
  }

  public validateTagName(tag: string) {
    const valid = typeof tag === 'string' && tag.length > 0
    console.assert(valid, 'You must pass a non-empty string! Current:', tag)
    return valid
  }

  public enableExtra(tag: string) {
    if (!this.extra(tag)) {
      return Debug.wrap('Invalid extra option name')
    }
    this.extra(tag)?.enable()
    return Debug.wrap({ enabledExtra: tag })
  }

  public disableExtra(tag: string) {
    if (!this.validateTagName(tag)) {
      return Debug.wrap('Invalid extra option name')
    }
    this.extra(tag)?.disable()
    return Debug.wrap({ disabledExtra: tag })
  }

  public isExtraEnabled(tag: string) {
    if (!this.validateTagName(tag)) {
      return false
    }
    const h = this.h.get(tag)
    return h && h.isEnabled()
  }

  public getAllExtraOptionsAsArray() {
    return Array.from(this.h)
  }

  public extra(tag: string, enableImmediately = false) {
    if (this.validateTagName(tag) && !this.h.get(tag)) {
      const extraHandler = new ExtraDebugger(tag)
      if (enableImmediately) {
        extraHandler.setEnabled()
      }
      this.h.set(tag, extraHandler)
    }
    return this.h.get(tag)
  }

  public main() {
    if (!this.h || !this.h.get('main')) {
      this.h.set('main', new ExtraDebugger('[MAIN]'))
    }
    return this.h.get('main')
  }

  public init() {
    this.isEnabled() && this.log('Debugger Enabled')
    if (this.h.size > 0) {
      this.internalLog(`handler(s): ${Array.from(this.h.keys())}`)
    }
  }

  protected abstract getLogFunc(level: LogType): DefaultLogger
}

// add two clickable method to enable/disable
class Booster {
  public enabled: boolean
  public type: string

  constructor(dbgr: BaseDebugger, type: string, relistFunc: () => void) {
    this.enabled = dbgr.isEnabled()
    this.type = type
    const enable = dbgr.enable.bind(dbgr)
    const disable = dbgr.disable.bind(dbgr)
    if (this.enabled) {
      Reflect.defineProperty(this, 'ClickToDisable -->', {
        get: () => {
          disable()
          relistFunc()
          return 'Disabled'
        },
      })
    } else {
      Reflect.defineProperty(this, 'ClickToEnable -->', {
        get: () => {
          enable()
          relistFunc()
          return 'Enabled'
        },
      })
    }
  }
}

// For the Main Process
class DebuggerMain extends DebuggerBase {
  public static getInstance() {
    if (!DebuggerMain.instance) {
      DebuggerMain.instance = new DebuggerMain()
    }
    return DebuggerMain.instance
  }

  private static instance: DebuggerMain | null = null

  constructor() {
    super()
    this.assert(!DebuggerMain.instance, 'cannot create second instance')
    this.info('debugger main created')
  }

  public getLogFunc(level: LogType = 'log') {
    return console[level as 'log'].bind(
      console,
      chalk.cyan(`${this.prefix} %s`),
    ) as Console[LogType]
  }
}

// Helper classes to make life easier with DevTools
class DevToolsBooster {
  [key: string]: Booster | null
}

// For the Renderer Processes
class DebuggerRenderer extends DebuggerBase {
  public static getInstance() {
    if (!DebuggerRenderer.instance) {
      DebuggerRenderer.instance = new DebuggerRenderer()
    }
    return DebuggerRenderer.instance
  }

  private static instance: DebuggerRenderer | null = null

  public list() {
    const relist = this.list.bind(this)
    const output = new DevToolsBooster()
    output.DEBUG = new Booster(this, 'main', relist)
    this.h.forEach((handler, opt) => {
      if (opt === 'main') {
        return
      }
      output[opt] = new Booster(handler, 'extra', relist)
    })
    console.table(output)
  }

  protected getLogFunc(level: LogType = 'log'): Console[LogType] {
    if (this.prefix != null) {
      return console[level as 'log'].bind(console, ...getLogformatArgs(level, this.prefix))
    } else {
      return console[level].bind(console)
    }
  }
}

const dbg = isRenderer ? DebuggerRenderer.getInstance() : DebuggerMain.getInstance()

export type DbgInstance = typeof dbg

export default dbg
