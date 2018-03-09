import React, { Component } from 'react'
import { remote } from 'electron'
import { ProgressBar } from 'react-bootstrap'
import { throttle } from 'lodash'
import { translate } from 'react-i18next'

const { updater } = remote.require('./lib/updater')

@translate(['setting'])
export class DownloadProgress extends Component {
  state = {
    bytesPerSecond: 0,
    percent: 0,
    total: 0,
    transferred: 0,
    downloaded: false,
  }
  updateProgress = progress => {
    remote.getCurrentWindow().setProgressBar(progress.percent / 100)
    this.setState(progress)
  }
  componentDidMount() {
    if (!this.updateProgressDebounced) {
      this.updateProgressDebounced = throttle(this.updateProgress, 1500)
    }
    updater.on('download-progress', progress => this.updateProgressDebounced(progress))
    updater.on('update-downloaded', () => {
      remote.getCurrentWindow().setProgressBar(-1)
      this.setState({downloaded: true})
    })
  }
  render () {
    const { t } = this.props
    return this.state.percent > 0 && (
      <h5 className="update-progress">
        <ProgressBar bsStyle='success'
          now={this.state.percent} />
        {
          this.state.downloaded
            ? <span>{t('setting:Quit app and install updates')}</span>
            : (this.state.percent >= 100
              ? <span>{t('setting:Deploying, please wait')}</span>
              : <span>
                {`${Math.round(this.state.bytesPerSecond / 1024)} KB/s, ${Math.round(this.state.transferred / 1048576)} / ${Math.round(this.state.total / 1048576)} MB`}
              </span>
            )
        }
      </h5>
    )
  }
}
