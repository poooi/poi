/* global CONST */
import React from 'react'
import { map, memoize } from 'lodash'
import { shell } from 'electron'
import styled from 'styled-components'

import { Section } from 'views/components/settings/components/section'

const openLink = memoize((link) => () => shell.openExternal(link))

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`

const Item = styled.div`
  width: 50%;
  padding-left: 15px;
  padding-right: 15px;
  display: flex;
  align-items: center;
`

const Icon = styled.div`
  border-radius: 4px;
  height: 75px;
  width: 75px;
  overflow: hidden;

  img {
    cursor: pointer;
  }
`

const Detail = styled.div`
  flex: 1;
  padding-left: 5px;
`

export const ThanksTo = ({ ready }) => (
  <Section title="Thanks to">
    <Wrapper className="thanks-to">
      {map(CONST.thanksTo, (e) => (
        <Item key={e.name} className="thanks-to-item">
          <Icon className="thanks-to-img-container">
            {ready && (
              <img src={e.avatar} style={e.extraCSS} onClick={openLink(e.link)} title={e.name} />
            )}
          </Icon>
          <Detail className="thanks-to-container">
            <b>{e.name}</b>
            <p>{e.description}</p>
          </Detail>
        </Item>
      ))}
    </Wrapper>
  </Section>
)
