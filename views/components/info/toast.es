import React from 'react'
import { Position, Toaster, Intent } from '@blueprintjs/core'
import styled, { css } from 'styled-components'
import { connect } from 'react-redux'
import { get } from 'lodash'

const intentTypes = new Set(Object.values(Intent))
const map = {
  error: Intent.DANGER,
}
const list = []
const toastPreload = (...props) => {
  if (props.length) {
    list.push(props)
  }
}

window.toast = toastPreload

const ToasterPositioned = styled(Toaster)`
  ${({ inbound }) =>
    inbound &&
    css`
      position: absolute !important;
    `}
`

@connect(state => ({
  webviewWidth: get(state, 'layout.webview.width'),
  isolateGameWindow: get(state, 'config.poi.layout.isolate', false),
}))
export class PoiToast extends React.PureComponent {
  toaster = Toaster

  triggleToast = (message, options = {}) => {
    if (!message) {
      return
    }
    message = options.title ? (
      <>
        <strong>{options.title}</strong>
        <br />
        {message}
      </>
    ) : (
      message
    )
    const intent = intentTypes.has(options.type)
      ? options.type
      : map[options.type] || Intent.PRIMARY
    const props = {
      message,
      intent,
      ...options,
    }
    this.toaster.show(props)
  }

  componentDidMount = () => {
    while (list.length) {
      this.triggleToast(...list.shift())
    }
    window.toast = this.triggleToast
  }

  componentWillUnmount = () => {
    window.toast = toastPreload
  }

  render() {
    return (
      <ToasterPositioned
        position={Position.BOTTOM_RIGHT}
        ref={ref => (this.toaster = ref)}
        inbound={this.props.isolateGameWindow || this.props.webviewWidth >= 400}
        usePortal={false}
      />
    )
  }
}
