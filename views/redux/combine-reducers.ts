import type { RootState } from './reducer-factory'

export type AnyAction = { type: string; [key: string]: unknown }
export type PoiReducer<S = unknown, A extends AnyAction = AnyAction> = (
  state: S | undefined,
  action: A,
  store?: Record<string, unknown>,
) => S

const ActionTypes = {
  INIT: '@@redux/INIT' + Math.random().toString(36).substring(7).split('').join('.'),
  REPLACE: '@@redux/REPLACE' + Math.random().toString(36).substring(7).split('').join('.'),
}

function getUndefinedStateErrorMessage(key: string, action: AnyAction): string {
  const actionType = action && action.type
  const actionDescription = (actionType && `action "${String(actionType)}"`) || 'an action'

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    'To ignore an action, you must explicitly return the previous state. ' +
    'If you want this reducer to hold no value, you can return null instead of undefined.'
  )
}

function assertReducerShape(reducers: Record<string, PoiReducer>): void {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })

    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          'If the state passed to the reducer is undefined, you must ' +
          'explicitly return the initial state. The initial state may ' +
          "not be undefined. If you don't want to set a value for this reducer, " +
          'you can use null instead of undefined.',
      )
    }

    const type =
      '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.')
    if (typeof reducer(undefined, { type }) === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
          'namespace. They are considered private. Instead, you must return the ' +
          'current state for any unknown actions, unless it is undefined, ' +
          'in which case you must return the initial state, regardless of the ' +
          'action type. The initial state may not be undefined, but can be null.',
      )
    }
  })
}

export function combineReducers<S>(reducers: {
  [K in keyof S]: PoiReducer<S[K]>
}): PoiReducer<S> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const reducerKeys = Object.keys(reducers) as Array<keyof S & string>
  const finalReducers: Partial<{ [K in keyof S]: PoiReducer<S[K]> }> = {}
  for (const key of reducerKeys) {
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const finalReducerKeys = Object.keys(finalReducers) as Array<keyof S & string>

  let shapeAssertionError: Error | undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    assertReducerShape(finalReducers as Record<string, PoiReducer>)
  } catch (e) {
    shapeAssertionError = e instanceof Error ? e : new Error(String(e))
  }

  return function combination(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    state: S | undefined = {} as S,
    action: AnyAction,
    upperState?: Record<string, unknown>,
  ): S {
    // Polyfill for redux@4
    if (window.getStore) {
      window.getStore.lock = true
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      window.getStore.cache = state as RootState
    }

    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    let hasChanged = false
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const nextState = {} as S
    for (const key of finalReducerKeys) {
      const reducer = finalReducers[key]!
      const previousStateForKey = state[key]
      // S extends Record<string, unknown>, so state is safe to pass as the store arg
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const stateAsRecord = state as Record<string, unknown>
      const nextStateForKey = reducer(previousStateForKey, action, upperState ?? stateAsRecord)
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // reducer[K] returns S[K] by construction
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      nextState[key] = nextStateForKey as S[typeof key]
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }

    // Polyfill for redux@4
    if (window.getStore) {
      // delete optional property to remove the lock flag
      delete window.getStore.lock
    }

    return hasChanged ? nextState : state
  }
}
