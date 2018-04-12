import React from 'react'
import { WindowEnv } from '../components/etc/window-env'

import * as ReactBootstrap from 'react-bootstrap'

// eslint-disable-next-line import/namespace
ReactBootstrap.OrigOverlayTrigger = ReactBootstrap.OverlayTrigger
// eslint-disable-next-line import/namespace
ReactBootstrap.OriginModal = ReactBootstrap.Modal
// eslint-disable-next-line import/namespace
const { OrigOverlayTrigger, OriginModal } = ReactBootstrap

export const OverlayTrigger = ({ children, ...props }) => (
  <WindowEnv.Consumer>
    {({ mountPoint }) => (
      <OrigOverlayTrigger container={mountPoint} {...props}>
        { children }
      </OrigOverlayTrigger>
    )}
  </WindowEnv.Consumer>
)

export const Modal = ({ children, ...props }) => (
  <WindowEnv.Consumer>
    {({ mountPoint }) => (
      <OriginModal container={mountPoint} {...props}>
        { children }
      </OriginModal>
    )}
  </WindowEnv.Consumer>
)

Modal.Body = OriginModal.Body
Modal.Header = OriginModal.Header
Modal.Title = OriginModal.Title
Modal.Footer = OriginModal.Footer
Modal.Dialog = OriginModal.Dialog
