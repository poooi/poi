import React, { useState, useRef, useEffect, useCallback } from 'react'
import { styled } from 'styled-components'

import { VersionInfo } from './version-info'
import { AppMetrics } from './app-metrics'
import { OpenCollective } from './open-collective'
import { GPUStatus } from './gpu-status'
import { Update } from './update'
import { Contributors } from './contributors'
import { ThanksTo } from './thanks-to'

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
