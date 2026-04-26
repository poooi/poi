import {
  Button,
  ButtonGroup,
  InputGroup,
  Tooltip,
  Intent,
  Position,
  FormGroup,
} from '@blueprintjs/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { styled } from 'styled-components'
import ContextButtonTooltip from 'views/components/etc/context-button-tooltip'
import { getStore } from 'views/redux/create-store'
import { gameRefreshPage, gameReload } from 'views/services/utils'

import { Section } from '../components/section'

const wvStatus = {
  Loading: 0,
  Loaded: 1,
  Failed: 2,
} as const

type WvStatus = (typeof wvStatus)[keyof typeof wvStatus]

const Wrapper = styled.div`
  display: flex;
`

const URL = styled.div`
  flex: 1;

  svg {
    z-index: 16;
    top: 30%;
    left: 10px;
    position: absolute;
  }

  input {
    font-size: 12px;
  }
`

const Control = styled.div`
  margin-left: 1em;
`

export const NavigatorBar = () => {
  const { t } = useTranslation('setting')

  config.setDefault('poi.misc.homepage', 'https://play.games.dmm.com/game/kancolle')

  const [status, setStatus] = useState<WvStatus>(wvStatus.Loaded)
  const [url, setUrl] = useState<string>(() => config.get('poi.misc.homepage') as string)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webviewRef = useRef<any>(null)

  const onStartLoading = useCallback(() => {
    setStatus(wvStatus.Loading)
  }, [])

  const onStopLoading = useCallback(() => {
    const webview = getStore('layout.webview.ref')
    setStatus(wvStatus.Loaded)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    setUrl((prev) => (webview as any)?.getURL?.() || prev)
  }, [])

  const onFailLoad = useCallback(() => {
    setStatus(wvStatus.Failed)
  }, [])

  const onWillNavigate = useCallback((e: { url?: string }) => {
    setUrl((prev) => e.url ?? prev)
  }, [])

  useEffect(() => {
    const load = () => {
      const webview = getStore('layout.webview.ref')
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const wv = webview as any
        wv.getWebContents().addListener('did-start-loading', onStartLoading)
        wv.getWebContents().addListener('did-stop-loading', onStopLoading)
        wv.getWebContents().addListener('did-fail-load', onFailLoad)
        wv.getWebContents().addListener('will-navigate', onWillNavigate)
        webviewRef.current = wv
      } catch (_) {
        setTimeout(load, 1000)
      }
    }
    load()

    return () => {
      try {
        const wv = webviewRef.current
        if (wv) {
          wv.getWebContents().removeListener('did-start-loading', onStartLoading)
          wv.getWebContents().removeListener('did-stop-loading', onStopLoading)
          wv.getWebContents().removeListener('did-fail-load', onFailLoad)
          wv.getWebContents().removeListener('will-navigate', onWillNavigate)
        }
      } catch (_) {
        // ignore
      }
    }
  }, [onStartLoading, onStopLoading, onFailLoad, onWillNavigate])

  const navigate = (targetUrl: string) => {
    if (!targetUrl) return
    const webview = getStore('layout.webview.ref')
    const resolved =
      targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
        ? targetUrl
        : `http://${targetUrl}`
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    ;(webview as any)?.loadURL?.(resolved)
    setUrl(resolved)
  }

  const onChangeUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof e.currentTarget.value === 'string') {
      setUrl(e.currentTarget.value)
    }
  }

  const onKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) navigate(url)
  }

  const onClickStop = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    ;(getStore('layout.webview.ref') as any)?.stop?.()
  }

  const onClickHomepage = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set('poi.misc.homepage' as never, url as never)
  }

  const onRightClickHomepage = () => {
    navigate(config.get('poi.misc.homepage') as string)
  }

  let statusIcon: React.JSX.Element | undefined
  if (status === wvStatus.Loading) {
    statusIcon = <FontAwesomeIcon icon={['fas', 'spinner']} spin />
  } else if (status === wvStatus.Failed) {
    statusIcon = <FontAwesomeIcon icon={['fas', 'times']} />
  }

  const navigateAction = status === wvStatus.Loading ? onClickStop : () => navigate(url)
  const navigateIcon =
    status === wvStatus.Loading ? (
      <FontAwesomeIcon icon={['fas', 'times']} />
    ) : (
      <FontAwesomeIcon icon={['fas', 'arrow-right']} />
    )

  return (
    <Section className="navigator" title={t('Browser')}>
      <Wrapper>
        <URL className="navigator-url">
          <FormGroup>
            <InputGroup
              type="text"
              placeholder={t('Input address')}
              className={statusIcon ? 'navigator-with-status' : 'navigator-without-status'}
              value={url}
              onChange={onChangeUrl}
              onKeyDown={onKeydown}
              leftIcon={statusIcon}
            />
          </FormGroup>
        </URL>
        <Control className="navigator-control">
          <ButtonGroup>
            <Button intent={Intent.PRIMARY} onClick={navigateAction}>
              {navigateIcon}
            </Button>
            <Tooltip
              position={Position.TOP}
              content={
                <ContextButtonTooltip
                  left={t('others:Refresh page')}
                  right={t('others:Reload game')}
                />
              }
            >
              <Button intent={Intent.WARNING} onClick={gameRefreshPage} onContextMenu={gameReload}>
                <FontAwesomeIcon icon={['fas', 'rotate']} />
              </Button>
            </Tooltip>
          </ButtonGroup>
          <Tooltip
            position={Position.TOP}
            content={
              <ContextButtonTooltip left={t('Set as homepage')} right={t('Load homepage')} />
            }
          >
            <ButtonGroup style={{ marginLeft: 5 }}>
              <Button onClick={onClickHomepage} onContextMenu={onRightClickHomepage}>
                <FontAwesomeIcon icon={['fas', 'bookmark']} />
              </Button>
            </ButtonGroup>
          </Tooltip>
        </Control>
      </Wrapper>
    </Section>
  )
}
