import React, { useState, useRef, useEffect, useCallback } from 'react'
import { styled } from 'styled-components'

import { AppMetrics } from './app-metrics'
import { Contributors } from './contributors'
import { GPUStatus } from './gpu-status'
import { OpenCollective } from './open-collective'
import { ThanksTo } from './thanks-to'
import { Update } from './update'
import { VersionInfo } from './version-info'

const TopSentinel = styled.div`
  position: relative;
  top: 4px;
`

export const About = () => {
  const [ready, setReady] = useState(false)

  const sentinel = useRef(null)
  const observer = useRef(null)

  const handleIntersection = useCallback(
    ([entry]) => {
      if (entry.isIntersecting) {
        setReady(true)
        observer.current.disconnect()
      }
    },
    [setReady, observer],
  )

  useEffect(() => {
    observer.current = new IntersectionObserver(handleIntersection)
    observer.current.observe(sentinel.current)

    return () => observer.current.disconnect()
  }, [handleIntersection])

  return (
    <div>
      <TopSentinel ref={sentinel} />
      <VersionInfo />
      <Update />
      <GPUStatus />
      <AppMetrics />
      <OpenCollective ready={ready} />
      <Contributors ready={ready} />
      <ThanksTo ready={ready} />
    </div>
  )
}
