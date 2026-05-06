import type { Store } from 'redux'

declare module 'redux-observers' {
  type Selector<S, T> = (state: S) => T
  type Handler<T> = (dispatch: Store['dispatch'], current: T, previous?: T) => void
  type Observer = unknown

  export function observer<S, T>(selector: Selector<S, T>, handler: Handler<T>): Observer

  export function observe(store: Store, observers: Observer[]): void
}
