// actionNameBase:
//   action on request: {
//     type: `${actionNameBase}`,
//     args,
//   }
//   action on success: {
//     type: `${actionNameBase}@then`,
//     result: <result>,
//     args,
//   }
//   action on failure: {
//     type: `${actionNameBase}@reject`,
//     error: <error>
//     args,
//   }
// promiseGenerator:
//   () => aPromise
export class PromiseAction {
  constructor(actionNameBase, promiseGenerator, args) {
    this.name = actionNameBase 
    this.generator = promiseGenerator
    this.args = args
  }
}

export const middleware = store => next => action => {
  if (action instanceof PromiseAction) {
    const {name, generator, args} = action
    next({type: name, args})
    return next(generator().then(
      (result) => next({type: `${name}@then`, result, args}),
      (error) => next({type: `${name}@reject`, error, args}),
    ))
  } else {
    return next(action)
  }
}
