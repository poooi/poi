import notifCenter from 'views/env-parts/notif-center'

interface NotifyOptions {
  completeTime?: number | null
  preemptTime?: number
  [key: string]: unknown
}

export class CountdownNotifier {
  private _lastCompleteTime: number | null = null
  private _justNotified = false

  tryNotify = (o: NotifyOptions): void => {
    if (
      o.completeTime != null &&
      this._lastCompleteTime != null &&
      o.completeTime === this._lastCompleteTime
    ) {
      return
    }
    // 1 second more to preemptTime bc notifications are throttled by 1 sec
    const preemptTime = Math.max((o.preemptTime || 0) + 1, 0)
    if ((o.completeTime ?? 0) <= Date.now() + preemptTime * 1000) {
      this._lastCompleteTime = o.completeTime ?? null
      if (!this._justNotified) {
        notifCenter.notify(o)
        this._justNotified = true
      }
    } else {
      this._justNotified = false
    }
  }
}
