declare module 'electron-react-titlebar/renderer' {
  import type React from 'react'

  export interface TitleBarProps {
    icon?: string
    menu?: unknown[]
    disableMinimize?: boolean
    disableMaximize?: boolean
    className?: string
    browserWindowId?: number
  }

  export const TitleBar: React.FC<TitleBarProps>
}
