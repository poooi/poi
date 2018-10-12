import React, { Component } from 'react'
import i18next from 'views/env-parts/i18next'
import { WindowEnv } from 'views/components/etc/window-env'

import './assets/alert.css'

const { config } = window

const initState = {
  overflow: false,
  history: [0, 1, 2, 3, 4].map((index) => (<div key={index++} className="alert bp3-callout bp3-intent-default alert-log-contents">　</div>)),
  current: {
    type: 'default',
    content: i18next.t('Waiting for response'),
    priority: 0,
    options: {
      dontReserve: true,
    },
  },
  alertHistoryStyle: {
    transform: 'translate3d(0, 1px, 0)',
    pointerEvents: 'none',
  },
}

let stickyEnd = Date.now()
let updateTime = 0

const pushToHistory = (history, toPush) => {
  history.push(<div key={Date.now()} className={`alert bp3-callout bp3-intent-${toPush.type} alert-log-contents`}>{toPush.content}</div>)
  if (history.length > 5) {
    return history.slice(history.length - 5)
  }
  return history
}

class PoiAlertInner extends Component {
  static propTypes = {
  }
  constructor(props) {
    super(props)
    this.showHistory = false
    this.msgWidth = 0
    this.alertHeight = 30
    this.historyHeight = 152
    this.state = initState
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    return nextState !== this.state
  }
  toggleHistory = () => {
    this.showHistory = !this.showHistory
    this.setState({
      alertHistoryStyle: {
        transform: `translate3d(0, ${this.showHistory ? - this.alertHeight - this.historyHeight + 1 : 1}px, 0)`,
        pointerEvents: this.showHistory ? 'auto' : 'none',
      },
    })
  }
  handleStyleChange = () => {
    setTimeout(() => {
      try {
        const alertHeight =  this.props.$('poi-control').offsetHeight
        const historyHeight = this.alertHistory.offsetHeight
        if (historyHeight === this.historyHeight && alertHeight === this.alertHeight) {
          return
        }
        this.alertHeight = alertHeight
        this.historyHeight = historyHeight
      } catch (error) {
        this.alertHeight = 30
        this.historyHeight = 152
      }
      this.props.$('poi-alert').style.height = `${this.alertHeight}px`
    }, 100)
  }
  handleAddAlert = (e) => {
    const value = Object.assign({
      type: 'default',
      content: '',
      priority: 0,
    }, e.detail)
    let { history, current } = this.state
    const nowTS = Date.now()
    if (value.priority < current.priority && nowTS < stickyEnd) {
      if (!value.dontReserve) {
        // Old message has higher priority, push new message to history
        history = pushToHistory(history, value)
        this.setState({ history })
      }
    } else if (!current.dontReserve) {
      // push old message to history
      updateTime = value.stickyFor || 3000
      history = pushToHistory(history, current)
      this.setState({
        history: history,
        current: value,
        overflow: false,
      })
    } else {
      updateTime = value.stickyFor || 3000
      this.setState({
        current: value,
        overflow: false,
      })
    }
  }
  handleOverflow = () => {
    const containerWidth = this.alertMain.offsetWidth
    if (!this.state.overflow) {
      this.msgWidth = this.alertArea.offsetWidth
      this.alertPosition.style.width = `${this.msgWidth}px`
    }
    if ((this.msgWidth > containerWidth) && !this.state.overflow) {
      this.alertPosition.style.width = `${this.msgWidth + 50}px`
      this.setState({overflow: true})
    } else if ((this.msgWidth < containerWidth) && this.state.overflow) {
      this.alertPosition.style.width = `${this.msgWidth}px`
      this.setState({overflow: false})
    }
  }
  componentDidUpdate = (prevProps, prevState) => {
    stickyEnd = Date.now() + updateTime
    updateTime = 0
    this.handleStyleChange()
    this.handleOverflow()
  }
  componentDidMount = () => {
    config.addListener('config.set', (path, value) => {
      if (path === 'poi.appearance.theme') {
        this.handleStyleChange()
      }
    })
    this.observer = new ResizeObserver(this.handleOverflow)
    this.observer.observe(this.alertMain)
    window.addEventListener('alert.new', this.handleAddAlert)
    this.handleStyleChange()
  }
  componentWillUnmount = () => {
    this.observer.unobserve(this.alertMain)
    config.removeListener('config.set', this.handleStyleChange)
    window.removeEventListener('alert.new', this.handleAddAlert)
  }
  render() {
    return (
      <div id="alert-main" className="alert-main bp3-popover" ref={ref => { this.alertMain = ref }}>
        <div
          id="alert-container"
          className={`alert bp3-callout bp3-intent-${this.state.current.type} alert-container`}
          onClick={this.toggleHistory}
        >
          <div className="alert-position" ref={(ref) => { this.alertPosition = ref }}>
            <span id="alert-area" ref={ref => { this.alertArea = ref }} className={this.state.overflow ? 'overflow-anim' : ''}>
              {
                this.state.overflow ?
                  <>
                  <span style={{marginRight: 50}}>
                    {this.state.current.content}
                  </span>
                  <span style={{marginRight: 50}}>
                    {this.state.current.content}
                  </span>
                  </>
                  : this.state.current.content
              }
            </span>
          </div>
        </div>
        <div id="alert-log"
          ref={ref => { this.alertHistory = ref }}
          className="alert-log bp3-popover-content"
          style={this.state.alertHistoryStyle}
          onClick={this.toggleHistory}>
          {this.state.history}
        </div>
      </div>
    )
  }
}

export function PoiAlert(...props) {
  return (
    <WindowEnv.Consumer>
      {({ window }) => (
        <PoiAlertInner {...props} $={(...arg) => window.document.querySelector(...arg)} />
      )}
    </WindowEnv.Consumer>
  )
}
