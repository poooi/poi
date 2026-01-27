import { compact } from 'lodash'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { styled } from 'styled-components'

interface ScrollShadowProps {
  children: React.ReactNode
  className?: string
}

interface ScrollShadowState {
  top: boolean
  bottom: boolean
}

const Container = styled.div<ScrollShadowState>`
  transition: 0.3s 0.1s;
  position: relative;
  box-shadow: ${({ top, bottom }) =>
    compact([
      top && 'inset 0 18px 15px -20px #217dbb',
      bottom && 'inset 0 -18px 15px -20px #217dbb;',
    ]).join(',')};
`

const TopSentinel = styled.div`
  position: relative;
  top: 4px;
`

const BottomSentinel = styled.div`
  position: relative;
  bottom: 4px;
`

interface ScrollShadowProps {
  children: React.ReactNode
  className?: string
}

const ScrollShadow: React.FC<ScrollShadowProps> = ({ children, className }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(true)
  const [bottom, setBottom] = useState(true)

  const handleIntersect = useCallback(
    (type: 'top' | 'bottom') =>
      ([entry]: IntersectionObserverEntry[]) => {
        if (
          (type === 'top' && top !== entry.isIntersecting) ||
          (type === 'bottom' && bottom !== entry.isIntersecting)
        ) {
          if (type === 'top') {
            setTop(entry.isIntersecting)
          } else {
            setBottom(entry.isIntersecting)
          }
        }
      },
    [top, bottom],
  )

  useEffect(() => {
    if (!rootRef.current || !topSentinelRef.current || !bottomSentinelRef.current) {
      return
    }

    const options = {
      root: rootRef.current,
    }
    const topObserver = new IntersectionObserver(handleIntersect('top'), options)
    const bottomObserver = new IntersectionObserver(handleIntersect('bottom'), options)

    topObserver.observe(topSentinelRef.current)
    bottomObserver.observe(bottomSentinelRef.current)

    return () => {
      topObserver.disconnect()
      bottomObserver.disconnect()
    }
  }, [handleIntersect])

  return (
    <Container className={className} top={!top} bottom={!bottom} ref={rootRef}>
      <TopSentinel ref={topSentinelRef} />
      {children}
      <BottomSentinel ref={bottomSentinelRef} />
    </Container>
  )
}

export default ScrollShadow
