import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { observer, observe } from 'redux-observers'
import { get } from 'lodash'
import { store } from 'views/create-store'

import './assets/scroll-shadow.css'

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
    const scrollClassName = classnames(className, 'scroll-shadow', {
      'scroll-shadow-top': !this.state.top,
      'scroll-shadow-bottom': !this.state.bottom,
    })
    return (
      <div ref={r => this.r = r} className={scrollClassName} onScroll={this.onScroll}>
        { children }
      </div>
    )
  }
}
