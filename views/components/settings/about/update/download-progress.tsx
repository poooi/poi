import type { Updater } from 'lib/updater'

import { ProgressBar, Intent } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { throttle } from 'lodash-es'
import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { styled } from 'styled-components'

const updater: Updater = remote.require('./lib/updater').updater

const Wrapper = styled.div`
  display: flex;
  white-space: nowrap;
  align-items: center;
`

const Indicator = styled.div`
  margin-left: 1em;
`

interface ProgressState {
  bytesPerSecond: number
  percent: number
  total: number
  transferred: number
  downloaded: boolean
}

export const DownloadProgress = () => {
  const { t } = useTranslation('setting')
  const [state, setState] = useState<ProgressState>({
    bytesPerSecond: 0,
    percent: 0,
    total: 0,
    transferred: 0,
    downloaded: false,
  })

  const updateProgress = useMemo(
    () =>
      throttle((progress: Omit<ProgressState, 'downloaded'>) => {
        remote.getCurrentWindow().setProgressBar(progress.percent / 100)
        setState((prev) => ({ ...prev, ...progress }))
      }, 1500),
    [],
  )

  useEffect(() => {
    updater.on('download-progress', (progress) => updateProgress(progress))
    updater.on('update-downloaded', () => {
      remote.getCurrentWindow().setProgressBar(-1)
      setState((prev) => ({ ...prev, downloaded: true }))
    })
  }, [updateProgress])

  const { percent, downloaded, bytesPerSecond, transferred, total } = state
  const isFinished = percent >= 100

  return state.percent > 0 ? (
    <Wrapper className="update-progress">
      <ProgressBar
        stripes={false}
        intent={isFinished ? Intent.SUCCESS : Intent.PRIMARY}
        value={percent / 100}
      />
      <Indicator>
        {downloaded
          ? t('Quit app and install updates')
          : isFinished
            ? t('Deploying, please wait')
            : `${Math.round(bytesPerSecond / 1024)} KB/s, ${Math.round(
                transferred / 1048576,
              )} / ${Math.round(total / 1048576)} MB`}
      </Indicator>
    </Wrapper>
  ) : null
}
