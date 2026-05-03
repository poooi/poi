/**
 * FIXME: remove this polyfill when react-bootstrap is no longer used
 */
/* eslint-disable import-x/namespace */

import { PortalContext } from '@blueprintjs/core'
import { contains } from 'dom-helpers'
import { includes, debounce } from 'lodash'
import React, { cloneElement, useContext, useState, Component } from 'react'
import * as ReactBootstrap from 'react-bootstrap'
import ReactDOM from 'react-dom'

import { isMain } from '../env-parts/const'

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const rb = ReactBootstrap as unknown as Record<string, React.ComponentType<Record<string, unknown>>>

/* eslint-disable no-import-assign */
;(ReactBootstrap as Record<string, unknown>).OrigOverlayTrigger = rb.OverlayTrigger
;(ReactBootstrap as Record<string, unknown>).OriginModal = rb.Modal
;(ReactBootstrap as Record<string, unknown>).OriginDropdown = rb.Dropdown
/* eslint-enable no-import-assign */

type RBComponent = React.ComponentType<Record<string, unknown>>
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const { OriginModal, Overlay, OriginDropdown } = rb as {
  OriginModal: RBComponent & {
    Body: RBComponent
    Header: RBComponent
    Title: RBComponent
    Footer: RBComponent
    Dialog: RBComponent
  }
  Overlay: RBComponent
  OriginDropdown: RBComponent & { Toggle: RBComponent; Menu: RBComponent }
}

function isOneOf(one: unknown, of: unknown | unknown[]): boolean {
  if (Array.isArray(of)) {
    return of.indexOf(one) >= 0
  }
  return one === of
}

function createChainedFunction(
  ...funcs: ((...args: unknown[]) => void | undefined | null)[]
): ((...args: unknown[]) => void) | null {
  return funcs
    .filter((f) => f != null)
    .reduce<((...args: unknown[]) => void) | null>((acc, f) => {
      if (typeof f !== 'function') {
        throw new Error('Invalid Argument Type, must only provide functions, undefined, or null.')
      }

      if (acc === null) {
        return f as (...args: unknown[]) => void
      }

      return function chainedFunction(this: unknown, ...args: unknown[]) {
        acc.apply(this, args)
        f.apply(this, args)
      }
    }, null)
}

interface OverlayTriggerInnerProps {
  trigger?: string | string[]
  overlay: React.ReactElement
  children: React.ReactElement
  container?: Element
  onBlur?: (...args: unknown[]) => void
  onClick?: (...args: unknown[]) => void
  onFocus?: (...args: unknown[]) => void
  onMouseOut?: (...args: unknown[]) => void
  onMouseOver?: (...args: unknown[]) => void
  delay?: number
  delayShow?: number
  delayHide?: number
  defaultOverlayShown?: boolean
  [key: string]: unknown
}

interface OverlayTriggerInnerState {
  show: boolean
}

class OverlayTriggerInner extends Component<OverlayTriggerInnerProps, OverlayTriggerInnerState> {
  static defaultProps = {
    defaultOverlayShown: false,
    trigger: ['hover', 'focus'],
  }

  private _mountNode: null = null
  private _hoverShowDelay: ReturnType<typeof setTimeout> | null = null
  private _hoverHideDelay: ReturnType<typeof setTimeout> | null = null
  private t: ReturnType<typeof setInterval> | undefined
  private _overlay: React.ReactNode = null

  handleMouseOver: (e: React.MouseEvent) => void
  handleMouseOut: (e: React.MouseEvent) => void

  constructor(props: OverlayTriggerInnerProps) {
    super(props)

    this.handleToggle = this.handleToggle.bind(this)
    this.handleDelayedShow = this.handleDelayedShow.bind(this)
    this.handleDelayedHide = this.handleDelayedHide.bind(this)
    this.handleHide = this.handleHide.bind(this)

    this.handleMouseOver = (e) => this.handleMouseOverOut(this.handleDelayedShow, e, 'fromElement')
    this.handleMouseOut = (e) => this.handleMouseOverOut(this.handleDelayedHide, e, 'toElement')

    this._mountNode = null

    this.state = {
      show: props.defaultOverlayShown ?? false,
    }
  }

  componentWillUnmount() {
    if (this._hoverShowDelay) clearTimeout(this._hoverShowDelay)
    if (this._hoverHideDelay) clearTimeout(this._hoverHideDelay)
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

  handleDelayedShow(target?: Element | null, isMouseEvent?: boolean) {
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

  handleMouseOverOut(
    handler: (target?: Element | null, isMouseEvent?: boolean) => void,
    e: React.MouseEvent,
    relatedNative: string,
  ) {
    const target = e.currentTarget as Element
    const related =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (e.relatedTarget as Element) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (e.nativeEvent as unknown as Record<string, Element>)[relatedNative]

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

  makeOverlay(overlay: React.ReactElement, props: Record<string, unknown>) {
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

  show(target?: Element | null) {
    this.setState({ show: true })
    if (target && !this.t) {
      this.t = setInterval(() => {
        if (!includes(this.props.container?.querySelectorAll(':hover'), target)) {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const childProps = child.props as Record<string, unknown>
    const triggerProps: Record<string, unknown> = {}

    if (this.state.show) {
      triggerProps['aria-describedby'] = overlay.props.id
    }

    triggerProps.onClick = createChainedFunction(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      childProps.onClick as (...args: unknown[]) => void,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      onClick as (...args: unknown[]) => void,
    )

    if (isOneOf('click', trigger)) {
      triggerProps.onClick = createChainedFunction(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        triggerProps.onClick as (...args: unknown[]) => void,
        this.handleToggle,
      )
    }

    if (isOneOf('hover', trigger)) {
      triggerProps.onMouseOver = createChainedFunction(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        childProps.onMouseOver as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        onMouseOver as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.handleMouseOver as unknown as (...args: unknown[]) => void,
      )
      triggerProps.onMouseOut = createChainedFunction(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        childProps.onMouseOut as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        onMouseOut as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.handleMouseOut as unknown as (...args: unknown[]) => void,
      )
    }

    if (isOneOf('focus', trigger)) {
      triggerProps.onFocus = createChainedFunction(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        childProps.onFocus as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        onFocus as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.handleDelayedShow as unknown as (...args: unknown[]) => void,
      )
      triggerProps.onBlur = createChainedFunction(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        childProps.onBlur as (...args: unknown[]) => void,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        onBlur as (...args: unknown[]) => void,
        this.handleDelayedHide,
      )
    }

    this._overlay = this.makeOverlay(overlay, props)

    return (
      <>
        {cloneElement(child, triggerProps)}
        {this.state.show && ReactDOM.createPortal(this._overlay, this.props.container!)}
      </>
    )
  }
}

export const OverlayTrigger = ({
  children,
  ...props
}: OverlayTriggerInnerProps & { children: React.ReactElement }) => (
  <OverlayTriggerInner container={useContext(PortalContext).portalContainer} {...props}>
    {children}
  </OverlayTriggerInner>
)

export const Modal = ({ children, ...props }: React.ComponentProps<typeof OriginModal>) => (
  <OriginModal container={useContext(PortalContext).portalContainer} {...props}>
    {children}
  </OriginModal>
)

export const Dropdown = (props: React.ComponentProps<typeof OriginDropdown>) => {
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const onToggle = props.onToggle as ((...args: unknown[]) => void) | undefined
  const extraProps =
    onToggle && props.open !== undefined
      ? {
          onToggle: debounce(onToggle, 100),
        }
      : {
          open,
          onToggle: debounce(() => setOpen(!open), 100),
        }
  return <OriginDropdown {...props} {...extraProps} />
}

Modal.Body = OriginModal.Body
Modal.Header = OriginModal.Header
Modal.Title = OriginModal.Title
Modal.Footer = OriginModal.Footer
Modal.Dialog = OriginModal.Dialog

Dropdown.Toggle = OriginDropdown.Toggle
Dropdown.Menu = OriginDropdown.Menu

if (isMain) {
  /* eslint-disable no-import-assign */
  ;(ReactBootstrap as Record<string, unknown>).OverlayTrigger = OverlayTrigger
  ;(ReactBootstrap as Record<string, unknown>).Modal = Modal
  ;(ReactBootstrap as Record<string, unknown>).Dropdown = Dropdown
  /* eslint-enable no-import-assign */
}
