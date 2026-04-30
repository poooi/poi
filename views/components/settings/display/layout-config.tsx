import { Button, ButtonGroup, Intent, FormGroup } from '@blueprintjs/core'
import { get, compact } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { toggleModal } from 'views/env-parts/modal'

const SVG = {
  horizontal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M1 2v12h14V2zm9 11H2V3h8z" fill="currentColor" />
    </svg>
  ),
  vertical: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M1 2v12h14V2zm13 7H2V3h12z" fill="currentColor" />
    </svg>
  ),
  separate: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill="currentColor" d="M3 2v10h12V2H3zm11 9H4V5h10v5z" />
      <path fill="currentColor" d="M2 13V5H1v9h13v-1h-3z" />
    </svg>
  ),
  panel: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill="none" stroke="currentColor" d="M.5 1.5h15v13H.5zM9.5 2v12V2z" />
    </svg>
  ),
  singleTab: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill="currentColor" d="M1 1v12h14V1H1zm1 3h12v8H2V4z" />
    </svg>
  ),
  doubleTabHorizontal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill="currentColor" d="M1 1v12h14V1H1zm1 3h4.999v8H2V4zm12 8H8.999V4H14v8z" />
    </svg>
  ),
  doubleTabVertical: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M1 2v12h14V2H1zm13 11H2v-3h12v3zm0-5H2V5h12v3z" id="iconBg" fill="currentColor" />
    </svg>
  ),
}

interface IconProps {
  invertX?: boolean
  invertY?: boolean
  children?: React.ReactNode
}

const Icon = styled.span<IconProps>`
  height: 16px;
  line-height: 16px;
  min-width: 16px;
  display: flex;
  transform: ${(props) =>
    compact([props.invertX && 'scaleX(-1)', props.invertY && 'scaleY(-1)']).join(' ')};
`

type ConfigState = { config: Record<string, unknown> }

export const LayoutConfig = () => {
  const { t } = useTranslation('setting')
  const layout = String(
    useSelector((state: ConfigState) => get(state.config, 'poi.layout.mode', 'horizontal')),
  )
  const enableDoubleTabbed = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.tabarea.double', false)),
  )
  const verticalDoubleTabbed = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.tabarea.vertical', false)),
  )
  const reversed = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.layout.reverse', false)),
  )
  const isolateGameWindow = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.layout.isolate', false)),
  )
  const overlayPanel = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.layout.overlay', false)),
  )

  const createConfirmModal = (callback: () => void) => {
    const title = t('Apply changes')
    const content = t('Game page will be refreshed')
    toggleModal(title, content, [{ name: t('others:Confirm'), func: callback, style: 'warning' }])
  }

  const setLayout = (newLayout: string, rev: boolean) => {
    if (isolateGameWindow) setIsolateGameWindow(false)
    if (overlayPanel) setOverlayPanel(false)
    config.set('poi.layout.mode', newLayout)
    config.set('poi.layout.reverse', rev)
  }

  const handleSetLayout = (newLayout: string, rev: boolean) => {
    if (isolateGameWindow) {
      createConfirmModal(() => setLayout(newLayout, rev))
    } else {
      setLayout(newLayout, rev)
    }
  }

  const setIsolateGameWindow = (flag: boolean) => {
    config.set('poi.layout.isolate', flag)
  }

  const setOverlayPanel = (flag: boolean) => {
    config.set('poi.layout.overlay', flag)
  }

  const handleSetIsolateGameWindow = () => {
    if (!isolateGameWindow) {
      createConfirmModal(() => {
        if (overlayPanel) setLayout('horizontal', false)
        setIsolateGameWindow(true)
      })
    }
  }

  const handleSetOverlayPanel = () => {
    if (isolateGameWindow) {
      createConfirmModal(() => {
        setLayout('horizontal', false)
        setOverlayPanel(true)
      })
      return
    }
    setOverlayPanel(!overlayPanel)
  }

  const handleSetDoubleTabbed = (doubleTabbed: boolean, vertical?: boolean) => {
    config.set('poi.tabarea.double', doubleTabbed)
    if (doubleTabbed && vertical !== undefined) {
      config.set('poi.tabarea.vertical', vertical)
    }
  }

  const leftActive = !overlayPanel && !isolateGameWindow && layout === 'horizontal' && reversed
  const downActive = !overlayPanel && !isolateGameWindow && layout !== 'horizontal' && !reversed
  const upActive = !overlayPanel && !isolateGameWindow && layout !== 'horizontal' && reversed
  const rightActive =
    !overlayPanel && !isolateGameWindow && layout === 'horizontal' && !reversed && !overlayPanel

  return (
    <Section title={t('Layout')}>
      <Wrapper>
        <Wrapper>
          <FormGroup inline>
            <ButtonGroup style={{ marginRight: '2em' }}>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={rightActive}
                onClick={() => handleSetLayout('horizontal', false)}
              >
                <Icon>{SVG.horizontal}</Icon>
              </Button>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={downActive}
                onClick={() => handleSetLayout('vertical', false)}
              >
                <Icon>{SVG.vertical}</Icon>
              </Button>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={upActive}
                onClick={() => handleSetLayout('vertical', true)}
              >
                <Icon invertY>{SVG.vertical}</Icon>
              </Button>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={leftActive}
                onClick={() => handleSetLayout('horizontal', true)}
              >
                <Icon invertX>{SVG.horizontal}</Icon>
              </Button>
            </ButtonGroup>

            <ButtonGroup>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={isolateGameWindow}
                onClick={handleSetIsolateGameWindow}
              >
                <Icon>{SVG.separate}</Icon>
              </Button>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={overlayPanel && !isolateGameWindow}
                onClick={handleSetOverlayPanel}
              >
                <Icon>{SVG.panel}</Icon>
              </Button>
            </ButtonGroup>
          </FormGroup>
        </Wrapper>

        <Wrapper>
          <FormGroup inline>
            <ButtonGroup>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={!enableDoubleTabbed}
                onClick={() => handleSetDoubleTabbed(false)}
              >
                <Icon invertX>{SVG.singleTab}</Icon>
              </Button>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={enableDoubleTabbed && !verticalDoubleTabbed}
                onClick={() => handleSetDoubleTabbed(true, false)}
              >
                <Icon>{SVG.doubleTabHorizontal}</Icon>
              </Button>
              <Button
                minimal
                intent={Intent.PRIMARY}
                active={enableDoubleTabbed && verticalDoubleTabbed}
                onClick={() => handleSetDoubleTabbed(true, true)}
              >
                <Icon invertY>{SVG.doubleTabVertical}</Icon>
              </Button>
            </ButtonGroup>
          </FormGroup>
        </Wrapper>
      </Wrapper>
    </Section>
  )
}
