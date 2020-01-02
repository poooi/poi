/**
 * section is a group of settings on certain subject
 */
import React, { ReactNode, FunctionComponent } from 'react'
import PropTypes from 'prop-types'
import { Card, H5 } from '@blueprintjs/core'
import styled from 'styled-components'

interface SectionProps {
  title: ReactNode
  children: ReactNode
}

export const Section: FunctionComponent<SectionProps> = ({ title, children, ...props }) => (
  <Card {...props}>
    {title && <H5>{title}</H5>}
    {children}
  </Card>
)

Section.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
}

export const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  align-items: center;

  .bp3-switch {
    margin-right: 2em;
  }

  .bp3-form-content {
    flex: 1;
  }

  .bp3-numeric-input {
    display: inline-flex;
  }

  .bp3-numeric-input .bp3-input-group {
    width: 5em;
  }

  .bp3-callout {
    font-size: 12px;
  }
`

export const FillAvailable = styled(Wrapper)`
  > .bp3-form-group {
    width: 100%;
  }
`

export const HalfWrapper = styled(Wrapper)`
  width: 50%;
`
