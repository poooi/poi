import React, { useContext } from 'react'
import {
  Alert as BAlert,
  Dialog as BDialog,
  Tooltip as BTooltip,
  Popover as BPopover,
  Overlay as BOverlay,
} from '@blueprintjs/core'

import { WindowEnv } from './window-env'

export const Alert = ({ children, ...props }) => (
  <BAlert portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    { children }
  </BAlert>
)

export const Dialog = ({ children, ...props }) => (
  <BDialog portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    { children }
  </BDialog>
)

export const Tooltip = ({ children, ...props }) => (
  <BTooltip portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    { children }
  </BTooltip>
)

export const Popover = ({ children, ...props }) => (
  <BPopover portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    { children }
  </BPopover>
)

export const Overlay = ({ children, ...props }) => (
  <BOverlay portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    { children }
  </BOverlay>
)
