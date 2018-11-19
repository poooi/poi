import React, { PureComponent } from 'react'
import { compact } from 'lodash'
import styled from 'styled-components'

const Container = styled.div`
  transition: 0.3s 0.1s;
  position: relative;
  box-shadow: ${({ top, bottom }) =>
    compact([
      top && 'inset 0 18px 15px -20px #217dbb',
      bottom && 'inset 0 -18px 15px -20px #217dbb;',
    ]).join(',')};
`

const TopSentinel = styled.div`
  position: relative;
  top: 0;
`

const BottomSentinel = styled.div`
  position: relative;
  bottom: 0;
`

export class ScrollShadow extends PureComponent {
  state = {
    top: true,
    bottom: true,
  }

  topSentinel = React.createRef()
  bottomSentinel = React.createRef()

  handleIntersect = type => ([entry]) => {
    if (this.state[type] !== entry.isIntersecting) {
      this.setState({
        [type]: entry.isIntersecting,
      })
    }
  }

  componentDidMount = e => {
    this.topObserver = new IntersectionObserver(this.handleIntersect('top'))
    this.bottomObserver = new IntersectionObserver(this.handleIntersect('bottom'))

    this.topObserver.observe(this.topSentinel.current)
    this.bottomObserver.observe(this.bottomSentinel.current)
  }

  componentWillUnmount = e => {
    this.topObserver.disconnect()
    this.bottomObserver.disconnect()
  }

  render() {
    const { children, className } = this.props
    return (
      <Container
        className={className}
        top={!this.state.top}
        bottom={!this.state.bottom}
        onScroll={this.onScroll}
      >
        <TopSentinel ref={this.topSentinel} />
        {children}
        <BottomSentinel ref={this.bottomSentinel} />
      </Container>
    )
  }
}
