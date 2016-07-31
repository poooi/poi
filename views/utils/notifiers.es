import notifCenter from 'views/env-parts/notif-center'

// Notification that supports equalKey.
// completeTime: unix ms.
// preemptTime: ms.
export class CountdownNotifier {
  constructor() {
    this._lastCompleteTime = null
    // Two notif must be separated by at least one non-notif call to tryNotify
    this._justNotified = false  
  }
  tryNotify = (o) => {
    if (o.completeTime != null && this._lastCompleteTime != null && o.completeTime === this._lastCompleteTime) {
      return
    }
    if (o.completeTime != null) {
      this._lastCompleteTime = o.completeTime
    }
    const preemptTime = o.preemptTime || 0
    if (o.completeTime <= Date.now() + preemptTime) {
      if (!this._justNotified) {
        notifCenter.notify(o)
        this._justNotified = true
      }
    } else {
      this._justNotified = false
    }
  }
}
