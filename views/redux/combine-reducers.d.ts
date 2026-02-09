export type Reducer = (state?: any, action?: any, upperState?: any) => any

export function combineReducers(reducers: Record<string, Reducer>, store?: unknown): Reducer
