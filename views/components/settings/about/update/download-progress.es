import React, { Component } from 'react'
import * as remote from '@electron/remote'
import { ProgressBar, Intent } from '@blueprintjs/core'
import { throttle } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { styled } from 'styled-components'

const { updater } = remote.require('./lib/updater')

const Wrapper = styled.div`
  display: flex;
  white-space: nowrap;
  align-items: center;
`

const Indicator = styled.div`
  margin-left: 1em;
`

@withNamespaces(['setting'])
export class DownloadProgress extends Component {
  state = {
    bytesPerSecond: 0,
    percent: 0,
    total: 0,
    transferred: 0,
    downloaded: false,
  }

  updateProgress = throttle((progress) => {
    remote.getCurrentWindow().setProgressBar(progress.percent / 100)
    this.setState(progress)
  }, 1500)

  componentDidMount() {
    updater.on('download-progress', (progress) => this.updateProgress(progress))
    updater.on('update-downloaded', () => {
      remote.getCurrentWindow().setProgressBar(-1)
      this.setState({ downloaded: true })
    })
  }

  render() {
    const { t } = this.props

    const { percent, downloaded, bytesPerSecond, transferred, total } = this.state
    const isFinished = percent >= 100
    return (
      this.state.percent > 0 && (
        <Wrapper className="update-progress">
          <ProgressBar
            stripes={false}
            intent={isFinished ? Intent.SUCCESS : Intent.PRIMARY}
            value={percent / 100}
          />
          <Indicator>
            {downloaded
              ? t('setting:Quit app and install updates')
              : isFinished
                ? t('setting:Deploying, please wait')
                : `${Math.round(bytesPerSecond / 1024)} KB/s, ${Math.round(
                    transferred / 1048576,
                  )} / ${Math.round(total / 1048576)} MB`}
          </Indicator>
        </Wrapper>
      )
    )
  }
}
