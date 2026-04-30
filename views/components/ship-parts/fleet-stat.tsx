import type { RootState } from 'views/redux/reducer-factory'
import type { CountdownNotifyOptions } from 'views/utils/notifiers'

import { Position, Tooltip } from '@blueprintjs/core'
import { join as joinString, memoize } from 'lodash'
import path from 'path'
import React, { memo, useCallback, useId, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { styled } from 'styled-components'
import {
  InfoTooltip,
  InfoTooltipEntry,
  InfoTooltipItem,
} from 'views/components/etc/styled-components'
import { CountdownTimer } from 'views/components/main/parts/countdown-timer'
import { getStore } from 'views/create-store'
import { ROOT } from 'views/env'
import i18next from 'views/env-parts/i18next'
import { recoveryEndTime } from 'views/redux/timers/cond'
import { getFleetSpeed, getSaku33, getSpeedLabel, getTyku } from 'views/utils/game-utils'
import { CountdownNotifier } from 'views/utils/notifiers'
import {
  basicSelector,
  condTickSelector,
  configSelector,
  fleetExpeditionSelectorFactory,
  fleetInBattleSelectorFactory,
  fleetInExpeditionSelectorFactory,
  fleetNameSelectorFactory,
  fleetShipsDataSelectorFactory,
  fleetShipsDataWithEscapeSelectorFactory,
  fleetShipsEquipDataWithEscapeSelectorFactory,
  fleetSlotCountSelectorFactory,
  miscSelector,
} from 'views/utils/selectors'

const isActive = () =>
  ['ship-view', 'main-view'].includes(String(getStore('ui.activeMainTab') ?? ''))

const FleetStats = styled.div`
  white-space: nowrap;
  margin-top: 5px;
  text-align: center;
  width: 100%;
`

const Container = styled.div`
  display: flex;
`

const MiniContainer = styled(Container)`
  width: 100%;
  justify-content: space-around;
`

const MiniItem = styled.span`
  flex: 0;
  margin-left: 5px;

  &:first-child {
    margin-left: 0;
  }
`

const ReconTile = styled.span`
  font-size: 110%;
  font-weight: bold;
  text-align: left;

  &:not(:first-child) {
    margin-top: 0.5em;
  }
`

const ItemContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const ItemLabel = styled.div`
  font-size: 80%;
`

const Item = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <ItemContainer>
    <ItemLabel>{label}</ItemLabel>
    <div>{children}</div>
  </ItemContainer>
)

interface CountdownLabelProps {
  fleetId: string
  completeTime: number
  shouldNotify: boolean
  fleetName: string
}

const basicNotifyConfig: CountdownNotifyOptions<string> = {
  type: 'morale',
  title: i18next.t('main:Morale'),
  message: (names: string | string[]) =>
    `${names} ${i18next.t('main:have recovered from fatigue')}`,
  icon: path.join(ROOT, 'assets', 'img', 'operation', 'sortie.png'),
}

const CountdownLabel = memo(
  ({ fleetId, completeTime, shouldNotify, fleetName }: CountdownLabelProps) => {
    const notifier = useRef(new CountdownNotifier())
    const propsRef = useRef({ shouldNotify, completeTime, fleetName })
    propsRef.current = { shouldNotify, completeTime, fleetName }

    const tick = useCallback(() => {
      const { shouldNotify: sn, completeTime: ct, fleetName: fn } = propsRef.current
      if (sn && ct >= 0) {
        notifier.current.tryNotify({ ...basicNotifyConfig, args: fn, completeTime: ct })
      }
    }, [])

    return (
      <span className="expedition-timer">
        <CountdownTimer
          isActive={isActive}
          countdownId={`resting-fleet-${fleetId}`}
          completeTime={completeTime}
          tickCallback={tick}
        />
      </span>
    )
  },
  (prev, next) => prev.completeTime === next.completeTime,
)
CountdownLabel.displayName = 'CountdownLabel'

const tykuSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetShipsEquipDataWithEscapeSelectorFactory(fleetId), (equipsData = []) =>
    getTyku(equipsData),
  ),
)

const admiralLevelSelector = createSelector(basicSelector, (basic) => basic?.api_level ?? 1)

const sakuSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [
      fleetShipsDataWithEscapeSelectorFactory(fleetId),
      fleetShipsEquipDataWithEscapeSelectorFactory(fleetId),
      admiralLevelSelector,
      fleetSlotCountSelectorFactory(fleetId),
    ],
    (shipsData = [], equipsData = [], admiralLevel, slotCount) => ({
      saku33: getSaku33(shipsData, equipsData, admiralLevel, 1.0, slotCount),
      saku33x2: getSaku33(shipsData, equipsData, admiralLevel, 2.0, slotCount),
      saku33x3: getSaku33(shipsData, equipsData, admiralLevel, 3.0, slotCount),
      saku33x4: getSaku33(shipsData, equipsData, admiralLevel, 4.0, slotCount),
    }),
  ),
)

const speedSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetShipsDataWithEscapeSelectorFactory(fleetId), (shipsData = []) =>
    getFleetSpeed(shipsData),
  ),
)

const fleetStatSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [
      fleetInBattleSelectorFactory(fleetId),
      fleetInExpeditionSelectorFactory(fleetId),
      fleetShipsDataSelectorFactory(fleetId),
      fleetNameSelectorFactory(fleetId),
      condTickSelector,
      fleetExpeditionSelectorFactory(fleetId),
      tykuSelectorFactory(fleetId),
      sakuSelectorFactory(fleetId),
      speedSelectorFactory(fleetId),
      configSelector,
      miscSelector,
    ],
    (
      inBattle,
      inExpedition,
      shipsData,
      fleetName,
      condTick,
      expedition,
      tyku,
      saku,
      fleetSpeed,
      cfg,
      { canNotify },
    ) => ({
      inExpedition,
      inBattle,
      shipsData,
      fleetName,
      condTick,
      expeditionEndTime: expedition[2] as number | undefined,
      tyku,
      saku,
      fleetSpeed,
      condTarget: cfg?.poi?.notify?.morale?.value ?? 49,
      canNotify,
    }),
  ),
)

interface FleetStatProps {
  fleetId: number
  isMini?: boolean
  isMainView?: boolean
}

export const FleetStat = memo(({ fleetId, isMini, isMainView = false }: FleetStatProps) => {
  const { t } = useTranslation('main')
  const selector = useMemo(() => fleetStatSelectorFactory(fleetId), [fleetId])
  const {
    inExpedition,
    inBattle,
    shipsData = [],
    fleetName,
    condTick,
    expeditionEndTime,
    tyku,
    saku,
    fleetSpeed,
    condTarget,
    canNotify,
  } = useSelector((state: RootState) => selector(state))

  const { saku33, saku33x2, saku33x3, saku33x4 } = saku
  const { speed } = fleetSpeed

  let totalLv = 0
  let minCond = 100
  let totalFP = 0
  let totalASW = 0
  let totalLoS = 0
  let totalAA = 0

  shipsData.forEach((shipData) => {
    const _ship = shipData?.[0]
    if (_ship) {
      totalLv += _ship.api_lv ?? 0
      minCond = Math.min(minCond, _ship.api_cond ?? minCond)
      totalFP += _ship.api_karyoku?.[0] ?? 0
      totalASW += _ship.api_taisen?.[0] ?? 0
      totalLoS += _ship.api_sakuteki?.[0] ?? 0
      totalAA += _ship.api_taiku?.[0] ?? 0
    }
  })

  void minCond

  let completeTime: number
  if (inExpedition) {
    completeTime = expeditionEndTime ?? -1
  } else {
    const conds = shipsData.map((shipData) => shipData?.[0]?.api_cond ?? 0)
    completeTime = Math.max(...conds.map((cond) => recoveryEndTime(condTick, cond, condTarget)))
  }

  const timerId = useId()

  return (
    <FleetStats className="fleet-stat">
      {isMini ? (
        <MiniContainer>
          <MiniItem>{t(`main:${getSpeedLabel(speed)}`)}</MiniItem>
          <MiniItem>
            {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : `${tyku.min}+`}
          </MiniItem>
          <MiniItem>
            {t('main:LOS')}: {saku33.total.toFixed(2)}
          </MiniItem>
        </MiniContainer>
      ) : (
        <Container>
          <Item label={t('data:Speed')}>{t(`main:${getSpeedLabel(speed)}`)}</Item>
          <Item label={t('data:Lv')}>{totalLv}</Item>
          <Item label={t('data:FP')}>{totalFP}</Item>
          <Item label={t('data:ASW')}>{totalASW}</Item>
          <Item label={t('data:AA')}>{totalAA}</Item>
          <Item label={t('main:Fighter Power')}>
            <Tooltip
              position={Position.BOTTOM}
              content={
                <div>
                  <div>
                    {t('main:Minimum FP')}: {tyku.min}
                  </div>
                  <div>
                    {t('main:Maximum FP')}: {tyku.max}
                  </div>
                  <div>
                    {t('main:Basic FP')}: {tyku.basic}
                  </div>
                </div>
              }
            >
              <span>{tyku.max === tyku.min ? tyku.min : `${tyku.min}+`}</span>
            </Tooltip>
          </Item>
          <Item label={t('main:LOS')}>
            <Tooltip
              position={Position.BOTTOM}
              content={
                <InfoTooltip className="info-tooltip">
                  <ReconTile className="recon-title">
                    <span>{t('main:Total')}</span>
                  </ReconTile>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item" />
                    <span>{totalLoS}</span>
                  </InfoTooltipEntry>
                  <ReconTile className="recon-title">
                    <span>{t('main:Formula 33')}</span>
                  </ReconTile>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">× 1</InfoTooltipItem>
                    <span>{saku33.total}</span>
                  </InfoTooltipEntry>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">{'× 2'}</InfoTooltipItem>
                    <span>{saku33x2.total}</span>
                  </InfoTooltipEntry>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">{'× 3'}</InfoTooltipItem>
                    <span>{saku33x3.total}</span>
                  </InfoTooltipEntry>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">{'× 4'}</InfoTooltipItem>
                    <span>{saku33x4.total}</span>
                  </InfoTooltipEntry>
                </InfoTooltip>
              }
            >
              <span>{saku33.total.toFixed(2)}</span>
            </Tooltip>
          </Item>
          <Item label={inExpedition ? t('main:Expedition') : t('main:Resting')}>
            <CountdownLabel
              fleetId={`${timerId}-${fleetId}`}
              fleetName={joinString(fleetName ?? '', ', ')}
              completeTime={completeTime}
              shouldNotify={!inExpedition && !inBattle && !isMainView && !!canNotify}
            />
          </Item>
        </Container>
      )}
    </FleetStats>
  )
})
FleetStat.displayName = 'FleetStat'
