import type { RootState } from 'views/redux/reducer-factory'

import { ResizeSensor } from '@blueprintjs/core'
import { isEqual, range } from 'lodash-es'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'
import { MaterialIcon } from 'views/components/etc/icon'

import { CardWrapper as CardWrapperL } from './styled-components'

const CardWrapper = styled(CardWrapperL)`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 1px;
  padding-top: 1px;
`

const MaterialContainer = styled.div<{ dimension: number }>`
  display: flex;
  margin-bottom: 2px;
  margin-top: 1px;
  padding: 0;
  justify-content: flex-end;
  ${({ dimension }) =>
    dimension === 1
      ? css`
          flex-basis: 75px;
        `
      : css`
          flex-basis: ${100 / dimension}%;
        `}
`

const MaterialIconGlow = styled(MaterialIcon)<{ glow?: boolean }>`
  height: 18px;
  width: 18px;
  ${({ glow }) =>
    glow &&
    css`
      filter: drop-shadow(0 0 4px #2196f3);
    `}
`

const MaterialValue = styled.div`
  line-height: 1.5;
  min-width: max-content;
  width: calc(100% - 42px);
  position: relative;
`

const MaterialAmount = styled.div`
  min-width: 5em;
  width: 100%;
  height: 100%;
  padding-left: 4px;
  padding-right: 12px;
`

const AdditionalValue = styled.div<{ inc?: boolean; dec?: boolean }>`
  position: absolute;
  top: 0;
  left: 4px;
  right: 12px;
  height: 100%;
  padding-left: 4px;
  padding-right: 8px;
  color: white;
  opacity: 0;
  text-align: right;
  transition: all 0.3s;
  z-index: 1;
  min-width: 4em;
  ${({ inc, dec }) =>
    inc
      ? css`
          background-color: #217dbb;
          opacity: 1;
        `
      : dec &&
        css`
          background-color: #d62c1a;
          opacity: 1;
        `}
`

const order = [0, 2, 1, 3, 4, 6, 5, 7]

const getPanelDimension = (width: number): number => {
  if (width < 150) return 1
  if (width > 700) return 8
  if (width > 350) return 4
  return 2
}

interface ResourcePanelInnerProps {
  resources: number[]
  admiralLv: number
  editable?: boolean
}

const ResourcePanelInner = ({ resources, admiralLv, editable }: ResourcePanelInnerProps) => {
  const animTimeStamp = useRef([0, 0, 0, 0, 0, 0, 0, 0])
  const [resourceIncrement, setResourceIncrement] = useState([0, 0, 0, 0, 0, 0, 0, 0])
  const [dimension, setDimension] = useState(2)
  const prevResourcesRef = useRef(resources)

  const checkAnimTime = useCallback(() => {
    const ts = Date.now()
    setResourceIncrement((prev) => {
      const next = [...prev]
      let changed = false
      for (let i = 0; i < next.length; i++) {
        if (animTimeStamp.current[i] < ts && next[i] !== 0) {
          next[i] = 0
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(checkAnimTime, 1000)
    return () => clearInterval(timer)
  }, [checkAnimTime])

  useEffect(() => {
    const prevResources = prevResourcesRef.current
    prevResourcesRef.current = resources
    if (isEqual(prevResources, resources)) return
    setResourceIncrement((prev) => {
      const next = resources.map((val, i) => val - (prevResources[i] ?? 0))
      for (let i = 0; i < next.length; i++) {
        if (next[i] !== 0) animTimeStamp.current[i] = Date.now() + 2500
        next[i] += prev[i]
      }
      return next
    })
  }, [resources])

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const dim = getPanelDimension(entries[0].contentRect.width)
    setDimension((prev) => (dim !== prev ? dim : prev))
  }, [])

  const valid = !!admiralLv
  const limit = 750 + admiralLv * 250
  return (
    <ResizeSensor onResize={handleResize}>
      <CardWrapper elevation={editable ? 2 : 0} interactive={editable}>
        {(dimension === 2 ? order : range(8)).map((i) => (
          <MaterialContainer key={i} className="material-container" dimension={dimension}>
            <MaterialIconGlow
              materialId={i + 1}
              className="material-icon"
              glow={valid && i < 4 && resources[i] < limit}
            />
            <MaterialValue className="material-value">
              <MaterialAmount className="material-amount">
                {valid ? resources[i] : '??'}
              </MaterialAmount>
              <AdditionalValue
                className="additional-value"
                inc={resourceIncrement[i] > 0}
                dec={resourceIncrement[i] < 0}
              >
                {resourceIncrement[i] > 0 && '+'}
                {resourceIncrement[i] !== 0 && resourceIncrement[i]}
              </AdditionalValue>
            </MaterialValue>
          </MaterialContainer>
        ))}
      </CardWrapper>
    </ResizeSensor>
  )
}

export const ResourcePanel = ({ editable }: { editable?: boolean }) => {
  const resources = useSelector(
    (state: RootState) => state?.info?.resources ?? [0, 0, 0, 0, 0, 0, 0, 0],
  )
  const admiralLv = useSelector((state: RootState) => state?.info?.basic?.api_level ?? 0)
  return <ResourcePanelInner resources={resources} admiralLv={admiralLv} editable={editable} />
}
