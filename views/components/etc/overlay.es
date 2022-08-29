import React, { useContext } from 'react'
import { Alert as BAlert, Dialog as BDialog, Overlay as BOverlay } from '@blueprintjs/core'
import { Popover2, Tooltip2 } from '@blueprintjs/popover2'

import '@blueprintjs/popover2/lib/css/blueprint-popover2.css'

import { WindowEnv } from './window-env'

export const Alert = ({ children, ...props }) => (
  <BAlert portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BAlert>
)

export const Dialog = ({ children, ...props }) => (
  <BDialog portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BDialog>
)

export const Tooltip = ({ children, ...props }) => (
  <Tooltip2 portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </Tooltip2>
)

export const Popover = ({ children, ...props }) => (
  <Popover2 portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </Popover2>
)

export const Overlay = ({ children, ...props }) => (
  <BOverlay portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BOverlay>
)
