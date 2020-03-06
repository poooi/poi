import React, { PureComponent } from 'react'
import i18next from 'views/env-parts/i18next'
import { takeRight } from 'lodash'
import styled, { keyframes, css } from 'styled-components'
import { CustomTag } from 'views/components/etc/custom-tag'

const PoiAlertTag = styled(CustomTag)`
  width: 0;
  flex: 1;
  height: 30px;
`

const Alert = styled.div`
  margin-bottom: 0;
  min-height: 100%;
  opacity: 0.7;
  padding: 6px 3px 5px 3px;
  border-radius: 0;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
`

const AlertLogContent = styled(Alert)`
  overflow: scroll;
  text-overflow: initial;
`

const AlertMain = styled.div`
  height: 29px;
  pointer-events: none;
  position: relative;
  transition: 0.3s;
  width: 100%;
  border-radius: 0;
`

const AlertContainer = styled(Alert)`
  cursor: pointer;
  height: 30px;
  overflow: hidden;
  pointer-events: auto;
  position: relative;
  transition: 0.3s;
  z-index: 2;
`

const AlertLog = styled.div`
  overflow: hidden;
  transition: 0.3s;
  z-index: 1;
  ${({ toggle, height, containerHeight }) =>
    toggle
      ? css`
          transform: translate3d(0, ${1 - containerHeight - height}px, 0);
          pointer-events: auto;
        `
      : css`
          transform: translate3d(0, 1px, 0);
          pointer-events: none;
        `}
`

const AlertPosition = styled.div`
  margin-left: auto;
  margin-right: auto;
`

const OverflowScroll = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(-100%, 0, 0);
  }
`

const AlertArea = styled.div`
  cursor: pointer;
  display: flex;
  ${({ overflow }) =>
    overflow &&
    css`
      animation-delay: 2s;
      animation-duration: 18s;
      animation-iteration-count: 2;
      animation-name: ${OverflowScroll};
      animation-timing-function: linear;
      margin-left: 0;
    `}
`

const MsgMainCnt = styled.div`
  width: fit-content;
`

const initState = {
  overflow: false,
  history: [],
  current: {
    type: 'default',
    content: i18next.t('Waiting for response'),
    priority: 0,
    options: {
      dontReserve: true,
    },
  },
  showHistory: false,
  containerWidth: 1,
  containerHeight: 0,
  historyHeight: 0,
  msgWidth: 0,
}

export class PoiAlert extends PureComponent {
  static propTypes = {}
  state = initState

  stickyEnd = Date.now()
  updateTime = 0

  alertMain = React.createRef()
  alertHistory = React.createRef()
  msgCnt = React.createRef()

  toggleHistory = () => {
    this.setState({ showHistory: !this.state.showHistory })
  }

  handleAddAlert = e => {
    const nowTS = Date.now()
    const value = {
      ...{
        type: 'default',
        content: '',
        priority: 0,
        ts: nowTS,
      },
      ...e.detail,
    }
    let { history, current } = this.state
    if (value.priority < current.priority && nowTS < this.stickyEnd) {
      if (!value.dontReserve) {
        // Old message has higher priority, push new message to history
        history = [...takeRight(history, 5), value]
        this.setState({ history })
      }
    } else if (!current.dontReserve) {
      // push old message to history
      this.updateTime = value.stickyFor || 3000
      history = [...takeRight(history, 5), current]
      this.setState({
        history: history,
        current: value,
      })
    } else {
      this.updateTime = value.stickyFor || 3000
      this.setState({
        current: value,
      })
    }
  }

  handleRefResize = entries => {
    const newState = {}
    entries.forEach(entry => {
      if (entry.contentRect) {
        if (entry.target === this.alertMain.current) {
          const { width: containerWidth, height: containerHeight } = entry.contentRect
          newState.containerWidth = containerWidth
          newState.containerHeight = containerHeight
        } else if (entry.target === this.msgCnt.current) {
          newState.msgWidth = entry.contentRect.width
        } else {
          newState.historyHeight = entry.contentRect.height
        }
      }
    })
    this.setStateDefer(newState, newState.msgWidth ? 0 : 50)
  }

  setStateDefer = (newState, defer) => {
    if (!this.deferredState) {
      this.deferredState = newState
    } else {
      clearTimeout(this.timeoutId)
      this.deferredState = {
        ...this.deferredState,
        ...newState,
      }
    }
    if (defer) {
      this.timeoutId = setTimeout(() => {
        const { deferredState } = this
        delete this.deferredState
        delete this.timeoutId
        this.setState(deferredState)
      }, defer)
    } else {
      const { deferredState } = this
      delete this.deferredState
      delete this.timeoutId
      this.setState(deferredState)
    }
  }

  componentDidUpdate = (prevProps, prevState) => {
    this.stickyEnd = Date.now() + this.updateTime
    this.updateTime = 0
    while (this.alertHistory.current.childNodes.length > 6) {
      this.alertHistory.current.childNode[0].remove()
    }
  }

  componentDidMount = () => {
    this.observer = new ResizeObserver(this.handleRefResize)
    this.observer.observe(this.alertMain.current)
    this.observer.observe(this.alertHistory.current)
    this.observer.observe(this.msgCnt.current)
    window.addEventListener('alert.new', this.handleAddAlert)
  }

  componentWillUnmount = () => {
    this.observer.unobserve(this.alertMain.current)
    this.observer.unobserve(this.alertHistory.current)
    this.observer.unobserve(this.msgCnt.current)
    window.removeEventListener('alert.new', this.handleAddAlert)
  }

  render() {
    const overflow = this.state.msgWidth > this.state.containerWidth
    return (
      <PoiAlertTag tag="poi-alert">
        <AlertMain id="alert-main" className="alert-main bp3-popover" ref={this.alertMain}>
          <AlertContainer
            id="alert-container"
            className={`bp3-callout bp3-intent-${this.state.current.type} alert-container`}
            onClick={this.toggleHistory}
          >
            <AlertPosition
              className="alert-position"
              style={{ width: this.state.msgWidth + (overflow ? 50 : 0) }}
            >
              <AlertArea id="alert-area" overflow={overflow}>
                <MsgMainCnt ref={this.msgCnt}>
                  <span>{this.state.current.content}</span>
                </MsgMainCnt>
                {overflow && (
                  <span style={{ marginRight: 50, marginLeft: 50 }}>
                    {this.state.current.content}
                  </span>
                )}
              </AlertArea>
            </AlertPosition>
          </AlertContainer>
          <AlertLog
            id="alert-log"
            ref={this.alertHistory}
            className="alert-log bp3-popover-content"
            toggle={this.state.showHistory}
            height={this.state.historyHeight}
            containerHeight={this.state.containerHeight}
            onClick={this.toggleHistory}
          >
            {this.state.history.map(h => (
              <AlertLogContent
                key={h.ts}
                className={`bp3-callout bp3-intent-${h.type}`}
                data-ts={h.ts}
              >
                {h.content}
              </AlertLogContent>
            ))}
          </AlertLog>
        </AlertMain>
      </PoiAlertTag>
    )
  }
}
