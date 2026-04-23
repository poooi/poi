export type WctfState = Record<string, unknown>

export const reducer = (
  state: WctfState = {},
  { type, payload }: { type: string; payload?: WctfState },
): WctfState => {
  switch (type) {
    case '@@wctf-db-update': {
      return {
        ...state,
        ...payload,
      }
    }
  }
  return state
}
