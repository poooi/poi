export interface Listener<T> {
  (event: T): void
}

export interface Disposable {
  dispose(): void
}

export class EventEmitter<T> {
  private listeners: Listener<T>[] = []
  private listenersOncer: Listener<T>[] = []

  on = (listener: Listener<T>): Disposable => {
    this.listeners.push(listener)
    return {
      dispose: () => this.off(listener),
    }
  }

  once = (listener: Listener<T>): void => {
    this.listenersOncer.push(listener)
  }

  off = (listener: Listener<T>) => {
    const callbackIndex = this.listeners.indexOf(listener)
    if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1)
  }

  emit = (event: T) => {
    this.listeners.forEach((listener) => listener(event))

    this.listenersOncer.forEach((listener) => listener(event))
    this.listenersOncer = []
  }

  pipe = (te: EventEmitter<T>): Disposable => {
    return this.on((e) => te.emit(e))
  }
}
