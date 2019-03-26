import React from 'react'
import { map, memoize } from 'lodash'
import CONTRIBUTORS from 'poi-asset-contributor-data/dist/contributors.json'
import { shell } from 'electron'
import styled from 'styled-components'

import { Section } from 'views/components/settings/components/section'

const getAvatarUrl = url => (/.*githubusercontent.com\/u\/.*/.test(url) ? `${url}&s=160` : url)

const openLink = memoize(link => () => shell.openExternal(link))

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const Avatar = styled.div`
  margin: 5px;
  border-radius: 50%;
  height: 40px;
  width: 40px;
  transition: 0.3s;
  overflow: hidden;

  img {
    width: 100%;
    cursor: pointer;
  }

  :hover {
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.25));
  }
`

export const Contributors = ({ ready }) => (
  <Section title="Contributors">
    <Wrapper className="contributors">
      {ready &&
        map(CONTRIBUTORS, (e, i) => (
          <Avatar key={e.name || e.login} className="contributor-item">
            <img
              src={getAvatarUrl(e.avatar_url)}
              onClick={openLink(e.html_url)}
              title={e.name || e.login}
            />
          </Avatar>
        ))}
    </Wrapper>
  </Section>
)
