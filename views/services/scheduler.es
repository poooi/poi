import { sortBy, cloneDeep, partial } from 'lodash'

const INTERVAL = 1000

// Scheduler: Schedule one-time or interval tasks, without worrying the problem
//   that setTimeout pauses when the computer falls aleep.
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
//       interval: milliseconds. Interval time, default being non-inverval
//       allowImmediate: Boolean. If true, func will be executed immediately
//         if opts.time < Date.now(). Otherwise it will find the next possible
//         time according to opts.interval. Default true.
class Scheduler {
  constructor() {
    this._scheduleNextTick()
    this._tasks = []
  }

  _scheduleNextTick() {
    setTimeout(this._nextTick.bind(this), INTERVAL)
  }

  _tryTasks() {
    const now = Date.now()
    const nextNow = now + INTERVAL
    while (this._tasks.length && nextNow >= this._tasks[0].next) {
      const task = this._tasks.shift()
      const {func, next: time, opts} = task
      setTimeout(partial(func, time), Math.max(time - now, 0))
      const next = this._nextTaskTime(opts, time, false)
      if (next)
        this._pushTask({
          ...task,
          next,
        })
    }
  }

  _nextTick() {
    this._tryTasks()
    this._scheduleNextTick()
  }

  _parseOptions(rawOpts) {
    const opts = cloneDeep(rawOpts)
    if (typeof opts === 'number')
      return {time: opts}
    if (typeof opts !== 'object' || !opts)
      throw new Error('Invalid scheduler time option')
    if (!('time' in opts))
      opts.time = Date.now()
    if (!('allowImmediate' in opts))
      opts.allowImmediate = true
    return opts
  }

  _nextTaskTime(opts, now, allowImmediate) {
    if (opts.time > now) {
      return opts.time
    }
    if (!opts.interval) {
      if (!allowImmediate)
        return
      return opts.time
    }
    const {time, interval} = opts
    const nextBeforeNow = Math.floor((now-time)/interval) * interval + time
    if (allowImmediate)
      return nextBeforeNow
    else
      return nextBeforeNow + interval
  }

  _pushTask(task) {
    this._tasks = sortBy(this._tasks.concat([task]), 'next')
  }

  schedule(func, rawOpts) {
    const opts = this._parseOptions(rawOpts)
    const next = this._nextTaskTime(opts, Date.now(), opts.allowImmediate)
    if (!next)
      return
    const task = {
      opts,
      next,
      func,
    }
    this._pushTask(task)
    this._tryTasks()
  }
}

export default new Scheduler()
