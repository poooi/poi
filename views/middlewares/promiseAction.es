// actionNameBase:
//   action on request: {
//     type: `${actionNameBase}`,
//   }
//   action on success: {
//     type: `${actionNameBase}@then`,
//     result: <result>,
//   }
//   action on failure: {
//     type: `${actionNameBase}@reject`,
//     error: <error>
//   }
// promiseGenerator:
//   () => aPromise
export class PromiseAction {
  constructor(actionNameBase, promiseGenerator) {
    this.name = actionNameBase 
    this.generator = promiseGenerator
  }
}

export const middleware = store => next => action => {
  if (action instanceof PromiseAction) {
    const tryDispatch = (data) => {
      try {
        store.dispatch(data)
      } catch (e) { console.error(e.stack) }
    }
    const {name, generator} = action
    tryDispatch({type: name})
    next(generator().then(
      (result) => tryDispatch({type: `${name}@then`, result}),
      (error) => tryDispatch({type: `${name}@reject`, error}),
    ))
  } else {
    next(action)
  }
}
