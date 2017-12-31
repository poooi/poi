export const reducer = (state = {}, { type, payload }) => {
  switch (type) {
  case '@@wctf-db-update': {
    return ({
      ...state,
      ...payload,
    })
  }
  }
  return state
}
