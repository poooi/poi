import type { MouseEvent } from 'react'

import { Button, Intent } from '@blueprintjs/core'
import { shell } from 'electron'
import { memoize } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { styled } from 'styled-components'
import { Section } from 'views/components/settings/components/section'

import type { Contributor } from './contributors-manifest'

import { CONTRIBUTOR_AVATAR_SIZE, loadContributors } from './contributors-manifest'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const openLink = memoize((link: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
  void shell.openExternal(link)
})

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`

const Avatar = styled.div`
  margin: 5px;
  border-radius: 50%;
  height: ${CONTRIBUTOR_AVATAR_SIZE}px;
  width: ${CONTRIBUTOR_AVATAR_SIZE}px;
  transition: 0.3s;
  overflow: hidden;

  a,
  > span {
    display: block;
    height: 100%;
  }

  a {
    cursor: pointer;
  }

  :hover {
    filter: drop-shadow(0 0 4px rgb(255 255 255 / 0.25));
  }
`

const Sprite = styled.div`
  height: 100%;
  background-repeat: no-repeat;
`

const Initial = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.25em;
  background-color: rgb(255 255 255 / 0.1);
`

const StatusText = styled.span`
  margin-right: 5px;
`

const ErrorArea = styled.div`
  display: flex;
  align-items: center;
`

const renderAvatar = (contributor: Contributor) =>
  contributor.avatar ? (
    <Sprite
      className="contributor-avatar-sprite"
      style={{
        backgroundImage: `url("${contributor.avatar.url}")`,
        backgroundSize: `${contributor.avatar.sheetWidth}px ${contributor.avatar.sheetHeight}px`,
        backgroundPosition: `-${contributor.avatar.offsetX}px -${contributor.avatar.offsetY}px`,
      }}
    />
  ) : (
    <Initial aria-hidden="true">{contributor.label.slice(0, 1).toUpperCase()}</Initial>
  )

interface Props {
  ready?: boolean
}

export const Contributors = ({ ready }: Props) => {
  const { t } = useTranslation('setting')
  const [contributors, setContributors] = useState<Contributor[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!ready) return undefined

    const controller = new AbortController()
    let active = true

    loadContributors(controller.signal)
      .then((data) => {
        if (!active) return
        setContributors(data)
        setFailed(false)
      })
      .catch(() => {
        if (!active) return
        setFailed(true)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [ready, reloadKey])

  const retry = useCallback(() => {
    setContributors(null)
    setFailed(false)
    setReloadKey((key) => key + 1)
  }, [])

  let status: Status = 'idle'
  if (ready) {
    if (failed) status = 'error'
    else if (contributors) status = 'ready'
    else status = 'loading'
  }

  return (
    <Section title="Contributors">
      <Wrapper className="contributors">
        {ready && status === 'loading' && (
          <StatusText className="contributors-loading">{t('contributors-loading')}</StatusText>
        )}
        {ready && status === 'error' && (
          <ErrorArea className="contributors-error">
            <StatusText>{t('contributors-error')}</StatusText>
            <Button minimal intent={Intent.PRIMARY} onClick={retry}>
              {t('contributors-retry')}
            </Button>
          </ErrorArea>
        )}
        {ready &&
          status === 'ready' &&
          contributors?.map((contributor) => (
            <Avatar key={contributor.id} className="contributor-item">
              {contributor.profile ? (
                <a
                  href={contributor.profile}
                  title={contributor.label}
                  aria-label={contributor.label}
                  onClick={openLink(contributor.profile)}
                >
                  {renderAvatar(contributor)}
                </a>
              ) : (
                <span title={contributor.label} aria-label={contributor.label}>
                  {renderAvatar(contributor)}
                </span>
              )}
            </Avatar>
          ))}
      </Wrapper>
    </Section>
  )
}
