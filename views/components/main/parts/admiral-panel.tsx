import type { RootState } from 'views/redux/reducer-factory'

import { Tag, Position, Intent, Tooltip } from '@blueprintjs/core'
import { map } from 'lodash'
import moment from 'moment-timezone'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import FontAwesome from 'react-fontawesome'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { styled } from 'styled-components'
import { InfoTooltipEntry, InfoTooltipItem } from 'views/components/etc/styled-components'
import i18next from 'views/env-parts/i18next'
import { getSlotitemCount } from 'views/utils/game-utils'
import { configSelector, basicSelector } from 'views/utils/selectors'

import { CountdownNotifierLabel } from './countdown-timer'
import { CardWrapper as CardWrapperL } from './styled-components'

const rankName = [
  '',
  '元帥',
  '大将',
  '中将',
  '少将',
  '大佐',
  '中佐',
  '新米中佐',
  '少佐',
  '中堅少佐',
  '新米少佐',
]

const totalExp = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600,
  15300, 17100, 19000, 21000, 23100, 25300, 27600, 30000, 32500, 35100, 37800, 40600, 43500, 46500,
  49600, 52800, 56100, 59500, 63000, 66600, 70300, 74100, 78000, 82000, 86100, 90300, 94600, 99000,
  103500, 108100, 112800, 117600, 122500, 127500, 132700, 138100, 143700, 149500, 155500, 161700,
  168100, 174700, 181500, 188500, 195800, 203400, 211300, 219500, 228000, 236800, 245900, 255300,
  265000, 275000, 285400, 296200, 307400, 319000, 331000, 343400, 356200, 369400, 383000, 397000,
  411500, 426500, 442000, 458000, 474500, 491500, 509000, 527000, 545500, 564500, 584500, 606500,
  631500, 661500, 701500, 761500, 851500, 1000000, 1300000, 1600000, 1900000, 2200000, 2600000,
  3000000, 3500000, 4000000, 4600000, 5200000, 5900000, 6600000, 7400000, 8200000, 9100000,
  10000000, 11000000, 12000000, 13000000, 14000000, 15000000,
]

const resolveDayTime = (time: number): string => {
  const seconds = time
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600) % 24
    const d = Math.trunc(seconds / 86400)
    return [
      d ? `${d}${i18next.t('main:d')}` : '',
      h ? `${h}${i18next.t('main:h')}` : '',
      m ? `${m}${i18next.t('main:m')}` : '',
      s ? `${s}${i18next.t('main:s')}` : '',
    ].join(' ')
  } else {
    return ''
  }
}

const getTagIntent = (_props: unknown, timeRemaining: number): Intent => {
  if (timeRemaining > 1800) return Intent.NONE
  if (timeRemaining > 900) return Intent.WARNING
  return Intent.DANGER
}

const CountdownRow = styled(InfoTooltipItem)`
  margin-right: 6px;
`

const ExpContent = () => {
  const { t } = useTranslation('main')
  const level = useSelector((state: RootState) => state.info?.basic?.api_level ?? -1)
  const exp = useSelector((state: RootState) => state.info?.basic?.api_experience ?? 0)
  return level >= 0 ? (
    <>
      {level < 120 && (
        <InfoTooltipEntry className="info-tooltip-entry">
          <CountdownRow className="info-tooltip-item">{t('main:Next')}</CountdownRow>
          <span>{totalExp[level] - exp}</span>
        </InfoTooltipEntry>
      )}
      <InfoTooltipEntry className="info-tooltip-entry">
        <CountdownRow className="info-tooltip-item">{t('main:Total Exp')}</CountdownRow>
        <span>{exp}</span>
      </InfoTooltipEntry>
    </>
  ) : (
    <span />
  )
}

const getNextPractice = () => {
  const now = moment.utc()
  const nowHour = now.hour()
  if (nowHour < 6) {
    now.hour(6)
  } else if (nowHour < 18) {
    now.hour(18)
  } else {
    now.hour(30)
  }
  return now.startOf('hour')
}

const getNextQuest = () => {
  const now = moment.utc()
  const nowHour = now.hour()
  if (nowHour < 20) {
    now.hour(20)
  } else {
    now.hour(44)
  }
  return now.startOf('hour')
}

const getNextQuarterlyQuest = () => {
  const now = Date.now()
  const m = moment.tz('Asia/Tokyo').month(1).endOf('month').add(5, 'hour')
  while (+m <= now) {
    m.add(3, 'months')
  }
  return m
}

const getNextSenka = () => {
  const m = moment.tz('Asia/Tokyo').endOf('month').subtract(2, 'hour')
  if (+m <= Date.now()) {
    return m.add(1, 'months')
  }
  return m
}

const getNextEO = () => moment.tz('Asia/Tokyo').endOf('month')

type MomentKey = 'Practice' | 'Quest' | 'QuarterlyQuest' | 'Senka' | 'EO'

const getNewMomentMap: Record<MomentKey, () => moment.Moment> = {
  Practice: getNextPractice,
  Quest: getNextQuest,
  QuarterlyQuest: getNextQuarterlyQuest,
  Senka: getNextSenka,
  EO: getNextEO,
}

const TeitokuTimer = styled.span`
  position: absolute;
  right: 0.5em;
`

const CountdownItem = styled(InfoTooltipEntry)`
  &:not(:last-child) {
    margin-bottom: 0.5em;
  }
`

const CardWrapper = styled(CardWrapperL)`
  display: flex;
  align-items: center;
`

const isActive = () => window.getStore('ui.activeMainTab') === 'main-view'

const CountdownContent = ({ moments }: { moments: Record<MomentKey, moment.Moment> }) => (
  <div>
    {(['Practice', 'Quest', 'QuarterlyQuest', 'Senka', 'EO'] as MomentKey[]).map((name) => (
      <CountdownItem className="info-tooltip-entry countdown-item" key={name}>
        <CountdownRow className="info-tooltip-item">
          <Trans>main:Next {name}</Trans>
        </CountdownRow>
        <span>
          <CountdownNotifierLabel
            timerKey={`next-${name}`}
            completeTime={+moments[name]}
            resolveTime={resolveDayTime}
            getLabelStyle={getTagIntent}
            isActive={isActive}
            minimal={false}
          />
        </span>
      </CountdownItem>
    ))}
  </div>
)

const CountDownControl = () => {
  const momentsRef = useRef<Record<MomentKey, moment.Moment>>({
    Practice: getNextPractice(),
    Quest: getNextQuest(),
    QuarterlyQuest: getNextQuarterlyQuest(),
    Senka: getNextSenka(),
    EO: getNextEO(),
  })
  const [intent, setIntent] = useState<Intent>(Intent.NONE)

  const tick = useCallback((currentTime: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const keys = Object.keys(momentsRef.current) as MomentKey[]
    keys.forEach((key) => {
      if (+momentsRef.current[key] - currentTime < 0) {
        momentsRef.current[key] = getNewMomentMap[key]()
      }
    })
    const minRemaining = Math.min(...map(momentsRef.current, (m) => +m - currentTime))
    const newIntent = getTagIntent(null, minRemaining / 1000)
    setIntent((prev) => (prev !== newIntent ? newIntent : prev))
  }, [])

  const startTick = useCallback(() => {
    window.ticker?.reg('admiral-panel', tick)
  }, [tick])

  const stopTick = useCallback(() => {
    window.ticker?.unreg('admiral-panel')
  }, [])

  useEffect(() => {
    startTick()
    window.addEventListener('countdown.start', startTick)
    window.addEventListener('countdown.stop', stopTick)
    return () => {
      stopTick()
      window.removeEventListener('countdown.start', startTick)
      window.removeEventListener('countdown.stop', stopTick)
    }
  }, [startTick, stopTick])

  return (
    <TeitokuTimer className="teitoku-timer">
      <Tooltip
        position={Position.LEFT_BOTTOM}
        content={<CountdownContent moments={momentsRef.current} />}
      >
        <Tag intent={intent} minimal>
          <FontAwesome name="calendar" />
        </Tag>
      </Tooltip>
    </TeitokuTimer>
  )
}

const admiralInfoSelector = createSelector([basicSelector], (basic) => ({
  level: basic?.api_level ?? -1,
  nickname: basic?.api_nickname ?? '',
  rank: basic?.api_rank ?? 0,
  maxShip: basic?.api_max_chara ?? 0,
  maxSlotitem: basic?.api_max_slotitem ?? 0,
}))

const numCheckSelector = createSelector([configSelector], (cfg) => ({
  shipNumCheck: cfg.poi?.mapStartCheck?.ship?.enable ?? false,
  minShipNum: cfg.poi?.mapStartCheck?.ship?.minFreeSlots ?? 4,
  slotNumCheck: cfg.poi?.mapStartCheck?.item?.enable ?? false,
  minSlotNum: cfg.poi?.mapStartCheck?.item?.minFreeSlots ?? 10,
}))

export const AdmiralPanel = ({ editable }: { editable?: boolean }) => {
  const { t } = useTranslation(['main', 'resources'])
  const admiralInfo = useSelector((state: RootState) => admiralInfoSelector(state))
  const numCheck = useSelector((state: RootState) => numCheckSelector(state))
  const equipNum = useSelector((state: RootState) => getSlotitemCount(state.info.equips))
  const shipNum = useSelector((state: RootState) => Object.keys(state.info.ships as object).length)
  const dropCount = useSelector(
    (state: RootState) => (state.sortie as { dropCount?: number }).dropCount ?? 0,
  )

  const { level, nickname, rank, maxShip, maxSlotitem } = admiralInfo
  const { shipNumCheck, minShipNum, slotNumCheck, minSlotNum } = numCheck

  const shipCountIntent =
    shipNumCheck && maxShip - (shipNum + dropCount) < minShipNum ? 'warning' : Intent.NONE
  const slotCountIntent =
    slotNumCheck && maxSlotitem - equipNum < minSlotNum ? 'warning' : Intent.NONE

  return (
    <CardWrapper elevation={editable ? 2 : 0} interactive={editable}>
      <Tooltip content={<ExpContent />} position={Position.RIGHT}>
        {level >= 0 ? (
          <span>
            {`Lv. ${level}　`}
            <span className="nickname">{nickname}</span>
            <Tag minimal>{t(`resources:${rankName[rank]}`)}</Tag>
          </span>
        ) : (
          <span>{t('Admiral [Not logged in]')}</span>
        )}
      </Tooltip>
      <CountDownControl />
      <span style={{ marginRight: '1em', marginLeft: '1em' }}>
        <span>{t('main:Ships')}: </span>
        <Tag intent={shipCountIntent} minimal>
          {(shipNum || 0) + (dropCount || 0) || '?'} / {maxShip || '?'}
        </Tag>
      </span>
      <span>
        <span>{t('main:Equip')}: </span>
        <Tag intent={slotCountIntent} minimal>
          {equipNum || '?'} / {maxSlotitem || '?'}
        </Tag>
      </span>
    </CardWrapper>
  )
}
