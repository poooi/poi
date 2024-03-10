import React, { useContext, Children, ReactNode } from 'react'
import {
  Alert as BAlert,
  Dialog as BDialog,
  Overlay as BOverlay,
  Popover as BPopover,
  Tooltip as BTooltip,
  type AlertProps,
  type DialogProps,
  type OverlayProps,
  type PopoverProps,
  type TooltipProps,
} from '@blueprintjs/core'
import { WindowEnv } from './window-env'

const getSecondChildren = (children: ReactNode) =>
  Children.count(children) > 1
    ? (Children.toArray(children)[1] as PopoverProps['content'])
    : undefined

export const Alert: React.FC<AlertProps> = ({ children, ...props }) => (
  <BAlert portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BAlert>
)

export const Dialog: React.FC<DialogProps> = ({ children, ...props }) => (
  <BDialog portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BDialog>
)

export const Tooltip: React.FC<TooltipProps> = ({ children, content, ...props }) => (
  <BTooltip
    portalContainer={useContext(WindowEnv).mountPoint}
    {...props}
    content={content || getSecondChildren(children)}
  >
    {children}
  </BTooltip>
)

export const Popover: React.FC<PopoverProps> = ({ children, content, ...props }) => (
  <BPopover
    portalContainer={useContext(WindowEnv).mountPoint}
    {...props}
    content={content || getSecondChildren(children)}
  >
    {children}
  </BPopover>
)

export const Overlay: React.FC<OverlayProps> = ({ children, ...props }) => (
  <BOverlay portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BOverlay>
)
