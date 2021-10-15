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
  top: 4px;
`

const BottomSentinel = styled.div`
  position: relative;
  bottom: 4px;
`

export class ScrollShadow extends PureComponent {
  state = {
    top: true,
    bottom: true,
  }

  root = React.createRef()
  topSentinel = React.createRef()
  bottomSentinel = React.createRef()

  handleIntersect =
    (type) =>
    ([entry]) => {
      if (this.state[type] !== entry.isIntersecting) {
        this.setState({
          [type]: entry.isIntersecting,
        })
      }
    }

  componentDidMount = (e) => {
    if (
      [this.root.current, this.topSentinel.current, this.bottomSentinel.current].some((ref) => !ref)
    ) {
      return
    }

    const options = {
      root: this.root.current,
    }
    this.topObserver = new IntersectionObserver(this.handleIntersect('top'), options)
    this.bottomObserver = new IntersectionObserver(this.handleIntersect('bottom'), options)

    this.topObserver.observe(this.topSentinel.current)
    this.bottomObserver.observe(this.bottomSentinel.current)
  }

  componentWillUnmount = (e) => {
    if (this.topObserver) {
      this.topObserver.disconnect()
    }
    if (this.bottomObserver) {
      this.bottomObserver.disconnect()
    }
  }

  render() {
    const { children, className } = this.props
    return (
      <Container
        className={className}
        top={!this.state.top}
        bottom={!this.state.bottom}
        onScroll={this.onScroll}
        ref={this.root}
      >
        <TopSentinel ref={this.topSentinel} />
        {children}
        <BottomSentinel ref={this.bottomSentinel} />
      </Container>
    )
  }
}
