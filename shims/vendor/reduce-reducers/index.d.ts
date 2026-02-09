declare module 'reduce-reducers' {
  export type Reducer<S = any, A = any, R = any> = (state: S | undefined, action: A, upperState?: R) => S
  const reduceReducers: <S = any>(...reducers: Array<Reducer<S, any, any>>) => Reducer<S, any, any>
  export default reduceReducers
}
