import React from 'react'
import { WindowEnv } from '../components/etc/window-env'

import* as ReactBootstrap from 'react-bootstrap'

// eslint-disable-next-line import/namespace
ReactBootstrap.OrigOverlayTrigger = ReactBootstrap.OverlayTrigger
// eslint-disable-next-line import/namespace
const { OrigOverlayTrigger } = ReactBootstrap

export const OverlayTrigger = ({ children, ...props }) => (
  <WindowEnv.Consumer>
    {({ mountPoint }) => (
      <OrigOverlayTrigger container={mountPoint} {...props}>
        { children }
      </OrigOverlayTrigger>
    )}
  </WindowEnv.Consumer>
)
