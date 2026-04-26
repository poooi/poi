import { Switch, Slider, FormGroup, Callout } from '@blueprintjs/core'
import { get, map, capitalize } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { Section, Wrapper, HalfWrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

const InlineFormGroup = styled(FormGroup)`
  .bp5-form-content {
    display: flex;
    align-items: center;
  }
`
const EndLabel = styled.div`
  margin-left: 8px;
`
const SwitchWithMargin = styled(Switch)`
  margin-right: 8px;
`

type ConfigState = { config: Record<string, unknown> }

const NOTIFY_TYPES = [
  'construction',
  'expedition',
  'repair',
  'morale',
  'battleEnd',
  'others',
] as const
type NotifyType = (typeof NOTIFY_TYPES)[number]

export const NotificationConfig = () => {
  const { t } = useTranslation('setting')
  const enabled = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.enabled', true)),
  )
  const expedition = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.expedition.enabled', true)),
  )
  const construction = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.construction.enabled', true)),
  )
  const battleEnd = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.battleEnd.enabled', true)),
  )
  const repair = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.repair.enabled', true)),
  )
  const morale = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.morale.enabled', true)),
  )
  const others = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.others.enabled', true)),
  )
  const volume = Number(
    useSelector((state: ConfigState) => get(state.config, 'poi.notify.volume', 0.8)),
  )

  const notifyValues: Record<NotifyType, boolean> = {
    construction,
    expedition,
    repair,
    morale,
    battleEnd,
    others,
  }

  const handleSetNotify = (notifyPath: NotifyType | null) => () => {
    if (!notifyPath) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      config.set('poi.notify.enabled' as never, !enabled as never)
    } else {
      config.set(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        `poi.notify.${notifyPath}.enabled` as never,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        !notifyValues[notifyPath] as never,
      )
    }
  }

  const handleChangeNotifyVolume = (vol: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set('poi.notify.volume' as never, vol as never)
  }

  const handleEndChangeNotifyVolume = () => {
    window.notify(null)
  }

  return (
    <Section title={t('Notification')}>
      <Wrapper>
        <HalfWrapper>
          <FormGroup inline>
            <Switch checked={enabled} onChange={handleSetNotify(null)}>
              {t('Enable notification')}
            </Switch>
          </FormGroup>
        </HalfWrapper>

        <HalfWrapper>
          <FormGroup inline label={t('Volume')}>
            <Slider
              disabled={!enabled}
              onChange={handleChangeNotifyVolume}
              onRelease={handleEndChangeNotifyVolume}
              min={0.0}
              max={1.0}
              stepSize={0.05}
              labelRenderer={(value) => `${Math.round(value * 100)}%`}
              value={volume}
            />
          </FormGroup>
        </HalfWrapper>

        <FormGroup inline label={t('Type')}>
          <Wrapper>
            {map(NOTIFY_TYPES, (type) => (
              <SwitchWithMargin
                key={type}
                disabled={!enabled}
                checked={notifyValues[type]}
                onChange={handleSetNotify(type)}
              >
                {t(capitalize(type))}
              </SwitchWithMargin>
            ))}
          </Wrapper>
          {enabled && (
            <Callout>{t('Heavily damaged notification is managed by Prophet plugin')}</Callout>
          )}
        </FormGroup>

        <Wrapper>
          <InlineFormGroup inline label={t('Notify when expedition returns in')}>
            <IntegerConfig
              clampValueOnBlur
              min={0}
              max={7200}
              configName="poi.notify.expedition.value"
              defaultValue={60}
              disabled={!enabled || !expedition}
            />
            <EndLabel>{t('main:s')}</EndLabel>
          </InlineFormGroup>
        </Wrapper>

        <Wrapper>
          <FormGroup inline label={t('Notify when morale is greater than')}>
            <IntegerConfig
              clampValueOnBlur
              min={0}
              max={49}
              configName="poi.notify.morale.value"
              defaultValue={49}
              disabled={!enabled || !morale}
            />
          </FormGroup>
        </Wrapper>
      </Wrapper>
      <FormGroup inline label={t('Battleend')}>
        <Wrapper>
          <SwitchConfig
            label={t('Notify only when not focused')}
            configName="poi.notify.battleEnd.onlyBackground"
            defaultValue={true}
            disabled={!battleEnd}
          />
          <SwitchConfig
            label={t('Notify only when muted')}
            configName="poi.notify.battleEnd.onlyMuted"
            defaultValue={true}
            disabled={!battleEnd}
          />
        </Wrapper>
      </FormGroup>
    </Section>
  )
}
