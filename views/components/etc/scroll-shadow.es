import React, { PureComponent } from 'react'
import { observer, observe } from 'redux-observers'
import { get } from 'lodash'
import { store } from 'views/create-store'
import styled, { css } from 'styled-components'
import { ResizeSensor } from '@blueprintjs/core'

const Container = styled.div`
  transition: 0.35s;
  ${({ top, bottom }) => (top && bottom) ? css`
    box-shadow:
      inset 0 18px 15px -20px #217dbb,
      inset 0 -18px 15px -20px #217dbb;
  ` : top ? css `
    box-shadow: inset 0 18px 15px -20px #217dbb;
  ` : bottom ? css `
    box-shadow: inset 0 -18px 15px -20px #217dbb;
  ` : css``}
`

export class ScrollShadow extends PureComponent {
  state = {
    top: true,
    bottom: true,
  }

  onScroll = e => {
    const { scrollTop, clientHeight, scrollHeight  } = this.r
    const scrollBottom = scrollHeight - clientHeight - scrollTop
    let { state } = this
    const top = scrollTop < 5
    const bottom = scrollBottom < 5
    if (top !== state.top) {
      state = {
        ...state,
        top,
      }
    }
    if (bottom !== state.bottom) {
      state = {
        ...state,
        bottom,
      }
    }
    this.setState(state)
  }

  componentDidMount = e => {
    this.onScroll()
    const sizeObservers = this.props.observerPath.map(p => new observer(
      state => get(state, p),
      this.onScroll,
    ))
    this.unobserve = observe(store, sizeObservers)
  }

  componentWillUnmount = e => {
    this.unobserve()
  }

  render () {
    const { children, className } = this.props
    return (
      <ResizeSensor onResize={this.onScroll}>
        <Container ref={r => this.r = r} className={className} top={!this.state.top} bottom={!this.state.bottom} onScroll={this.onScroll}>
          { children }
        </Container>
      </ResizeSensor>
    )
  }
}
