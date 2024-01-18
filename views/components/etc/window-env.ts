import { createContext } from 'react'

interface WindowEnvContext {
  window?: Window
  mountPoint?: HTMLElement
}

export const WindowEnv = createContext<WindowEnvContext>({
  window: undefined,
  mountPoint: undefined,
})
