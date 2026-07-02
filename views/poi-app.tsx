import type { ResizableAreaHandle, SizeState } from 'react-resizable-area'
import type { RootState } from 'views/redux/reducer-factory'

import { get } from 'lodash'
import React, { useState, useCallback, useRef } from 'react'
import FontAwesome from 'react-fontawesome'
import { useSelector } from 'react-redux'
import { ResizableArea } from 'react-resizable-area'
import { styled, css } from 'styled-components'
import { config } from 'views/env'

import { ControlledTabArea } from './components/tab-area'

interface AreaSize {
  px: number
  percent: number
}

// top/bottom/width/transform are continuous values applied via the style prop
// in overlay mode, so styled-components doesn't mint a class per pixel value
const PoiAppE = styled.div<{
  isHorizontal?: boolean
  overlay?: boolean
}>`
  position: relative;
  flex: 1 0 0;
  max-width: 100vw;
  width: 100%;
  height: 0;

  .container {
    overflow-x: hidden;
    padding-left: 0;
    padding-right: 0;
    width: auto;
  }

  ${({ isHorizontal }) =>
    isHorizontal &&
    css`
      height: 100%;
      width: 0;
    `}

  ${({ overlay }) =>
    overlay &&
    css`
      position: fixed;
      right: 0;
      transition: transform 0.3s 0.2s ease-in;
      will-change: transform;
      max-width: calc(100vw - 50px);
      height: inherit;
      z-index: 19;
    `}
`

const PoiAppContainer = styled.div<{ overlay?: boolean; isDarkTheme?: boolean }>`
  overflow: hidden;
  height: 100%;
  ${({ overlay, isDarkTheme }) =>
    overlay &&
    css`
      backdrop-filter: blur(30px);
      background: oklch(from var(--poi-background-color) l c h / ${isDarkTheme ? '0.6' : '0.4'});
    `}
`

const OverlayPanelTrigger = styled.a<{ isDarkTheme?: boolean }>`
  transform: translateX(-100%);
  position: fixed;
  height: 5vh;
  display: flex;
  align-items: center;
  width: 40px;
  min-height: 30px;
  text-align: center;
  padding: 5px 10px;
  font-size: 15px;
  bottom: 0;
  border-top-left-radius: 5px;
  ${({ isDarkTheme }) => css`
    background: oklch(from var(--poi-background-color) l c h / ${isDarkTheme ? '0.6' : '0.4'});
  `}

  & > svg {
    margin: auto;
  }
`

const OverlayPanelResizer = styled(ResizableArea)<{ widthResize?: number }>`
  position: fixed !important;
  left: 0;
  bottom: 30px;
  pointer-events: none;
  ${({ widthResize }) =>
    widthResize &&
    css`
      & > div {
        pointer-events: all;
        opacity: 0;
      }
    `}
`

const overlayPanelDefaultWidth: AreaSize = {
  px: 700,
  percent: 0,
}

const overlayPanelMinimumWidth: AreaSize = {
  px: 350,
  percent: 0,
}

const transformToAreaSize = (size: AreaSize): AreaSize => ({
  percent: 100,
  px: -size.px,
})

const transformToPanelSize = (size: AreaSize): AreaSize => ({
  percent: 0,
  px: -size.px,
})

export const PoiApp = () => {
  const layout = useSelector((state: RootState) =>
    get(state, 'config.poi.layout.mode', 'horizontal'),
  )
  const overlay = useSelector((state: RootState) => get(state, 'config.poi.layout.overlay', false))
  const editable = useSelector((state: RootState) =>
    get(state.config, 'poi.layout.editable', false),
  )
  const isDarkTheme = useSelector(
    (state: RootState) => get(state.config, 'poi.appearance.theme', 'dark') === 'dark',
  )
  const overlayPanelWidth = useSelector(
    (state: RootState) => state.config?.poi?.tabarea?.overlaypanelwidth ?? overlayPanelDefaultWidth,
  )

  const [overlayVisible, setOverlayVisible] = useState(false)
  const resizableAreaRef = useRef<ResizableAreaHandle>(null)

  const handleOverlayPanelResize = useCallback(({ width }: SizeState) => {
    const val = transformToPanelSize({ px: width.px ?? 0, percent: width.percent ?? 0 })
    if (val.px < overlayPanelMinimumWidth.px) {
      val.px = overlayPanelMinimumWidth.px
    }
    config.set('poi.tabarea.overlaypanelwidth', val)
  }, [])

  const isHorizontal = layout === 'horizontal'
  // these force a synchronous layout, and are only consumed by the overlay
  // panel, so skip the reads entirely in non-overlay layouts
  let top = 0
  let bottom = 29
  if (overlay) {
    const titleBar = document.querySelector('title-bar')
    top = titleBar ? titleBar.clientHeight : 0
    const poiInfo = document.querySelector('poi-info')
    if (poiInfo) {
      const rect = poiInfo.getBoundingClientRect()
      bottom = rect.height - rect.bottom + innerHeight
    }
  }

  return (
    <>
      {overlay && (
        <OverlayPanelResizer
          ref={resizableAreaRef}
          className="overlay-panel-resizer"
          widthResize={editable && overlayVisible ? 1 : 0}
          minimumWidth={{
            px: 50,
            percent: 0,
          }}
          maximumWidth={transformToAreaSize(overlayPanelMinimumWidth)}
          defaultWidth={transformToAreaSize(overlayPanelDefaultWidth)}
          initWidth={transformToAreaSize(overlayPanelWidth)}
          minimumHeight={{
            px: -(bottom + top),
            percent: 100,
          }}
          maximumHeight={{
            px: -(bottom + top),
            percent: 100,
          }}
          initHeight={{
            px: -(bottom + top),
            percent: 100,
          }}
          usePercentageResize={{ width: false, height: false }}
          disable={{
            width: !editable || !overlayVisible,
            height: !editable || !overlayVisible,
          }}
          onResizing={handleOverlayPanelResize}
          onResized={handleOverlayPanelResize}
          parentContainer={document.querySelector('poi-main') ?? undefined}
        />
      )}
      <PoiAppE
        overlay={overlay}
        isHorizontal={isHorizontal}
        style={
          overlay
            ? {
                transform: `translate3d(${overlayVisible ? 0 : 100}%, 0, 0)`,
                top,
                bottom,
                width: overlayPanelWidth.px,
              }
            : undefined
        }
      >
        {overlay && (
          <OverlayPanelTrigger
            className="overlay-panel-trigger"
            isDarkTheme={isDarkTheme}
            onClick={() => setOverlayVisible((v) => !v)}
          >
            <FontAwesome name={!overlayVisible ? 'angle-left' : 'angle-right'} />
          </OverlayPanelTrigger>
        )}
        <PoiAppContainer
          id="poi-app-container"
          className="poi-app-container"
          overlay={overlay}
          isDarkTheme={isDarkTheme}
        >
          <poi-nav>
            <poi-nav-tabs>
              <ControlledTabArea />
            </poi-nav-tabs>
          </poi-nav>
        </PoiAppContainer>
      </PoiAppE>
    </>
  )
}
