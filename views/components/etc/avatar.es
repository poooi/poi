import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { join } from 'path-extra'
import { avatarWorker } from 'views/services/worker'
import FontAwesome from 'react-fontawesome'

import './assets/avatar.css'

const { APPDATA_PATH, getStore } = window

const avatarCachePath = join(APPDATA_PATH, 'avatar','cache')

export class Avatar extends PureComponent {
  static propTypes = {
    mstId: PropTypes.number.isRequired,
    height: PropTypes.number,
    isDamaged: PropTypes.bool,
  }

  static defaultProps = {
    height: 121,
    isDamaged: false,
  }

  state = {
    available: false,
  }

  onMessage = e => {
    if (e.data[0] === 'Ready' && e.data[1] === this.props.mstId) {
      this.setState({ available: true })
    }
  }

  sendMessage = mstId => {
    avatarWorker.postMessage([ 'Request', mstId, getStore(`const.$graphs.${mstId}.api_version`), getStore(`const.$graphs.${mstId}.api_filename`), getStore('info.server.ip') ])
  }

  componentDidMount = () => {
    avatarWorker.addEventListener('message', this.onMessage)
    this.sendMessage(this.props.mstId)
  }

  componentWillUnmount = () => {
    avatarWorker.removeEventListener('message', this.onMessage)
  }

  componentWillReceiveProps = nextProps => {
    if (this.props.mstId !== nextProps.mstId) {
      this.setState({ available: false })
      this.sendMessage(nextProps.mstId)
    }
  }

  render() {
    return (
      <div className="ship-avatar-container" style={{
        width: Math.round(1.85 * this.props.height),
      }}>
        {
          this.state.available ?
            <img
              className="ship-avatar"
              style={{ height: this.props.height, marginLeft: -Math.round(0.555 * this.props.height) }}
              src={join(avatarCachePath, `${this.props.mstId}_${this.props.isDamaged ? 'd' : 'n'}.png`)} />
            : <div className="ship-avatar-loading"><FontAwesome name='spinner' pulse /></div>
        }
      </div>
    )
  }
}
