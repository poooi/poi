import React, { useContext, ReactNode } from 'react'
import {
  Alert as BAlert,
  Dialog as BDialog,
  Overlay as BOverlay,
  AlertProps as BAlertProps,
  DialogProps as BDialogProps,
  OverlayProps as BOverlayProps,
  Popover as BPopover,
  Tooltip as BTooltip,
  PopoverProps as BPopoverProps,
  TooltipProps as BTooltipProps,
} from '@blueprintjs/core'
import { WindowEnv } from './window-env'

interface AlertProps extends BAlertProps {
  children: ReactNode
}

export const Alert: React.FC<AlertProps> = ({ children, ...props }) => (
  <BAlert portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BAlert>
)

interface DialogProps extends BDialogProps {
  children: ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ children, ...props }) => (
  <BDialog portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BDialog>
)

interface TooltipProps extends BTooltipProps {
  children: ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({ children, ...props }) => (
  <BTooltip portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BTooltip>
)

interface PopoverProps extends BPopoverProps {
  children: ReactNode
}

export const Popover: React.FC<PopoverProps> = ({ children, ...props }) => (
  <BPopover portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BPopover>
)

interface OverlayProps extends BOverlayProps {
  children: ReactNode
}

export const Overlay: React.FC<OverlayProps> = ({ children, ...props }) => (
  <BOverlay portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BOverlay>
)
