import React, { useState, useRef, useCallback, useEffect } from 'react'
import i18next from 'views/env-parts/i18next'
import { take } from 'lodash'
import styled, { keyframes, css } from 'styled-components'
import { CustomTag } from 'views/components/etc/custom-tag'
import { ResizeSensor } from 'views/components/etc/resize-sensor'
import { EventEmitter } from 'views/utils/event-emitter'

const HISTORY_SIZE = 7

export interface Message {
  type: string
  content: string
  priority: number
  options?: {
    dontReserve?: boolean
  }
  stickyFor?: number
  ts?: number
}

const initialMessage: Message = {
  type: 'default',
  content: i18next.t('Waiting for response'),
  priority: 0,
  options: {
    dontReserve: true,
  },
  ts: 0,
}

const PoiAlertTag = styled(CustomTag)`
  width: 0;
  flex: 1;
  height: 30px;
`

const Alert = styled.div`
  margin-bottom: 0;
  min-height: 100%;
  opacity: 0.7;
  padding: 6px 3px 5px;
  border-radius: 0;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
`

const AlertLogContent = styled(Alert)`
  overflow: scroll;
  text-overflow: initial;
`

const AlertMain = styled.div`
  height: 29px;
  pointer-events: none;
  position: relative;
  transition: 0.3s;
  width: 100%;
  border-radius: 0;
  box-shadow: none !important;
`

const AlertContainer = styled(Alert)`
  cursor: pointer;
  height: 30px;
  overflow: hidden;
  pointer-events: auto;
  position: relative;
  transition: 0.3s;
  z-index: 2;
`

const AlertLog = styled.div`
  overflow: hidden;
  transition: 0.3s;
  z-index: 1;
  backdrop-filter: blur(5px);
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  ${({
    toggle,
    height,
    containerHeight,
  }: {
    toggle: boolean
    height: number
    containerHeight: number
  }) =>
    toggle
      ? css`
          transform: translate3d(0, ${-Math.round(containerHeight + height)}px, 0);
          pointer-events: auto;
        `
      : css`
          transform: translate3d(0, 1px, 0);
          pointer-events: none;
        `}
`

const AlertPosition = styled.div`
  margin-left: auto;
  margin-right: auto;
`

const OverflowScroll = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(-100%, 0, 0);
  }
`

const AlertArea = styled.div`
  cursor: pointer;
  display: flex;
  ${({ overflow }: { overflow: boolean }) =>
    overflow &&
    css`
      animation-delay: 2s;
      animation-duration: 18s;
      animation-iteration-count: 2;
      animation-name: ${OverflowScroll};
      animation-timing-function: linear;
      margin-left: 0;
    `}
`

const MsgMainCnt = styled.div`
  width: fit-content;
`

export const messageInstance = new EventEmitter<Message>()

export const PoiAlert: React.FC = () => {
  const [list, setList] = useState<Message[]>([initialMessage])
  const [showHistory, setShowHistory] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1)
  const [containerHeight, setContainerHeight] = useState(0)
  const [historyHeight, setHistoryHeight] = useState(0)
  const [msgWidth, setMsgWidth] = useState(0)
  const stickyEnd = useRef(Date.now())

  const toggleHistory = useCallback(() => setShowHistory(!showHistory), [showHistory])

  const handleAddAlert = useCallback((e: Message) => {
    const nowTS = Date.now()
    const value: Message = {
      ts: nowTS,
      stickyFor: 3000,
      ...e,
    }
    setList((prevList) => {
      const [current, ...history] = prevList
      if (value.priority < current.priority && nowTS < stickyEnd.current) {
        if (!value.options?.dontReserve) {
          // Old message has higher priority, push new message to history
          return [current, value, ...take(history, HISTORY_SIZE - 2)]
        }
      } else if (!current.options?.dontReserve) {
        // push old message to history
        stickyEnd.current = nowTS + (value.stickyFor || 0)
        return [value, current, ...take(history, HISTORY_SIZE - 2)]
      } else {
        // Replace old message
        stickyEnd.current = nowTS + (value.stickyFor || 0)
        return [value, ...take(history, HISTORY_SIZE - 1)]
      }
      return prevList
    })
  }, [])

  const handleAlertMainResize = useCallback((entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.contentRect) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect
        setContainerWidth(containerWidth)
        setContainerHeight(containerHeight)
      }
    })
  }, [])

  const handleMsgCntResize = useCallback((entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.contentRect) {
        setMsgWidth(entry.contentRect.width)
      }
    })
  }, [])

  const handleAlertLogResize = useCallback((entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.contentRect) {
        setHistoryHeight(entry.contentRect.height)
      }
    })
  }, [])

  useEffect(() => {
    messageInstance.on(handleAddAlert)
    return () => {
      messageInstance.off(handleAddAlert)
    }
  }, [handleAddAlert])

  const isOverflow = msgWidth > containerWidth
  const [current, ...history] = list

  return (
    // @ts-expect-error wrong type definition
    <PoiAlertTag tag="poi-alert">
      <ResizeSensor onResize={handleAlertMainResize}>
        <AlertMain id="alert-main" className="alert-main bp4-popover">
          <AlertContainer
            id="alert-container"
            className={`bp4-callout bp4-intent-${current.type} alert-container`}
            onClick={toggleHistory}
          >
            <AlertPosition
              className="alert-position"
              style={{ width: msgWidth + (isOverflow ? 50 : 0) }}
            >
              <AlertArea id="alert-area" overflow={isOverflow}>
                <ResizeSensor onResize={handleMsgCntResize}>
                  <MsgMainCnt>
                    <span>{current.content}</span>
                  </MsgMainCnt>
                </ResizeSensor>
                {isOverflow && (
                  <span style={{ marginRight: 50, marginLeft: 50 }}>{current.content}</span>
                )}
              </AlertArea>
            </AlertPosition>
          </AlertContainer>
          <ResizeSensor onResize={handleAlertLogResize}>
            <AlertLog
              id="alert-log"
              className="alert-log bp4-popover-content"
              toggle={showHistory}
              height={historyHeight}
              containerHeight={containerHeight}
              onClick={toggleHistory}
              key={history[0]?.ts || 0}
            >
              {history.reverse().map((h) => (
                <AlertLogContent
                  key={h.ts}
                  className={`bp4-callout bp4-intent-${h.type}`}
                  data-ts={h.ts}
                >
                  {h.content}
                </AlertLogContent>
              ))}
            </AlertLog>
          </ResizeSensor>
        </AlertMain>
      </ResizeSensor>
    </PoiAlertTag>
  )
}
