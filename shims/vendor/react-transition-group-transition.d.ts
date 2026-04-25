declare module 'react-transition-group/Transition' {
  import type React from 'react'
  type TransitionStatus = 'entering' | 'entered' | 'exiting' | 'exited'
  interface TransitionProps {
    in?: boolean
    timeout?: number | { enter?: number; exit?: number }
    children: (state: TransitionStatus) => React.ReactNode
    mountOnEnter?: boolean
    unmountOnExit?: boolean
    appear?: boolean
    enter?: boolean
    exit?: boolean
    onEnter?: () => void
    onEntering?: () => void
    onEntered?: () => void
    onExit?: () => void
    onExiting?: () => void
    onExited?: () => void
  }
  const Transition: React.ComponentType<TransitionProps>
  export default Transition
}
