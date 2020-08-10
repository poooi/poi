/**
 * FIXME: remove this polyfill when react-bootstrap is no longer used
 */
/* eslint-disable import/namespace */

import React, { cloneElement, useContext } from 'react'
import ReactDOM from 'react-dom'
import * as ReactBootstrap from 'react-bootstrap'
import contains from 'dom-helpers/query/contains'
import { WindowEnv } from '../components/etc/window-env'
import { includes } from 'lodash'

ReactBootstrap.OrigOverlayTrigger = ReactBootstrap.OverlayTrigger
ReactBootstrap.OriginModal = ReactBootstrap.Modal

const { OriginModal, Overlay } = ReactBootstrap

function isOneOf(one, of) {
  if (Array.isArray(of)) {
    return of.indexOf(one) >= 0
  }
  return one === of
}

function createChainedFunction(...funcs) {
  return funcs
    .filter((f) => f != null)
    .reduce((acc, f) => {
      if (typeof f !== 'function') {
        throw new Error('Invalid Argument Type, must only provide functions, undefined, or null.')
      }

      if (acc === null) {
        return f
      }

      return function chainedFunction(...args) {
        acc.apply(this, args)
        f.apply(this, args)
      }
    }, null)
}

class OverlayTriggerInner extends React.Component {
  constructor(props) {
    super(props)

    this.handleToggle = this.handleToggle.bind(this)
    this.handleDelayedShow = this.handleDelayedShow.bind(this)
    this.handleDelayedHide = this.handleDelayedHide.bind(this)
    this.handleHide = this.handleHide.bind(this)

    this.handleMouseOver = (e) => this.handleMouseOverOut(this.handleDelayedShow, e, 'fromElement')
    this.handleMouseOut = (e) => this.handleMouseOverOut(this.handleDelayedHide, e, 'toElement')

    this._mountNode = null

    this.state = {
      show: props.defaultOverlayShown,
    }
  }

  static defaultProps = {
    defaultOverlayShown: false,
    trigger: ['hover', 'focus'],
  }

  componentWillUnmount() {
    clearTimeout(this._hoverShowDelay)
    clearTimeout(this._hoverHideDelay)
  }

  handleDelayedHide() {
    if (this._hoverShowDelay != null) {
      clearTimeout(this._hoverShowDelay)
      this._hoverShowDelay = null
      return
    }

    if (this._hoverHideDelay != null) {
      return
    }

    const delay = this.props.delayHide != null ? this.props.delayHide : this.props.delay

    if (!delay) {
      this.hide()
      return
    }

    this._hoverHideDelay = setTimeout(() => {
      this._hoverHideDelay = null
      this.hide()
    }, delay)
  }

  handleDelayedShow(target, isMouseEvent) {
    if (this._hoverHideDelay != null) {
      clearTimeout(this._hoverHideDelay)
      this._hoverHideDelay = null
      return
    }

    if (this._hoverShowDelay != null) {
      return
    }

    const delay = this.props.delayShow != null ? this.props.delayShow : this.props.delay

    if (!delay) {
      this.show(isMouseEvent ? target : null)
      return
    }

    this._hoverShowDelay = setTimeout(() => {
      this._hoverShowDelay = null
      this.show(isMouseEvent ? target : null)
    }, delay)
  }

  handleHide() {
    this.hide()
  }

  // Simple implementation of mouseEnter and mouseLeave.
  // React's built version is broken: https://github.com/facebook/react/issues/4251
  // for cases when the trigger is disabled and mouseOut/Over can cause flicker
  // moving from one child element to another.
  handleMouseOverOut(handler, e, relatedNative) {
    const target = e.currentTarget
    const related = e.relatedTarget || e.nativeEvent[relatedNative]

    if ((!related || related !== target) && !contains(target, related)) {
      handler(target, true)
    }
  }

  handleToggle() {
    if (this.state.show) {
      this.hide()
    } else {
      this.show()
    }
  }

  hide() {
    this.setState({ show: false })
    if (this.t) {
      clearInterval(this.t)
      delete this.t
    }
  }

  makeOverlay(overlay, props) {
    return (
      <Overlay
        {...props}
        show={this.state.show}
        onHide={this.handleHide}
        target={this}
        container={this.props.container}
      >
        {overlay}
      </Overlay>
    )
  }

  show(target) {
    this.setState({ show: true })
    if (target && !this.t) {
      this.t = setInterval(() => {
        if (!includes(this.props.container.querySelectorAll(':hover'), target)) {
          clearInterval(this.t)
          delete this.t
          this.handleDelayedHide()
        }
      }, 1000)
    }
  }

  render() {
    const {
      trigger,
      overlay,
      children,
      onBlur,
      onClick,
      onFocus,
      onMouseOut,
      onMouseOver,
      ...props
    } = this.props

    delete props.delay
    delete props.delayShow
    delete props.delayHide
    delete props.defaultOverlayShown

    const child = React.Children.only(children)
    const childProps = child.props
    const triggerProps = {}

    if (this.state.show) {
      triggerProps['aria-describedby'] = overlay.props.id
    }

    // FIXME: The logic here for passing through handlers on this component is
    // inconsistent. We shouldn't be passing any of these props through.

    triggerProps.onClick = createChainedFunction(childProps.onClick, onClick)

    if (isOneOf('click', trigger)) {
      triggerProps.onClick = createChainedFunction(triggerProps.onClick, this.handleToggle)
    }

    if (isOneOf('hover', trigger)) {
      triggerProps.onMouseOver = createChainedFunction(
        childProps.onMouseOver,
        onMouseOver,
        this.handleMouseOver,
      )
      triggerProps.onMouseOut = createChainedFunction(
        childProps.onMouseOut,
        onMouseOut,
        this.handleMouseOut,
      )
    }

    if (isOneOf('focus', trigger)) {
      triggerProps.onFocus = createChainedFunction(
        childProps.onFocus,
        onFocus,
        this.handleDelayedShow,
      )
      triggerProps.onBlur = createChainedFunction(childProps.onBlur, onBlur, this.handleDelayedHide)
    }

    this._overlay = this.makeOverlay(overlay, props)

    return (
      <>
        {cloneElement(child, triggerProps)}
        {this.state.show && ReactDOM.createPortal(this._overlay, this.props.container)}
      </>
    )
  }
}

export const OverlayTrigger = ({ children, ...props }) => (
  <OverlayTriggerInner container={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </OverlayTriggerInner>
)

export const Modal = ({ children, ...props }) => (
  <OriginModal container={useContext(WindowEnv).mountPoint} {...props}>
    {children}
  </OriginModal>
)

Modal.Body = OriginModal.Body
Modal.Header = OriginModal.Header
Modal.Title = OriginModal.Title
Modal.Footer = OriginModal.Footer
Modal.Dialog = OriginModal.Dialog

if (window.isMain) {
  ReactBootstrap.OverlayTrigger = OverlayTrigger
  ReactBootstrap.Modal = Modal
}
