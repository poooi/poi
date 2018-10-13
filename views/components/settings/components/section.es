/**
 * section is a group of settings on certain subject
 */

import React from 'react'
import PropTypes from 'prop-types'
import { Card, H5 } from '@blueprintjs/core'

export const Section = ({title, children, ...props}) => (
  <Card {...props}>
    {title && <H5>{title}</H5>}
    {children}
  </Card>
)

Section.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
}
