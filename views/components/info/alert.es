import React from 'react'
import { remote } from 'electron'
import { debounce } from 'lodash'

const {$, config} = window
const {Component} = React
const __ = window.i18n.others.__.bind(window.i18n.others)

const alertStyle = document.createElement('style')
const historyStyle = document.createElement('style')
alertStyle.innerHTML = `
  poi-alert {
    height: 30px;
  }
  #alert-main {
    height: 29px;
  }
`
historyStyle.innerHTML = `
  .alert-history {
    transform: translateY(1px);
    pointer-events: 'none';
  }
`

remote.getCurrentWindow().webContents.on('dom-ready', function(e) {
  document.body.appendChild(alertStyle)
  document.body.appendChild(historyStyle)
})

const initState = {
  overflow: false,
  history: [0, 1, 2, 3, 4].map((index) => (<div key={index++} className='alert alert-default alert-history-contents'>　</div>)),
  current: {
    type: 'default',
    content: __('Waiting for response...'),
    priority: 0,
    options: {
      dontReserve: true,
    },
  },
}

let stickyEnd = Date.now()
let updateTime = 0

const pushToHistory = (history, toPush) => {
  history.push(<div key={Date.now()} className={`alert alert-${toPush.type} alert-history-contents`}>{toPush.content}</div>)
  if (history.length > 5) {
    history.shift()
  }
  return history
}

export const PoiAlert = class poiAlert extends Component {
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
    historyStyle.innerHTML = `
      #alert-main {
      }
      .alert-history {
        transform: translateY(${this.showHistory ? - this.alertHeight - this.historyHeight + 1 : 1 * Math.ceil(config.get('poi.zoomLevel', 1))}px);
        pointer-events: ${this.showHistory ? 'auto' : 'none'};
      }
    `
  }
  handleStyleChange = () => {
    setTimeout(() => {
      try {
        const alertHeight =  $('poi-control').offsetHeight
        const historyHeight = this.alertHistory.offsetHeight
        const bgColor = window.getComputedStyle($('body')).backgroundColor
        if (historyHeight === this.historyHeight && alertHeight === this.alertHeight && bgColor === this.bgColor) {
          return
        }
        this.alertHeight = alertHeight
        this.historyHeight = historyHeight
        this.bgColor = bgColor
      } catch (error) {
        this.alertHeight = 30
        this.historyHeight = 152
      }
      alertStyle.innerHTML = `
        poi-alert {
          height: ${this.alertHeight}px;
        }
        #alert-container.alert-default, .alert-history.panel {
          background-color: ${this.bgColor};
        }
        .alert-default {
          ${(window.theme == 'paper' || window.theme == 'lumen') ? 'color: #000;' : ''}
        }
        #alert-main {
          height: 29px;
        }
      `
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
    const containerWidth = $('poi-alert').offsetWidth
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
  componentWillUpdate = (nextProps, nextState) => {
    stickyEnd = Date.now() + updateTime
    updateTime = 0
  }
  componentDidUpdate = (prevProps, prevState) => {
    this.handleStyleChange()
  }
  componentDidMount = () => {
    config.addListener('config.set', (path, value) => {
      if (path === 'poi.theme') {
        this.handleStyleChange()
      }
    })
    this.observer = new MutationObserver(this.handleOverflow)
    const target = this.alertArea
    const options = {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true,
    }
    this.handleOverflowDebounced = debounce(this.handleOverflow, 100)
    this.observer.observe(target, options)
    window.addEventListener('alert.new', this.handleAddAlert)
    window.addEventListener('resize', this.handleOverflowDebounced)
    window.addEventListener('alert.change', this.handleOverflow)
    this.handleStyleChange()
  }
  componentWillUnmount = () => {
    config.removeListener('config.set', this.handleStyleChange)
    window.removeEventListener('alert.new', this.handleAddAlert)
    window.removeEventListener('resize', this.handleOverflowDebounced)
    window.removeEventListener('alert.change', this.handleOverflow)
  }
  render() {
    return (
      <div id='alert-main' className='alert-main'>
        <div
          id='alert-container'
          className={`alert alert-${this.state.current.type} alert-container`}
          onClick={this.toggleHistory}
        >
          <div className='alert-position' ref={(ref) => { this.alertPosition = ref }}>
            <span id='alert-area' ref={(ref) => { this.alertArea = ref }} className={this.state.overflow ? 'overflow-anim' : ''}>
              {
                this.state.overflow ?
                  <span>
                    <span style={{marginRight: 50}}>
                      {this.state.current.content}
                    </span>
                    <span style={{marginRight: 50}}>
                      {this.state.current.content}
                    </span>
                  </span>
                  : this.state.current.content
              }
            </span>
          </div>
        </div>
        <div id='alert-history'
          ref={(ref) => { this.alertHistory = ref }}
          className='alert-history panel'
          onClick={this.toggleHistory}>
          {this.state.history}
        </div>
      </div>
    )
  }
}
