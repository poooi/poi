import { mapValues, omit } from 'lodash'

type IpcScope = Record<string, boolean>
export type IpcState = Record<string, IpcScope>

interface IpcActionValue {
  scope?: string
  opts?: Record<string, unknown>
  keys?: string[]
}

const INIT_STATE: IpcState = {}

export const reducer = (
  state = INIT_STATE,
  {
    type,
    value: { scope, opts, keys } = {},
    content,
  }: { type: string; value?: IpcActionValue; content?: IpcState },
): IpcState => {
  switch (type) {
    case '@@initIPC': {
      return {
        ...state,
        ...content,
      }
    }
    case '@@registerIPC': {
      return {
        ...state,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [scope!]: mapValues(opts, () => true),
      }
    }
    case '@@unregisterIPC': {
      return {
        ...state,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [scope!]: omit(state[scope!], keys) as IpcScope,
      }
    }
    case '@@unregisterAllIPC': {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return omit(state, scope!) as IpcState
    }
  }
  return state
}
