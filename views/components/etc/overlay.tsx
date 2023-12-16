import React, { useContext, ReactNode } from 'react'
import {
  Alert as BAlert,
  Dialog as BDialog,
  Overlay as BOverlay,
  AlertProps as BAlertProps,
  DialogProps as BDialogProps,
  OverlayProps as BOverlayProps,
} from '@blueprintjs/core'
import { Popover2, Tooltip2, Popover2Props, Tooltip2Props } from '@blueprintjs/popover2'
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css'
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

interface TooltipProps extends Tooltip2Props {
  children: ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({ children, ...props }) => (
  <Tooltip2 portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </Tooltip2>
)

interface PopoverProps extends Popover2Props {
  children: ReactNode
}

export const Popover: React.FC<PopoverProps> = ({ children, ...props }) => (
  <Popover2 portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </Popover2>
)

interface OverlayProps extends BOverlayProps {
  children: ReactNode
}

export const Overlay: React.FC<OverlayProps> = ({ children, ...props }) => (
  <BOverlay portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BOverlay>
)
