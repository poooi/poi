import React, { useState, useRef, useCallback, useEffect } from 'react'
import i18next from 'views/env-parts/i18next'
import { takeRight } from 'lodash'
import styled, { keyframes, css } from 'styled-components'
import { CustomTag } from 'views/components/etc/custom-tag'

const HISTORY_SIZE = 6

const PoiAlertTag = styled(CustomTag)`
  width: 0;
  flex: 1;
  height: 30px;
`

const Alert = styled.div`
  margin-bottom: 0;
  min-height: 100%;
  opacity: 0.7;
  padding: 6px 3px 5px 3px;
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
  ${({ toggle, height, containerHeight }) =>
    toggle
      ? css`
          transform: translate3d(0, ${1 - containerHeight - height}px, 0);
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
  ${({ overflow }) =>
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

export const PoiAlert = () => {
  const [history, setHistory] = useState([])
  const [current, setCurrent] = useState({
    type: 'default',
    content: i18next.t('Waiting for response'),
    priority: 0,
    options: {
      dontReserve: true,
    },
  })
  const [showHistory, setShowHistory] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1)
  const [containerHeight, setContainerHeight] = useState(0)
  const [historyHeight, setHistoryHeight] = useState(0)
  const [msgWidth, setMsgWidth] = useState(0)

  const alertMain = useRef()
  const alertHistory = useRef()
  const msgCnt = useRef()
  const updateTime = useRef(0)
  const stickyEnd = useRef(Date.now())

  const toggleHistory = useCallback(() => setShowHistory(!showHistory), [showHistory])

  const handleAddAlert = useCallback(
    (e) => {
      const nowTS = Date.now()
      const value = {
        type: 'default',
        content: '',
        priority: 0,
        ts: nowTS,
        ...e.detail,
      }
      if (value.priority < current.priority && nowTS < stickyEnd.current) {
        if (!value.dontReserve) {
          // Old message has higher priority, push new message to history
          setHistory([...takeRight(history, HISTORY_SIZE), value])
        }
      } else if (!current.dontReserve) {
        // push old message to history
        updateTime.current = value.stickyFor || 3000
        setHistory([...takeRight(history, HISTORY_SIZE - 1), current])
        setCurrent(value)
      } else {
        updateTime.current = value.stickyFor || 3000
        setCurrent(value)
      }
    },
    [current, history],
  )

  const handleRefResize = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.contentRect) {
        if (entry.target === alertMain.current) {
          const { width: containerWidth, height: containerHeight } = entry.contentRect
          setContainerWidth(containerWidth)
          setContainerHeight(containerHeight)
        } else if (entry.target === msgCnt.current) {
          setMsgWidth(entry.contentRect.width)
        } else {
          setHistoryHeight(entry.contentRect.height)
        }
      }
    })
  }, [])

  useEffect(() => {
    stickyEnd.current = Date.now() + updateTime.current
    updateTime.current = 0
  })

  useEffect(() => {
    const observer = new ResizeObserver(handleRefResize)
    observer.observe(alertMain.current)
    observer.observe(alertHistory.current)
    observer.observe(msgCnt.current)
    window.addEventListener('alert.new', handleAddAlert)
    return () => {
      observer.unobserve(alertMain.current)
      observer.unobserve(alertHistory.current)
      observer.unobserve(msgCnt.current)
      window.removeEventListener('alert.new', handleAddAlert)
    }
  }, [handleRefResize, handleAddAlert])

  const isOverflow = msgWidth > containerWidth
  return (
    <PoiAlertTag tag="poi-alert">
      <AlertMain id="alert-main" className="alert-main bp3-popover" ref={alertMain}>
        <AlertContainer
          id="alert-container"
          className={`bp3-callout bp3-intent-${current.type} alert-container`}
          onClick={toggleHistory}
        >
          <AlertPosition
            className="alert-position"
            style={{ width: msgWidth + (isOverflow ? 50 : 0) }}
          >
            <AlertArea id="alert-area" overflow={isOverflow}>
              <MsgMainCnt ref={msgCnt}>
                <span>{current.content}</span>
              </MsgMainCnt>
              {isOverflow && (
                <span style={{ marginRight: 50, marginLeft: 50 }}>{current.content}</span>
              )}
            </AlertArea>
          </AlertPosition>
        </AlertContainer>
        <AlertLog
          id="alert-log"
          ref={alertHistory}
          className="alert-log bp3-popover-content"
          toggle={showHistory}
          height={historyHeight}
          containerHeight={containerHeight}
          onClick={toggleHistory}
        >
          {history.map((h) => (
            <AlertLogContent
              key={h.ts}
              className={`bp3-callout bp3-intent-${h.type}`}
              data-ts={h.ts}
            >
              {h.content}
            </AlertLogContent>
          ))}
        </AlertLog>
      </AlertMain>
    </PoiAlertTag>
  )
}
