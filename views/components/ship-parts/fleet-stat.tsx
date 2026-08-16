import type { RootState } from 'views/redux/reducer-factory'
import type { CountdownNotifyOptions } from 'views/utils/notifiers'
import type { ShipData } from 'views/utils/selectors'

import { Position, Tooltip } from '@blueprintjs/core'
import { memoize } from 'lodash'
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

const tykuText = ({ min, max }: { min: number; max: number }) =>
  max === min ? `${min}` : `${min}+`

// the single fleet value takes less room so both fit on one line, and is raised
// so its top lines up with the top of the full-size combined fleet value
// (0.2em ≈ the cap height a 80% glyph loses against the full-size one)
const OwnValue = styled.span`
  font-size: 80%;
  opacity: 0.8;
  vertical-align: 0.2em;
`

interface DualProps {
  own: React.ReactNode
  /** combined fleet counterpart, `undefined` when no combined fleet is formed */
  combined?: React.ReactNode
}

// `combined (own)` while a combined fleet is formed, `own` alone otherwise
const DualValue = ({ own, combined }: DualProps) =>
  combined == null ? (
    <>{own}</>
  ) : (
    <>
      {combined} <OwnValue className="own-fleet-value">({own})</OwnValue>
    </>
  )

// same, with a tooltip telling which value is which (for stats without their own tooltip)
const DualStat = ({ own, combined }: DualProps) => {
  const { t } = useTranslation('main')
  if (combined == null) {
    return <>{own}</>
  }
  return (
    <Tooltip position={Position.BOTTOM} content={t('main:Combined Fleet (Fleet)')}>
      <span>
        <DualValue own={own} combined={combined} />
      </span>
    </Tooltip>
  )
}

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
    // eslint-disable-next-line react-hooks/refs
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

// > 0 once the 1st and 2nd fleet are joined into a combined fleet
const combinedFlagSelector = (state: RootState) => state?.sortie?.combinedFlag ?? 0

const combinedShipsDataSelector = createSelector(
  [fleetShipsDataSelectorFactory(0), fleetShipsDataSelectorFactory(1)],
  (mainShips = [], escortShips = []) => [...mainShips, ...escortShips],
)

const combinedTykuSelector = createSelector(
  [
    fleetShipsEquipDataWithEscapeSelectorFactory(0),
    fleetShipsEquipDataWithEscapeSelectorFactory(1),
  ],
  (mainEquips = [], escortEquips = []) => getTyku([...mainEquips, ...escortEquips]),
)

const combinedSakuSelector = createSelector(
  [
    fleetShipsDataWithEscapeSelectorFactory(0),
    fleetShipsDataWithEscapeSelectorFactory(1),
    fleetShipsEquipDataWithEscapeSelectorFactory(0),
    fleetShipsEquipDataWithEscapeSelectorFactory(1),
    admiralLevelSelector,
    fleetSlotCountSelectorFactory(0),
    fleetSlotCountSelectorFactory(1),
  ],
  (
    mainShips = [],
    escortShips = [],
    mainEquips = [],
    escortEquips = [],
    admiralLevel,
    mainSlotCount,
    escortSlotCount,
  ) => {
    const shipsData = [...mainShips, ...escortShips]
    const equipsData = [...mainEquips, ...escortEquips]
    // the admiral term is subtracted once, empty slots are counted over both fleets
    const slotCount = mainSlotCount + escortSlotCount
    return {
      saku33: getSaku33(shipsData, equipsData, admiralLevel, 1.0, slotCount),
      saku33x2: getSaku33(shipsData, equipsData, admiralLevel, 2.0, slotCount),
      saku33x3: getSaku33(shipsData, equipsData, admiralLevel, 3.0, slotCount),
      saku33x4: getSaku33(shipsData, equipsData, admiralLevel, 4.0, slotCount),
    }
  },
)

const combinedSpeedSelector = createSelector(
  [fleetShipsDataWithEscapeSelectorFactory(0), fleetShipsDataWithEscapeSelectorFactory(1)],
  (mainShips = [], escortShips = []) => getFleetSpeed([...mainShips, ...escortShips]),
)

interface ShipTotals {
  totalLv: number
  totalFP: number
  totalASW: number
  totalLoS: number
  totalAA: number
}

const sumShipStats = (shipsData: (ShipData | undefined)[] = []): ShipTotals => {
  const totals: ShipTotals = { totalLv: 0, totalFP: 0, totalASW: 0, totalLoS: 0, totalAA: 0 }
  shipsData.forEach((shipData) => {
    const _ship = shipData?.[0]
    if (_ship) {
      totals.totalLv += _ship.api_lv ?? 0
      totals.totalFP += _ship.api_karyoku?.[0] ?? 0
      totals.totalASW += _ship.api_taisen?.[0] ?? 0
      totals.totalLoS += _ship.api_sakuteki?.[0] ?? 0
      totals.totalAA += _ship.api_taiku?.[0] ?? 0
    }
  })
  return totals
}

const combinedStatSelector = createSelector(
  [combinedShipsDataSelector, combinedTykuSelector, combinedSakuSelector, combinedSpeedSelector],
  (shipsData, tyku, saku, fleetSpeed) => ({
    ...sumShipStats(shipsData),
    tyku,
    saku,
    fleetSpeed,
  }),
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

  const combinedFlag = useSelector(combinedFlagSelector)
  // the combined fleet is made of the 1st (main) and 2nd (escort) fleet only
  const showCombined = combinedFlag > 0 && fleetId < 2
  const combined = useSelector((state: RootState) =>
    showCombined ? combinedStatSelector(state) : undefined,
  )

  const { totalLv, totalFP, totalASW, totalLoS, totalAA } = sumShipStats(shipsData)

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
          <MiniItem>
            <DualValue
              own={t(`main:${getSpeedLabel(speed)}`)}
              combined={combined && t(`main:${getSpeedLabel(combined.fleetSpeed.speed)}`)}
            />
          </MiniItem>
          <MiniItem>
            {t('main:Fighter Power')}:{' '}
            <DualValue own={tykuText(tyku)} combined={combined && tykuText(combined.tyku)} />
          </MiniItem>
          <MiniItem>
            {t('main:LOS')}:{' '}
            <DualValue
              own={saku33.total.toFixed(1)}
              combined={combined && combined.saku.saku33.total.toFixed(1)}
            />
          </MiniItem>
        </MiniContainer>
      ) : (
        <Container>
          <Item label={t('data:Speed')}>
            <DualStat
              own={t(`main:${getSpeedLabel(speed)}`)}
              combined={combined && t(`main:${getSpeedLabel(combined.fleetSpeed.speed)}`)}
            />
          </Item>
          <Item label={t('data:Lv')}>
            <DualStat own={totalLv} combined={combined?.totalLv} />
          </Item>
          <Item label={t('data:FP')}>
            <DualStat own={totalFP} combined={combined?.totalFP} />
          </Item>
          <Item label={t('data:ASW')}>
            <DualStat own={totalASW} combined={combined?.totalASW} />
          </Item>
          <Item label={t('data:AA')}>
            <DualStat own={totalAA} combined={combined?.totalAA} />
          </Item>
          <Item label={t('main:Fighter Power')}>
            <Tooltip
              position={Position.BOTTOM}
              content={
                <div>
                  {combined && <div>{t('main:Combined Fleet (Fleet)')}</div>}
                  <div>
                    {t('main:Minimum FP')}:{' '}
                    <DualValue own={tyku.min} combined={combined?.tyku.min} />
                  </div>
                  <div>
                    {t('main:Maximum FP')}:{' '}
                    <DualValue own={tyku.max} combined={combined?.tyku.max} />
                  </div>
                  <div>
                    {t('main:Basic FP')}:{' '}
                    <DualValue own={tyku.basic} combined={combined?.tyku.basic} />
                  </div>
                </div>
              }
            >
              <span>
                <DualValue own={tykuText(tyku)} combined={combined && tykuText(combined.tyku)} />
              </span>
            </Tooltip>
          </Item>
          <Item label={t('main:LOS')}>
            <Tooltip
              position={Position.BOTTOM}
              content={
                <InfoTooltip className="info-tooltip">
                  {combined && (
                    <ReconTile className="recon-title">
                      {t('main:Combined Fleet (Fleet)')}
                    </ReconTile>
                  )}
                  <ReconTile className="recon-title">{t('main:Total')}</ReconTile>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item" />
                    <span>
                      <DualValue own={totalLoS} combined={combined?.totalLoS} />
                    </span>
                  </InfoTooltipEntry>
                  <ReconTile className="recon-title">{t('main:Formula 33')}</ReconTile>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">× 1</InfoTooltipItem>
                    <span>
                      <DualValue own={saku33.total} combined={combined?.saku.saku33.total} />
                    </span>
                  </InfoTooltipEntry>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">{'× 2'}</InfoTooltipItem>
                    <span>
                      <DualValue own={saku33x2.total} combined={combined?.saku.saku33x2.total} />
                    </span>
                  </InfoTooltipEntry>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">{'× 3'}</InfoTooltipItem>
                    <span>
                      <DualValue own={saku33x3.total} combined={combined?.saku.saku33x3.total} />
                    </span>
                  </InfoTooltipEntry>
                  <InfoTooltipEntry className="info-tooltip-entry">
                    <InfoTooltipItem className="info-tooltip-item">{'× 4'}</InfoTooltipItem>
                    <span>
                      <DualValue own={saku33x4.total} combined={combined?.saku.saku33x4.total} />
                    </span>
                  </InfoTooltipEntry>
                </InfoTooltip>
              }
            >
              <span>
                <DualValue
                  own={saku33.total.toFixed(1)}
                  combined={combined && combined.saku.saku33.total.toFixed(1)}
                />
              </span>
            </Tooltip>
          </Item>
          <Item label={inExpedition ? t('main:Expedition') : t('main:Resting')}>
            <CountdownLabel
              fleetId={`${timerId}-${fleetId}`}
              fleetName={fleetName}
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
