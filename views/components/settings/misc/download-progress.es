import React, { Component } from 'react'
import { remote } from 'electron'
import { ProgressBar } from 'react-bootstrap'
import { throttle } from 'lodash'
import { Trans } from 'react-i18next'

const { updater } = remote.require('./lib/updater')

class DownloadProgress extends Component {
  state = {
    bytesPerSecond: 0,
    percent: 0,
    total: 0,
    transferred: 0,
    downloaded: false,
  }
  updateProgress = progress => {
    this.setState(progress)
  }
  componentDidMount() {
    if (!this.updateProgressDebounced) {
      this.updateProgressDebounced = throttle(this.updateProgress, 1500)
    }
    updater.on('download-progress', progress => this.updateProgressDebounced(progress))
    updater.on('update-downloaded', () => this.setState({downloaded: true}))
  }
  render () {
    return this.state.percent > 0 && (
      <h5 className="update-progress">
        <ProgressBar bsStyle='success'
          now={this.state.percent} />
        {
          this.state.downloaded
            ? <span><Trans>setting:Quit app and install updates</Trans></span>
            : (this.state.percent >= 100
              ? <span><Trans>setting:Deploying, please wait</Trans></span>
              : <span>
                {`${Math.round(this.state.bytesPerSecond / 1024)} KB/s, ${Math.round(this.state.transferred / 1048576)} / ${Math.round(this.state.total / 1048576)} MB`}
              </span>
            )
        }
      </h5>
    )
  }
}

export default DownloadProgress
