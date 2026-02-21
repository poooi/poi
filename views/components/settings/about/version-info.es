import { Tooltip, AnchorButton, Intent } from '@blueprintjs/core'
import { FontAwesomeIcon as FA } from '@fortawesome/react-fontawesome'
import { shell } from 'electron'
import { map, capitalize, memoize, size, throttle, isString, toUpper } from 'lodash'
import osName from 'os-name'
/* global ROOT, POI_VERSION, LATEST_COMMIT */
import React from 'react'
import { withNamespaces } from 'react-i18next'
import { styled } from 'styled-components'

import { Section } from '../components/section'

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
    filter: drop-shadow(0 0 1em rgb(255 255 255 / 0.25));
  }

  :active {
    filter: drop-shadow(0 0 1em rgb(255 255 255 / 0.75));
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
    icon: ['fab', 'weibo'],
    name: 'Weibo',
    language: ['zh-CN', 'zh-TW'],
    href: 'http://weibo.com/letspoi',
  },
  {
    icon: ['fab', 'qq'],
    name: 'QQ Group 378320628',
    language: ['zh-CN', 'zh-TW'],
    href: 'https://jq.qq.com/?_wv=1027&k=5MRX31j',
  },
  {
    icon: ['fab', 'discord'],
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
    icon: ['fab', 'github'],
    name: 'GitHub',
    href: 'https://github.com/poooi/poi',
  },
]

const openLink = memoize((link) => () => shell.openExternal(link))

const audio = new Audio(`file://${ROOT}/assets/audio/about.mp3`)
const playPoiAudio = throttle(() => audio.play(), 3000, { trailing: false })

const os = do {
  try {
    osName()
  } catch (_) {
    switch (process.platform) {
      case 'win32': {
        ;('Windows')
        break
      }
      case 'darwin': {
        ;('macOS')
        break
      }
      default: {
        ;('Linux')
      }
    }
  }
}

// FIXME: Eggs for April 1st, to remove in next version
const today = new Date()
const aprilFirst = today.getDate() === 1 && today.getMonth() === 3

export const VersionInfo = withNamespaces(['setting'])(({ t }) => (
  <Section>
    <Wrapper>
      <PoiLogo src={`file://${ROOT}/assets/icons/poi.png`} onClick={playPoiAudio} />
      <Versions>
        <Title>
          <PoiName>{aprilFirst ? 'chiba' : 'poi'}</PoiName> {POI_VERSION}
        </Title>
        <VersionDetail>
          <div>
            {isString(LATEST_COMMIT) ? (
              <>
                <Entry>Build</Entry> {toUpper(LATEST_COMMIT.substring(0, 8))}
              </>
            ) : (
              <Entry>DEV</Entry>
            )}
          </div>
          <div>
            <Entry>OS</Entry> {os}
          </div>
          {map(['electron', 'chrome', 'node'], (name) => (
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
              <Tooltip key={name} content={t(name)}>
                <AnchorButton minimal intent={Intent.PRIMARY} onClick={openLink(href)}>
                  <FA icon={icon} />
                </AnchorButton>
              </Tooltip>
            ),
        )}
      </LinksArea>
    </div>
  </Section>
))
