import React, { useContext, ReactNode } from 'react'
import * as BluePrint from '@blueprintjs/core'
import type {
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
  <BluePrint.Alert portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BluePrint.Alert>
)

interface DialogProps extends BDialogProps {
  children: ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ children, ...props }) => (
  <BluePrint.Dialog portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BluePrint.Dialog>
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
  <BluePrint.Overlay portalContainer={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </BluePrint.Overlay>
)
