import React from 'react'
import { connect } from 'react-redux'
import { remote } from 'electron'
import { debounce } from 'lodash'

const {$, config} = window
const {Component} = React

let alertStyle = document.createElement('style')
let historyStyle = document.createElement('style')
alertStyle.innerHTML = `
  poi-alert {
    height: 30px;
  }
  #alert-container {
    height: 30px;
  }
  #alert-main {
    height: 182px;
    bottom: 152px;
  }
`
historyStyle.innerHTML = `
  .alert-history {
    top: 182px;
    pointer-events: 'none';
  }
`
remote.getCurrentWindow().webContents.on('dom-ready', function(e) {
  document.body.appendChild(alertStyle)
  document.body.appendChild(historyStyle)
})

export const PoiAlert = connect((state, props) => ({
  history: state.alert.history,
  current: state.alert.current,
}))(class poiAlert extends Component {
  static propTypes = {
    history: React.PropTypes.array,
    current: React.PropTypes.object,
  }
  constructor(props) {
    super(props)
    this.showHistory = false
    this.msgWidth = 0
    this.alertHeight = 30
    this.historyHeight = 152
    this.state = {
      overflow: false,
    }
  }
  toggleHistory = () => {
    this.showHistory = !this.showHistory
    historyStyle.innerHTML = `
      #alert-main {
        overflow: ${this.showHistory ? 'auto' : 'hidden'};
      }
      .alert-history {
        top: ${this.showHistory ? 0 : this.historyHeight + this.alertHeight}px;
        pointer-events: ${this.showHistory ? 'auto' : 'none'};
      }
    `
  }
  handleStyleChange = () => {
    setTimeout(() => {
      try {
        this.alertHeight = $('poi-control').offsetHeight
        this.historyHeight = $('.alert-history').offsetHeight
      } catch (error) {
        this.alertHeight = 30
        this.historyHeight = 152
      }
      alertStyle.innerHTML = `
        poi-alert {
          height: ${this.alertHeight}px;
        }
        #alert-container.alert-default, .alert-history.panel {
          background-color: ${window.getComputedStyle($('body')).backgroundColor};
        }
        #alert-container {
          height: ${this.alertHeight}px;
        }
        #alert-main {
          height: ${this.historyHeight + this.alertHeight}px;
          bottom: ${this.historyHeight}px;
        }
        .alert-history-hidden {
          top:
        }
        .alert-default {
          ${(window.theme == 'paper' || window.theme == 'lumen') ? 'color: #000' : ''}
        }
      `
    }, 100)
  }
  handleOverflow = () => {
    let containerWidth = $('poi-alert').offsetWidth
    if (!this.state.overflow) {
      this.msgWidth = $('#alert-area').offsetWidth
      $('.alert-position').style.width = `${this.msgWidth}px`
    }
    if ((this.msgWidth > containerWidth) && !this.state.overflow) {
      $('.alert-position').style.width = `${this.msgWidth + 50}px`
      this.setState({overflow: true})
    } else if ((this.msgWidth < containerWidth) && this.state.overflow) {
      $('.alert-position').style.width = `${this.msgWidth}px`
      this.setState({overflow: false})
    }
  }
  componentDidUpdate = (prevProps, prevState) => {
    if (this.props.current.content !== prevProps.current.content) {
      if (this.state.overflow) {
        this.setState({overflow: false})
      }
    }
  }
  componentDidMount = () => {
    config.addListener('config.set', this.handleStyleChange)
    this.observer = new MutationObserver(this.handleOverflow)
    let target = $('#alert-area')
    let options = {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true,
    }
    this.handleOverflowDebounced = debounce(this.handleOverflow, 100)
    this.observer.observe(target, options)
    window.addEventListener('resize', this.handleOverflowDebounced)
    window.addEventListener('alert.change', this.handleOverflow)
  }
  componentWillUnmount = () => {
    config.removeListener('config.set', this.handleStyleChange)
    window.removeEventListener('resize', this.handleOverflowDebounced)
    window.removeEventListener('alert.change', this.handleOverflow)
  }
  render() {
    return (
      <div id='alert-main' className='alert-main'>
        <div id='alert-history'
             className='alert-history panel'
             onClick={this.toggleHistory}>
          {this.props.history}
        </div>
        <div id='alert-container'
             className={`alert alert-${this.props.current.type} alert-container`}
             onClick={this.toggleHistory}>
          <div className='alert-position'>
            <span id='alert-area' className={this.state.overflow ? 'overflow-anim' : ''}>
              {
                this.state.overflow ?
                <span>
                  <span style={{marginRight: 50}}>
                    {this.props.current.content}
                  </span>
                  <span style={{marginRight: 50}}>
                    {this.props.current.content}
                  </span>
                </span>
                : this.props.current.content
              }
            </span>
          </div>
        </div>
      </div>
    )
  }
})
