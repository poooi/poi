import React from 'react'
import PropTypes from 'prop-types'

import* as ReactBootstrap from 'react-bootstrap'

// eslint-disable-next-line import/namespace
ReactBootstrap.OrigOverlayTrigger = ReactBootstrap.OverlayTrigger
// eslint-disable-next-line import/namespace
const { OrigOverlayTrigger } = ReactBootstrap

export const OverlayTrigger = ({ children, ...props }, { overlayMountPoint }) => (
  <OrigOverlayTrigger container={overlayMountPoint} {...props}>
    { children }
  </OrigOverlayTrigger>
)

OverlayTrigger.contextTypes = {
  overlayMountPoint: PropTypes.instanceOf(<div></div>),
}
