import { ResizeSensor } from '@blueprintjs/core'
import { range, debounce } from 'lodash'
import React, { useState, useMemo } from 'react'
import { styled } from 'styled-components'
import { Section } from 'views/components/settings/components/section'

const floor = (x: number) => Math.floor(x / 10) * 10

const Wrapper = styled.div`
  img {
    cursor: pointer;
  }
`

interface Props {
  ready?: boolean
}

export const OpenCollective = ({ ready }: Props) => {
  const [width, setWidth] = useState(0)

  const handleResize = useMemo(
    () =>
      debounce(([entry]: ResizeObserverEntry[]) => {
        setWidth(floor(entry.contentRect.width))
      }, 100),
    [],
  )

  return (
    <ResizeSensor onResize={handleResize}>
      <Section title="OpenCollective">
        <Wrapper>
          {ready && (
            <div className="opencollective">
              {range(10).map((i) => (
                <a href={`https://opencollective.com/poi/sponsor/${i}/website`} key={i}>
                  <img src={`https://opencollective.com/poi/sponsor/${i}/avatar.svg`} />
                </a>
              ))}
            </div>
          )}
          {ready && width > 0 && (
            <div>
              <a href="https://opencollective.com/poi#backers">
                <img src={`https://opencollective.com/poi/backers.svg?width=${width}`} />
              </a>
            </div>
          )}
        </Wrapper>
      </Section>
    </ResizeSensor>
  )
}
