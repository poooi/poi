interface FcdValue {
  data?: unknown
  meta?: { name?: string; version?: string }
  path?: string
}

export interface FcdState {
  version: Record<string, string>
  [key: string]: unknown
}

const initState: FcdState = {
  version: {},
}

export function reducer(
  state = initState,
  { type, value }: { type: string; value?: FcdValue },
): FcdState {
  switch (type) {
    case '@@updateFCD':
      if (value?.data && value.meta) {
        const { name, version } = value.meta
        if (name && version) {
          state = {
            ...state,
            version: {
              ...state.version,
              [name]: version,
            },
            [name]: value.data,
          }
        }
      }
      break
    case '@@replaceFCD':
      if (value?.path && value.data) {
        state = {
          ...state,
          [value.path]: value.data,
        }
      }
  }
  return state
}
