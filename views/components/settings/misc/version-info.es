import React from 'react'
import styled from 'styled-components'
import { map, capitalize } from 'lodash'

const { ROOT, POI_VERSION } = window

const Wrapper = styled.div`
  margin: 1em 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const PoiLogo = styled.img`
  max-width: 40%;

  :hover {
    filter: drop-shadow(0 0 1em rgba(255, 255, 255, 0.25));
  }
`

const PoiName = styled.span`
  font-weight: 900;
`

const Title = styled.span`
  font-size: 2em;
`

const Versions = styled.div`
  margin-left: 1em;
`

const VersionDetail = styled.div`
  margin-top: 1em;
  font-size: 0.8em;
`

const Entry = styled.span`
  font-weight: 600;
`

// FIXME: Eggs for April 1st, to remove in next version
const today = new Date()
const aprilFirst = today.getDate() === 1 && today.getMonth() === 3

export const VersionInfo = () => (
  <Wrapper>
    <PoiLogo src={`file://${ROOT}/assets/icons/poi.png`} />
    <Versions>
      <Title>
        <PoiName>{aprilFirst ? 'Chiba' : 'Poi'}</PoiName> {POI_VERSION}
      </Title>
      <VersionDetail>
        {map(['electron', 'chrome', 'node'], name => (
          <div key={name}>
            <Entry>{capitalize(name)}</Entry> {process.versions[name]}
          </div>
        ))}
        <div>
          <Entry>React.js</Entry> {React.version}
        </div>
      </VersionDetail>
    </Versions>
  </Wrapper>
)
