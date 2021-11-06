/* global config */
import { connect } from 'react-redux'
import { get, map, range, forEach, values, sortBy } from 'lodash'
import { Tag, Intent, ResizeSensor, Tooltip } from '@blueprintjs/core'
import { createSelector } from 'reselect'
import React from 'react'
import { withNamespaces, Trans } from 'react-i18next'
import styled, { css } from 'styled-components'

import { escapeI18nKey } from 'views/utils/tools'
import { CardWrapper as CardWrapperL } from './styled-components'
import i18next from 'views/env-parts/i18next'

import {
  configLayoutSelector,
  configReverseLayoutSelector,
  extensionSelectorFactory,
} from 'views/utils/selectors'

const defaultLayout = config.getDefault('poi.mainpanel.layout')

const getPanelDimension = (width) => {
  if (width > 700) {
    return 4
  }
  if (width > 525) {
    return 3
  }
  if (width > 350) {
    return 2
  }
  return 1
}

// Return [count, required]
function sumSubgoals(record) {
  if (!record) return [0, 0]
  let [count, required] = [0, 0]
  forEach(record, (subgoal, key) => {
    if (subgoal && typeof subgoal === 'object') {
      count += subgoal.count
      required += subgoal.required
    }
  })
  return [count, required]
}

function getCategory(api_category) {
  switch (api_category) {
    case 0:
      return '#ffffff'
    case 1:
      return '#19BB2E'
    case 2:
    case 8:
    case 9:
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

function getIntentByProgress(quest) {
  if (!quest) {
    return Intent.NONE
  }
  const { api_progress_flag, api_state } = quest
  if (api_state == 3) {
    return 'success'
  }
  switch (api_progress_flag) {
    case 0: // Empty
      return Intent.NONE
    case 1: // 50%
      return Intent.WARNING
    case 2: // 80%
      return Intent.PRIMARY
    default:
      return Intent.NONE
  }
}

function progressLabelText(quest) {
  if (!quest) return ''
  const { api_progress_flag, api_state } = quest
  if (api_state == 3) {
    return <Trans>main:Completed</Trans>
  }
  switch (api_progress_flag) {
    case 1: // 50%
      return '50%'
    case 2: // 80%
      return '80%'
    default:
      // api_progress_flag == 0, which means empty progress
      return <Trans>main:In progress</Trans>
  }
}

function getIntentByPercent(percent) {
  if (percent < 0.5) return Intent.NONE
  if (percent < 0.8) return Intent.WARNING
  if (percent < 1) return Intent.PRIMARY
  return Intent.SUCCESS
}

function getToolTip(record) {
  return values(record)
    .map(
      (g, idx) =>
        Boolean(g) &&
        typeof g === 'object' &&
        `${i18next.t(`data:${escapeI18nKey(g.description)}`)} - ${g.count} / ${g.required}`,
    )
    .filter((a) => a)
}

const CardWrapper = styled(CardWrapperL)`
  display: flex;
  flex-flow: row wrap;
`

const TaskItem = styled.div`
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

const TaskRowBase = connect(
  createSelector(
    [
      configLayoutSelector,
      configReverseLayoutSelector,
      (state) => get(state, 'layout.mainpane.width', 450),
      (state) => get(state, 'config.poi.mainpanel.layout', defaultLayout),
    ],
    (layout, reversed, mainPanelWidth, mainPanelLayout) => {
      const taskPanelLayout = mainPanelLayout[mainPanelWidth > 750 ? 'lg' : 'sm']?.find(
        (panel) => panel.i === 'task-panel',
      )
      const colCnt = mainPanelWidth > 750 ? 20 : 10
      const colWidth = mainPanelWidth / colCnt
      const leftDist = (taskPanelLayout?.x || 0) * colWidth
      return {
        leftOverlayPlacement:
          (layout !== 'horizontal' || (layout === 'horizontal' && reversed)) && leftDist < 180
            ? 'top'
            : 'left',
      }
    },
  ),
)(function ({
  idx, // Mandatory: 0..5
  bulletColor = '#fff',
  leftLabel = '',
  leftOverlay,
  rightLabel = '',
  rightOverlay = [],
  rightIntent = Intent.SUCCESS,
  leftOverlayPlacement = 'auto',
  colwidth,
}) {
  const rightOverlayCnt = (
    <div>
      {rightOverlay.map((msg) => (
        <div key={msg}>{msg}</div>
      ))}
    </div>
  )
  return (
    <TaskItem className={'panel-item task-item'} colwidth={colwidth}>
      <QuestNameTooltip
        id={`task-quest-name-${idx}`}
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
})

const TaskRow = withNamespaces(['resources'])(
  connect((state, { quest }) => ({
    quest,
    record: get(state, ['info', 'quests', 'records', quest.api_no]),
    translation: get(extensionSelectorFactory('poi-plugin-quest-info')(state), [
      'quests',
      quest.api_no,
      'condition',
    ]),
    wikiId: get(extensionSelectorFactory('poi-plugin-quest-info')(state), [
      'quests',
      quest.api_no,
      'wiki_id',
    ]),
  }))(function ({ idx, quest, record, translation, wikiId, colwidth, t }) {
    const wikiIdPrefix = wikiId ? `${wikiId} - ` : ''
    const questName =
      quest && quest.api_title
        ? t(`resources:${quest.api_title}`, { context: quest.api_no && quest.api_no.toString() })
        : '???'
    const questContent = translation
      ? translation
      : quest
      ? quest.api_detail.replace(/<br\s*\/?>/gi, '')
      : '...'
    const [count, required] = sumSubgoals(record)
    const progressIntent = record
      ? getIntentByPercent(count / required)
      : getIntentByProgress(quest)
    const progressLabel = record ? `${count} / ${required}` : progressLabelText(quest)
    const progressOverlay = record && getToolTip(record || {})
    return (
      <TaskRowBase
        idx={idx}
        bulletColor={quest ? getCategory(quest.api_category) : '#fff'}
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
  }),
)

@withNamespaces(['main'])
@connect(
  ({
    info: {
      quests: { activeQuests, activeCapacity, activeNum },
    },
  }) => ({
    activeQuests,
    activeCapacity,
    activeNum,
  }),
)
export class TaskPanel extends React.Component {
  state = {
    dimension: 1,
  }

  handleResize = (entries) => {
    const dimension = getPanelDimension(entries[0].contentRect.width)
    if (dimension !== this.state.dimension) {
      this.setState({ dimension })
    }
  }

  render() {
    const { activeQuests, activeCapacity, activeNum, editable, t } = this.props
    const colwidth = Math.floor(12 / this.state.dimension)
    return (
      <ResizeSensor onResize={this.handleResize}>
        <CardWrapper className="task-card" elevation={editable ? 2 : 0} interactive={editable}>
          {[
            sortBy(map(values(activeQuests), 'detail'), 'api_no').map((quest, idx) => (
              <TaskRow
                key={(quest || {}).api_no || idx}
                idx={idx}
                quest={quest}
                colwidth={colwidth}
              />
            )),
            range(Object.keys(activeQuests).length, Math.max(activeCapacity, 7)).map((idx) =>
              idx < activeNum ? (
                // Need refreshing
                <TaskRowBase
                  key={idx}
                  idx={idx}
                  leftLabel={t('main:To be refreshed')}
                  leftOverlay={t('main:Browse your quest list to let poi know your active quests')}
                  colwidth={colwidth}
                />
              ) : idx < activeCapacity ? (
                // Empty
                <TaskRowBase
                  key={idx}
                  idx={idx}
                  leftLabel={t('main:Empty quest')}
                  colwidth={colwidth}
                />
              ) : (
                // Can expand
                <TaskRowBase
                  key={idx}
                  idx={idx}
                  leftLabel={t('main:Locked')}
                  leftOverlay={t('main:QuestLimitMsg')}
                  colwidth={colwidth}
                />
              ),
            ),
          ]}
        </CardWrapper>
      </ResizeSensor>
    )
  }
}
