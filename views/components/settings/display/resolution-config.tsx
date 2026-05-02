import { Switch, HTMLSelect, NumericInput, FormGroup } from '@blueprintjs/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ipcRenderer } from 'electron'
import { debounce, get } from 'lodash-es'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'

const Icon = styled.div`
  margin: 0 1em;
`

const NumericResolution = styled.div`
  display: flex;
  align-items: center;
  flex: 1;

  .bp5-input-group {
    flex-shrink: 1;
  }
`
const EndLabel = styled.div`
  margin-left: 8px;
`

interface Display {
  bounds: { width: number; height: number }
}

function getMinArea(displays: Display[]) {
  return {
    screenWidth: Math.max(...displays.map((d) => d.bounds.width)),
    screenHeight: Math.max(...displays.map((d) => d.bounds.height)),
  }
}

interface WebviewState {
  width?: number
  height?: number
  windowWidth?: number
  windowHeight?: number
  useFixedResolution?: boolean
  windowUseFixedResolution?: boolean
}

type ConfigState = { config: Record<string, unknown>; layout: { webview: WebviewState } }

export const ResolutionConfig = () => {
  const webview = useSelector((state: ConfigState) => state.layout.webview)
  const isolateGameWindow = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.layout.isolate', false)),
  )
  const zoomLevel = Number(
    useSelector((state: ConfigState) => get(state.config, 'poi.appearance.zoom', 1)),
  )

  const [width, setWidth] = useState(() =>
    Math.round(((isolateGameWindow ? webview.windowWidth : webview.width) ?? 0) * zoomLevel),
  )
  const [screenSize, setScreenSize] = useState(() =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    getMinArea(ipcRenderer.sendSync('displays::get-all') as Display[]),
  )
  const defaultWidthRef = useRef(1200)
  const debouncedSetRef = useRef<ReturnType<typeof debounce> | null>(null)

  useEffect(() => {
    if (screenSize.screenHeight < 900 || screenSize.screenWidth < 1500) {
      config.setDefault('poi.webview.width', 800)
      defaultWidthRef.current = 800
    } else {
      config.setDefault('poi.webview.width', 1200)
      defaultWidthRef.current = 1200
    }

    const handleScreenChange = (_: unknown, displays: Display[]) => {
      setScreenSize(getMinArea(displays))
    }
    ipcRenderer.on('screen-status-changed', handleScreenChange)
    return () => {
      ipcRenderer.send('displays::remove-all-listeners')
      ipcRenderer.off('screen-status-changed', handleScreenChange)
    }
  }, [screenSize.screenHeight, screenSize.screenWidth])

  const handleSetWebviewWidth = useCallback(
    (value: number) => {
      const useFixed = isolateGameWindow
        ? webview.windowUseFixedResolution
        : webview.useFixedResolution
      const w = Math.round(value)
      if (isNaN(w) || w < 0 || !useFixed) return
      if (w > screenSize.screenWidth || w * 0.6 > screenSize.screenHeight) {
        const fallback = Number(
          config.get(
            isolateGameWindow ? 'poi.webview.windowWidth' : 'poi.webview.width',
            defaultWidthRef.current,
          ),
        )
        setWidth(fallback)
        return
      }
      if (isolateGameWindow) {
        config.set('poi.webview.windowWidth', w)
      } else {
        config.set('poi.webview.width', w)
      }
    },
    [isolateGameWindow, screenSize, webview],
  )

  const handleSetWebviewWidthWithDebounce = useCallback(
    (value: string | number, isDebounced: boolean) => {
      setWidth(parseInt(String(value)))
      if (!debouncedSetRef.current) {
        debouncedSetRef.current = debounce(handleSetWebviewWidth, 1000, {
          leading: false,
          trailing: true,
        })
      }
      if (isDebounced) {
        debouncedSetRef.current(parseInt(String(value)))
      } else {
        handleSetWebviewWidth(parseInt(String(value)))
      }
    },
    [handleSetWebviewWidth],
  )

  const handleSetFixedResolution = () => {
    if (isolateGameWindow) {
      config.set('poi.webview.windowUseFixedResolution', !webview.windowUseFixedResolution)
    } else {
      config.set('poi.webview.useFixedResolution', !webview.useFixedResolution)
    }
  }

  const height = Math.round(
    ((isolateGameWindow ? webview.windowHeight : webview.height) ?? 0) * zoomLevel,
  )
  const useFixedResolution = isolateGameWindow
    ? webview.windowUseFixedResolution
    : webview.useFixedResolution
  const labelText = `${Math.round((width / 1200) * 100)}%`

  return (
    <Section title={<Trans>setting:Game resolution</Trans>}>
      <Wrapper>
        <FormGroup inline>
          <Switch checked={Boolean(useFixedResolution)} onChange={handleSetFixedResolution}>
            <Trans>setting:Use fixed resolution for game area</Trans>
          </Switch>
        </FormGroup>

        <FillAvailable>
          <FormGroup inline>
            <Wrapper>
              <HTMLSelect
                value={width}
                onChange={(e) => handleSetWebviewWidthWithDebounce(e.target.value, false)}
                disabled={!useFixedResolution}
              >
                <option key={-1} value={width} hidden>
                  {labelText}
                </option>
                {[0, 1, 2, 3].map((i) => (
                  <option key={i} value={i * 400 + 400}>
                    {Math.round(((i * 400 + 400) / 1200) * 100)}%
                  </option>
                ))}
              </HTMLSelect>
              <Icon>
                <FontAwesomeIcon icon={['fas', 'exchange-alt']} />
              </Icon>
              <NumericResolution>
                <NumericInput
                  min={0}
                  majorStepSize={20}
                  stepSize={10}
                  minorStepSize={5}
                  value={width}
                  onValueChange={(v) => handleSetWebviewWidthWithDebounce(v, true)}
                  disabled={!useFixedResolution}
                />
                <Icon>
                  <FontAwesomeIcon icon={['fas', 'times']} />
                </Icon>
                <NumericInput value={Math.round(height)} disabled />
                <EndLabel>px</EndLabel>
              </NumericResolution>
            </Wrapper>
          </FormGroup>
        </FillAvailable>
      </Wrapper>
    </Section>
  )
}
