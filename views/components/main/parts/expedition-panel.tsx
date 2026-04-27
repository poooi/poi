import type { RootState } from 'views/redux/reducer-factory'

import { Position, Intent, Tooltip } from '@blueprintjs/core'
import { join as joinString, map, get, range, isEqual, compact } from 'lodash'
import path from 'path'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { css, styled } from 'styled-components'
import i18next from 'views/env-parts/i18next'
import {
  fleetsSelector,
  fleetShipsDataSelectorFactory,
  fleetInBattleSelectorFactory,
} from 'views/utils/selectors'
import { timeToString } from 'views/utils/tools'

import { CountdownNotifierLabel } from './countdown-timer'
import { CardWrapper } from './styled-components'

export const ExpeditionItem = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  padding: 4px;
`

export const ExpeditionName = styled.span<{ warning?: boolean; success?: boolean }>`
  flex: 1;
  margin-right: auto;
  overflow: hidden;
  padding-right: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${({ warning, success }) =>
    warning
      ? css`
          color: #f39c12;
        `
      : success &&
        css`
          color: #00bc8c;
        `}
`

const fleetsExpeditionSelector = createSelector(fleetsSelector, (fleets) =>
  compact(map(fleets, 'api_mission')),
)
const fleetsNamesSelector = createSelector(fleetsSelector, (fleets) =>
  compact(map(fleets, 'api_name')),
)

const FleetStatus = ({ fleetId }: { fleetId: number }) => {
  const { t } = useTranslation('main')
  const fleetShipsData = useSelector((state: RootState) =>
    fleetShipsDataSelectorFactory(fleetId)(state),
  )
  const fleetInBattle = useSelector((state: RootState) =>
    fleetInBattleSelectorFactory(fleetId)(state),
  )

  if (fleetInBattle) {
    return (
      <ExpeditionName className="expedition-name" success>
        {t('main:In Sortie')}
      </ExpeditionName>
    )
  }

  const notSuppliedShips = (fleetShipsData ?? []).filter((entry) => {
    const [ship, $ship] = entry ?? []
    if (!ship || !$ship) return false
    return (
      Math.min(
        ship.api_fuel / ($ship?.api_fuel_max ?? 1),
        ship.api_bull / ($ship?.api_bull_max ?? 1),
      ) < 1
    )
  })

  if (notSuppliedShips.length) {
    return (
      <ExpeditionName className="expedition-name" warning>
        {t('main:Resupply Needed')}
      </ExpeditionName>
    )
  }

  return <ExpeditionName className="expedition-name">{t('main:Ready')}</ExpeditionName>
}

const getTagIntent = (_props: unknown, timeRemaining: number): Intent =>
  timeRemaining > 600
    ? Intent.PRIMARY
    : timeRemaining > 60
      ? Intent.WARNING
      : timeRemaining >= 0
        ? Intent.SUCCESS
        : Intent.NONE

const isActive = () => window.getStore('ui.activeMainTab') === 'main-view'

const basicNotifyConfig = {
  type: 'expedition',
  title: i18next.t('main:Expedition'),
  message: (names: string) => `${joinString(names, ', ')} ${i18next.t('main:mission complete')}`,
  icon: path.join(ROOT, 'assets', 'img', 'operation', 'expedition.png'),
}

interface ExpeditionPanelProps {
  fleetsExpedition: Array<[number, number, number] | undefined>
  fleetNames: string[]
  $expeditions: Record<number, { api_disp_no?: string; api_name?: string }>
  canNotify: boolean
  notifyBefore: number
  editable?: boolean
}

const ExpeditionPanelInner = memo(
  (props: ExpeditionPanelProps) => <ExpeditionPanelContent {...props} />,
  isEqual,
)
ExpeditionPanelInner.displayName = 'ExpeditionPanelInner'

const ExpeditionPanelContent = ({
  fleetsExpedition,
  fleetNames,
  $expeditions,
  canNotify,
  notifyBefore,
  editable,
}: ExpeditionPanelProps) => {
  const { t } = useTranslation('main')
  return (
    <CardWrapper elevation={editable ? 2 : 0} interactive={editable}>
      {range(1, 4).map((i) => {
        const [status, expeditionId, rawCompleteTime] = fleetsExpedition[i] ?? [-1, 0, -1]
        const fleetName = get(fleetNames, i, '???') as string
        const expedition = get($expeditions, expeditionId, {}) as {
          api_disp_no?: string
          api_name?: string
        }
        const { api_disp_no, api_name } = expedition
        const expeditionName =
          status === -1
            ? t('main:Locked')
            : `${api_disp_no ?? '???'} - ${api_name ? t(`resources:${api_name}`) : '???'}`
        const completeTime = status > 0 ? rawCompleteTime : -1

        return (
          <ExpeditionItem className="panel-item expedition-item" key={i}>
            {status === 0 ? (
              <FleetStatus fleetId={i} />
            ) : (
              <ExpeditionName className="expedition-name">{expeditionName}</ExpeditionName>
            )}
            <Tooltip
              position={Position.LEFT}
              disabled={completeTime < 0}
              content={
                <>
                  <strong>{t('main:Return By')}: </strong>
                  {timeToString(completeTime)}
                </>
              }
            >
              <CountdownNotifierLabel
                timerKey={`expedition-${i + 1}`}
                completeTime={completeTime}
                getLabelStyle={getTagIntent}
                getNotifyOptions={() =>
                  canNotify && completeTime >= 0
                    ? {
                        ...basicNotifyConfig,
                        args: fleetName,
                        completeTime,
                        preemptTime: notifyBefore,
                      }
                    : undefined
                }
                isActive={isActive}
              />
            </Tooltip>
          </ExpeditionItem>
        )
      })}
    </CardWrapper>
  )
}

export const ExpeditionPanel = ({ editable }: { editable?: boolean }) => {
  const fleetsExpedition = useSelector((state: RootState) => fleetsExpeditionSelector(state))
  const fleetNames = useSelector((state: RootState) => fleetsNamesSelector(state))
  const $expeditions = useSelector((state: RootState) => state.const.$missions ?? [])
  const notifyBefore = useSelector(
    (state: RootState) => state.config?.poi.notify.expedition.value ?? 60,
  )
  const canNotify = useSelector(
    (state: RootState) => (state.misc as { canNotify?: boolean }).canNotify ?? false,
  )

  return (
    <ExpeditionPanelInner
      fleetsExpedition={fleetsExpedition}
      fleetNames={fleetNames}
      $expeditions={$expeditions}
      canNotify={canNotify}
      notifyBefore={notifyBefore}
      editable={editable}
    />
  )
}
