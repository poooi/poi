export interface UiState {
  activeMainTab: string
  activeFleetId: number
}

const initState: UiState = {
  activeMainTab: 'main-view',
  activeFleetId: 0,
}

export function reducer(
  state = initState,
  { type, tabInfo }: { type: string; tabInfo?: Partial<UiState> },
): UiState {
  switch (type) {
    case '@@TabSwitch': {
      return {
        ...state,
        ...tabInfo,
      }
    }
    default:
      return state
  }
}
