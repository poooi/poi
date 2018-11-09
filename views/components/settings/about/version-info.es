import React from 'react'
import styled from 'styled-components'
import { map, capitalize, memoize, size } from 'lodash'
import { translate } from 'react-i18next'
import { Card, Tooltip, AnchorButton, Intent } from '@blueprintjs/core'
import { shell } from 'electron'
import FA from 'react-fontawesome'

const { ROOT, POI_VERSION } = window

const Wrapper = styled.div`
  margin-bottom: 1em;
  display: flex;
  justify-content: center;
  align-items: center;
`

const PoiLogo = styled.img`
  max-width: 40%;
  transition: 0.3s;

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

const LinksArea = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1em;

  a {
    width: 3em;
  }
`

const LINKS = [
  {
    icon: 'weibo',
    name: 'Weibo',
    language: ['zh-CN', 'zh-TW'],
    href: 'http://weibo.com/letspoi',
  },
  {
    icon: 'qq',
    name: 'QQ Group 378320628',
    language: ['zh-CN', 'zh-TW'],
    href: 'https://jq.qq.com/?_wv=1027&k=5MRX31j',
  },
  {
    icon: 'discord',
    name: 'Discord channel',
    language: ['en-US'],
    href: 'https://discordapp.com/channels/118339803660943369/367575898313981952',
  },
  {
    icon: 'database',
    name: 'Database',
    href: 'http://db.kcwiki.org',
  },
  {
    icon: 'question',
    name: 'Wiki',
    href: 'https://github.com/poooi/poi/wiki',
  },
  {
    icon: 'github',
    name: 'GitHub',
    href: 'https://github.com/poooi/poi',
  },
]

const openLink = memoize(link => () => shell.openExternal(link))

// FIXME: Eggs for April 1st, to remove in next version
const today = new Date()
const aprilFirst = today.getDate() === 1 && today.getMonth() === 3

export const VersionInfo = translate(['setting'])(({ t }) => (
  <Card>
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
    <div>
      <div>{t('description_markdown')}</div>
      <LinksArea>
        {map(
          LINKS,
          ({ icon, name, language, href }) =>
            (!size(language) || language.includes(window.language)) && (
              <Tooltip key={icon} content={t(name)}>
                <AnchorButton minimal intent={Intent.PRIMARY} onClick={openLink(href)}>
                  <FA name={icon} />
                </AnchorButton>
              </Tooltip>
            ),
        )}
      </LinksArea>
    </div>
  </Card>
))
