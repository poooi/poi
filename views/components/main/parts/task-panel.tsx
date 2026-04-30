import type { QuestRecord, SubgoalRecord } from 'views/redux/info/quests'
import type { RootState } from 'views/redux/reducer-factory'

import { Tag, Intent, ResizeSensor, Tooltip } from '@blueprintjs/core'
import { map, range, forEach, values, sortBy } from 'lodash'
import React, { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { css, styled } from 'styled-components'
import { config } from 'views/env'
import i18next from 'views/env-parts/i18next'
import {
  configLayoutSelector,
  configReverseLayoutSelector,
  extensionSelectorFactory,
} from 'views/utils/selectors'
import { escapeI18nKey } from 'views/utils/tools'

import { CardWrapper as CardWrapperL } from './styled-components'

const defaultLayout = config.getDefault('poi.mainpanel.layout')

const getPanelDimension = (width: number): number => {
  if (width > 700) return 4
  if (width > 525) return 3
  if (width > 350) return 2
  return 1
}

function sumSubgoals(record?: QuestRecord): [number, number] {
  if (!record) return [0, 0]
  let count = 0
  let required = 0
  forEach(record, (subgoal) => {
    if (subgoal && typeof subgoal === 'object') {
      count += subgoal.count
      required += subgoal.required
    }
  })
  return [count, required]
}

function getCategory(api_category: number): string {
  switch (api_category) {
    case 0:
      return '#ffffff'
    case 1:
      return '#19BB2E'
    case 2:
    case 8:
    case 9:
    case 10:
      return '#e73939'
    case 3:
      return '#87da61'
    case 4:
      return '#16C2A3'
    case 5:
      return '#E2C609'
    case 6:
    case 11:
      return '#805444'
    case 7:
      return '#c792e8'
    default:
      return '#fff'
  }
}

interface Quest {
  api_no: number
  api_title?: string
  api_detail?: string
  api_category?: number
  api_progress_flag?: number
  api_state?: number
}

function getIntentByProgress(quest: Quest | undefined): Intent {
  if (!quest) return Intent.NONE
  const { api_progress_flag, api_state } = quest
  if (api_state === 3) return 'success' as Intent
  switch (api_progress_flag) {
    case 0:
      return Intent.NONE
    case 1:
      return Intent.WARNING
    case 2:
      return Intent.PRIMARY
    default:
      return Intent.NONE
  }
}

function progressLabelText(quest: Quest | undefined): React.ReactNode {
  if (!quest) return ''
  const { api_progress_flag, api_state } = quest
  if (api_state === 3) return <Trans>main:Completed</Trans>
  switch (api_progress_flag) {
    case 1:
      return '50%'
    case 2:
      return '80%'
    default:
      return <Trans>main:In progress</Trans>
  }
}

function getIntentByPercent(percent: number): Intent {
  if (percent < 0.5) return Intent.NONE
  if (percent < 0.8) return Intent.WARNING
  if (percent < 1) return Intent.PRIMARY
  return Intent.SUCCESS
}

function getToolTip(record: QuestRecord): string[] {
  return values(record)
    .filter((g): g is SubgoalRecord => g != null && typeof g === 'object')
    .map(
      (g) =>
        `${i18next.t(`data:${escapeI18nKey(g.description ?? '')}`)} - ${g.count} / ${g.required}`,
    )
}

const CardWrapper = styled(CardWrapperL)`
  display: flex;
  flex-flow: row wrap;
`

const TaskItem = styled.div<{ colwidth: number }>`
  align-items: center;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  padding: 4px;
  ${({ colwidth }) => css`
    width: ${(100 * colwidth) / 12}%;
  `}
`

const QuestNameTooltip = styled(Tooltip)`
  flex: 1;
  margin-right: auto;
  overflow: hidden;
  padding-right: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const QuestProgress = styled(Tag)`
  flex: none;
  text-align: center;
  min-width: 50px;
`

const CatIndicator = styled.span`
  display: inline-block;
  flex: none;
  height: 1em;
  vertical-align: middle;
  width: 4px;
  margin-right: 4px;
  margin-top: -1px;
`

const QuestDescription = styled.div`
  max-width: 25em;
`

const taskRowLayoutSelector = createSelector(
  [
    configLayoutSelector,
    configReverseLayoutSelector,
    (state: RootState) => state.layout?.mainpane?.width ?? 450,
    (state: RootState) => state.config?.poi?.mainpanel?.layout ?? defaultLayout,
  ],
  (layout, reversed, mainPanelWidth, mainPanelLayout) => {
    const taskPanelLayout = (
      mainPanelLayout[mainPanelWidth > 750 ? 'lg' : 'sm'] as
        | Array<{ i: string; x: number }>
        | undefined
    )?.find((panel) => panel.i === 'task-panel')
    const colCnt = mainPanelWidth > 750 ? 20 : 10
    const colWidth = mainPanelWidth / colCnt
    const leftDist = (taskPanelLayout?.x ?? 0) * colWidth
    return {
      leftOverlayPlacement:
        (layout !== 'horizontal' || (layout === 'horizontal' && reversed)) && leftDist < 180
          ? ('top' as const)
          : ('left' as const),
    }
  },
)

const TaskRowBase = ({
  idx,
  bulletColor = '#fff',
  leftLabel = '',
  leftOverlay,
  rightLabel = '',
  rightOverlay = [],
  rightIntent = Intent.SUCCESS,
  colwidth,
}: {
  idx: number
  bulletColor?: string
  leftLabel?: string
  leftOverlay?: React.ReactElement
  rightLabel?: React.ReactNode
  rightOverlay?: string[]
  rightIntent?: Intent
  leftOverlayPlacement?: string
  colwidth: number
}) => {
  const { leftOverlayPlacement } = useSelector((state: RootState) => taskRowLayoutSelector(state))
  const rightOverlayCnt = (
    <div>
      {rightOverlay.map((msg) => (
        <div key={msg}>{msg}</div>
      ))}
    </div>
  )
  return (
    <TaskItem className="panel-item task-item" colwidth={colwidth}>
      <QuestNameTooltip
        className="quest-name"
        disabled={!leftOverlay}
        position={leftOverlayPlacement}
        content={leftOverlay}
      >
        <>
          <CatIndicator className="cat-indicator" style={{ backgroundColor: bulletColor }} />
          <span>{leftLabel}</span>
        </>
      </QuestNameTooltip>
      {rightLabel && (
        <Tooltip disabled={!rightOverlay.length} content={rightOverlayCnt} position="left">
          <QuestProgress className="quest-progress" intent={rightIntent} minimal>
            {rightLabel}
          </QuestProgress>
        </Tooltip>
      )}
    </TaskItem>
  )
}

const questPluginExtensionSelector = extensionSelectorFactory('poi-plugin-quest-info') as (
  state: RootState,
) => { quests?: Record<number, { condition?: string; wiki_id?: string }> } | undefined

const TaskRow = ({ idx, quest, colwidth }: { idx: number; quest: Quest; colwidth: number }) => {
  const { t } = useTranslation('resources')
  const record = useSelector((state: RootState) => state?.info?.quests?.records?.[quest.api_no])
  const translation = useSelector(
    (state: RootState) => questPluginExtensionSelector(state)?.quests?.[quest.api_no]?.condition,
  )
  const wikiId = useSelector(
    (state: RootState) => questPluginExtensionSelector(state)?.quests?.[quest.api_no]?.wiki_id,
  )

  const wikiIdPrefix = wikiId ? `${wikiId} - ` : ''
  const questName = quest?.api_title
    ? t(`resources:${quest.api_title}`, { context: quest.api_no?.toString() })
    : '???'
  const questContent = translation
    ? translation
    : quest
      ? (quest.api_detail?.replace(/<br\s*\/?>/gi, '') ?? '')
      : '...'
  const [count, required] = sumSubgoals(record)
  const progressIntent = record ? getIntentByPercent(count / required) : getIntentByProgress(quest)
  const progressLabel = record ? `${count} / ${required}` : progressLabelText(quest)
  const progressOverlay = record ? getToolTip(record) : []

  return (
    <TaskRowBase
      idx={idx}
      bulletColor={quest ? getCategory(quest.api_category ?? 0) : '#fff'}
      leftLabel={`${wikiIdPrefix}${questName}`}
      leftOverlay={
        <QuestDescription>
          <strong>
            {wikiIdPrefix}
            {questName}
          </strong>
          <br />
          {questContent}
        </QuestDescription>
      }
      rightLabel={progressLabel}
      rightIntent={progressIntent}
      rightOverlay={progressOverlay}
      colwidth={colwidth}
    />
  )
}

interface TaskPanelInnerProps {
  activeQuests: Record<string, { detail: Quest }>
  activeCapacity: number
  activeNum: number
  editable?: boolean
}

const TaskPanelInner = ({
  activeQuests,
  activeCapacity,
  activeNum,
  editable,
}: TaskPanelInnerProps) => {
  const [dimension, setDimension] = useState(1)

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const newDimension = getPanelDimension(entries[0].contentRect.width)
    setDimension((prev) => (prev !== newDimension ? newDimension : prev))
  }, [])

  const colwidth = Math.floor(12 / dimension)
  return (
    <ResizeSensor onResize={handleResize}>
      <CardWrapper className="task-card" elevation={editable ? 2 : 0} interactive={editable}>
        <TaskPanelContent
          activeQuests={activeQuests}
          activeCapacity={activeCapacity}
          activeNum={activeNum}
          colwidth={colwidth}
        />
      </CardWrapper>
    </ResizeSensor>
  )
}

const TaskPanelContent = ({
  activeQuests,
  activeCapacity,
  activeNum,
  colwidth,
}: {
  activeQuests: Record<string, { detail: Quest }>
  activeCapacity: number
  activeNum: number
  colwidth: number
}) => {
  const { t } = useTranslation('main')
  return (
    <>
      {sortBy(map(values(activeQuests), 'detail'), 'api_no').map((quest, idx) => (
        <TaskRow key={quest?.api_no ?? idx} idx={idx} quest={quest} colwidth={colwidth} />
      ))}
      {range(Object.keys(activeQuests).length, Math.max(activeCapacity, 7)).map((idx) =>
        idx < activeNum ? (
          <TaskRowBase
            key={idx}
            idx={idx}
            leftLabel={t('main:To be refreshed')}
            leftOverlay={t('main:Browse your quest list to let poi know your active quests')}
            colwidth={colwidth}
          />
        ) : idx < activeCapacity ? (
          <TaskRowBase key={idx} idx={idx} leftLabel={t('main:Empty quest')} colwidth={colwidth} />
        ) : (
          <TaskRowBase
            key={idx}
            idx={idx}
            leftLabel={t('main:Locked')}
            leftOverlay={t('main:QuestLimitMsg')}
            colwidth={colwidth}
          />
        ),
      )}
    </>
  )
}

export const TaskPanel = ({ editable }: { editable?: boolean }) => {
  void useDispatch()
  const activeQuests = useSelector((state: RootState) => state.info?.quests?.activeQuests)
  const activeCapacity = useSelector((state: RootState) => state.info?.quests?.activeCapacity ?? 0)
  const activeNum = useSelector((state: RootState) => state.info?.quests?.activeNum ?? 0)

  return (
    <TaskPanelInner
      activeQuests={activeQuests}
      activeCapacity={activeCapacity}
      activeNum={activeNum}
      editable={editable}
    />
  )
}
