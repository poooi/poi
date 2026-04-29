import { sortBy, cloneDeep, partial } from 'lodash'

const INTERVAL = 1000

interface SchedulerOpts {
  time?: number
  interval?: number
  allowImmediate?: boolean
}

interface SchedulerTask {
  opts: SchedulerOpts
  next: number
  func: (time: number) => void
}

// Scheduler: Schedule one-time or interval tasks, without worrying the problem
//   that setTimeout pauses when the computer falls asleep.
//
// Scheduler.prototype.schedule(func, time)
//   Schedule an one-time task.
//     func: (scheduledTime) => {}
//     time: unix milliseconds.
// Scheduler.prototype.schedule(func, options)
//   Schedule a complicated task.
//     func: (scheduledTime) => {}
//     options:
//       time: unix milliseconds. The first start time, default Date.now()
//       interval: milliseconds. Interval time, default being non-interval
//       allowImmediate: Boolean. If true, func will be executed immediately
//         if opts.time < Date.now(). Otherwise it will find the next possible
//         time according to opts.interval. Default true.
class Scheduler {
  private currentTick: ReturnType<typeof setTimeout> | undefined
  private _tasks: SchedulerTask[]

  constructor() {
    this._tasks = []
    this._scheduleNextTick()
  }

  _stopTick() {
    if (this.currentTick) {
      clearTimeout(this.currentTick)
    }
  }

  private _scheduleNextTick() {
    this.currentTick = setTimeout(this._nextTick.bind(this), INTERVAL)
  }

  private _tryTasks() {
    const now = Date.now()
    const nextNow = now + INTERVAL
    while (this._tasks.length && nextNow >= this._tasks[0].next) {
      const task = this._tasks.shift()!
      const { func, next: time, opts } = task
      setTimeout(partial(func, time), Math.max(time - now, 0))
      const next = this._nextTaskTime(opts, time, false)
      if (next)
        this._pushTask({
          ...task,
          next,
        })
    }
  }

  private _nextTick() {
    this._tryTasks()
    this._scheduleNextTick()
  }

  private _parseOptions(rawOpts: number | SchedulerOpts): SchedulerOpts {
    const opts = cloneDeep(rawOpts)
    if (typeof opts === 'number') return { time: opts }
    if (typeof opts !== 'object' || !opts) throw new Error('Invalid scheduler time option')
    if (!('time' in opts)) opts.time = Date.now()
    if (!('allowImmediate' in opts)) opts.allowImmediate = true
    return opts
  }

  private _nextTaskTime(
    opts: SchedulerOpts,
    now: number,
    allowImmediate: boolean,
  ): number | undefined {
    if ((opts.time ?? 0) > now) {
      return opts.time
    }
    if (!opts.interval) {
      if (!allowImmediate) return undefined
      return opts.time
    }
    const { time = 0, interval } = opts
    const nextBeforeNow = Math.floor((now - time) / interval) * interval + time
    if (allowImmediate) return nextBeforeNow
    else return nextBeforeNow + interval
  }

  private _pushTask(task: SchedulerTask) {
    this._tasks = sortBy(this._tasks.concat([task]), 'next')
  }

  schedule(func: (time: number) => void, rawOpts: number | SchedulerOpts) {
    const opts = this._parseOptions(rawOpts)
    const next = this._nextTaskTime(opts, Date.now(), opts.allowImmediate ?? true)
    if (!next) return
    const task: SchedulerTask = {
      opts,
      next,
      func,
    }
    this._pushTask(task)
    this._tryTasks()
  }
}

export default new Scheduler()
