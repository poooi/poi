import type { FunctionComponent } from 'react'

import { Button, Intent } from '@blueprintjs/core'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

enum ErrorMessage {
  ConnectionError = 'could not connect',
  TimeoutError = 'network timeout',
}

const timeout = (): Promise<void> =>
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(ErrorMessage.TimeoutError)), 15 * 1000)
  })

export const ConnectionTest: FunctionComponent<void> = () => {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation('setting')
  const controller = useRef<AbortController>()

  const connect = useCallback(async () => {
    controller.current = new AbortController()
    const resp = await fetch('https://www.google.com/gen_204', {
      signal: controller.current.signal,
    })
    if (resp.ok && resp.status === 204) {
      return Promise.resolve()
    } else {
      throw new Error(ErrorMessage.ConnectionError)
    }
  }, [])

  const test = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.race([connect(), timeout()])
      window.toast(t('Your connection looks good'), {
        type: 'success',
        title: t('Connection test'),
      })
    } catch (e) {
      console.error(e)
      window.toast(t('connection-test-failure-message'), {
        type: 'error',
        title: t('Connection test'),
      })
    } finally {
      controller.current?.abort?.()
      setLoading(false)
    }
  }, [connect, t])

  return (
    <div>
      <div>{t('connection-test-description')}</div>
      <Button intent={Intent.PRIMARY} minimal onClick={test} disabled={loading}>
        {t('Start testing')}
      </Button>
    </div>
  )
}
