import { connect } from 'react-redux'
import { get, map, range, forEach, values, sortBy } from 'lodash'
import { Panel, Label, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { createSelector } from 'reselect'
import React, { Fragment } from 'react'

const {i18n} = window
const __ = i18n.main.__.bind(i18n.main)

import {
  configLayoutSelector,
  configDoubleTabbedSelector,
  extensionSelectorFactory,
} from 'views/utils/selectors'

import '../assets/task-panel.css'

// Return [count, required]
function sumSubgoals(record) {
  if (!record)
    return [0, 0]
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
    return '#e73939'
  case 3:
    return '#87da61'
  case 4:
    return '#16C2A3'
  case 5:
    return '#E2C609'
  case 6:
    return '#805444'
  case 7:
    return '#c792e8'
  default:
    return '#fff'
  }
}

function getStyleByProgress(quest) {
  if (!quest)
    return 'default'
  const {api_progress_flag, api_state} = quest
  if (api_state == 3)
    return 'success'
  switch (api_progress_flag) {
  case 0:         // Empty
    return 'warning'
  case 1:         // 50%
    return 'primary'
  case 2:         // 80%
    return 'info'
  default:
    return 'default'
  }
}

function progressLabelText(quest) {
  if (!quest)
    return ''
  const {api_progress_flag, api_state} = quest
  if (api_state == 3)
    return __('Completed')
  switch (api_progress_flag) {
  case 1:         // 50%
    return '50%'
  case 2:         // 80%
    return '80%'
  default:        // api_progress_flag == 0, which means empty progress
    return __('In progress')
  }
}

function getStyleByPercent(percent) {
  if (percent < 0.5)
    return 'warning'
  if (percent < 0.8)
    return 'primary'
  if (percent < 1)
    return 'info'
  return 'success'
}

function getToolTip(record) {
  return (
    <Fragment>
      {
        values(record).map((subgoal, idx) =>
          (subgoal && typeof subgoal === 'object')
            ? <div key={idx}>{i18n.data.__(subgoal.description)} - {subgoal.count} / {subgoal.required}</div>
            : undefined
        )
      }
    </Fragment>
  )
}

const TaskRowBase = connect(
  createSelector([
    configLayoutSelector,
    configDoubleTabbedSelector,
  ], (layout, doubleTabbed) => ({
    leftOverlayPlacement: (!doubleTabbed) && (layout == 'vertical') ? 'top' : 'left',
  }))
)(function({
  idx,                  // Mandatory: 0..5
  bulletColor='#fff',
  leftLabel='',
  leftOverlay,
  rightLabel='',
  rightOverlay,
  rightBsStyle='success',
  leftOverlayPlacement,
}) {
  return (
    <div className="panel-item task-item">
      <OverlayTrigger
        placement={leftOverlayPlacement}
        overlay={
          <Tooltip id={`task-quest-name-${idx}`} style={leftOverlay ? null : {display: 'none'}}>{leftOverlay}</Tooltip>
        }
      >
        <div className="quest-name">
          <span className="cat-indicator" style={{backgroundColor: bulletColor}}></span>
          {leftLabel}
        </div>
      </OverlayTrigger>
      <div>
        <OverlayTrigger
          placement='left'
          overlay={
            <Tooltip id={`task-progress-${idx}`} style={rightOverlay ? null : {display: 'none'}}>{rightOverlay}</Tooltip>
          }
        >
          <Label className="quest-progress" bsStyle={rightBsStyle}>{rightLabel}</Label>
        </OverlayTrigger>
      </div>
    </div>
  )
})

const TaskRow = connect(
  (state, {quest}) => ({
    quest,
    record: get(state, ['info', 'quests', 'records', quest.api_no]),
    translation: get(extensionSelectorFactory('poi-plugin-quest-info')(state), ['quests', quest.api_no, 'condition']),
    wikiId: get(extensionSelectorFactory('poi-plugin-quest-info')(state), ['quests', quest.api_no, 'wiki_id']),
  })
)(function ({idx, quest, record, translation, wikiId}) {
  const questName = quest ? i18n.resources.__(quest.api_title || '') : '???'
  const questContent = translation ? translation : quest ? quest.api_detail.replace(/<br\s*\/?>/gi, '') : '...'
  const [count, required] = sumSubgoals(record)
  const progressBsStyle = record ?
    getStyleByPercent(count / required) :
    getStyleByProgress(quest)
  const progressLabel = record ?
    `${count} / ${required}` :
    progressLabelText(quest)
  const progressOverlay = record ?
    <div>{getToolTip(record || {})}</div> :
    undefined
  return (
    <TaskRowBase
      idx={idx}
      bulletColor={quest ? getCategory(quest.api_category) : '#fff'}
      leftLabel={questName}
      leftOverlay={<div><strong>{wikiId ? `${wikiId} - ` : ''}{questName}</strong><br />{questContent}</div>}
      rightLabel={progressLabel}
      rightBsStyle={progressBsStyle}
      rightOverlay={progressOverlay}
    />
  )
})

const TaskPanel = connect(
  ({info: {quests: {activeQuests, activeCapacity, activeNum}}}) => ({
    activeQuests,
    activeCapacity,
    activeNum,
  })
)(function ({activeQuests, activeCapacity, activeNum}) {
  return (
    <Panel bsStyle="default">
      {[
        sortBy(map(values(activeQuests), 'detail'), 'api_no').map((quest, idx) =>
          <TaskRow
            key={(quest || {}).api_no || idx}
            idx={idx}
            quest={quest}
          />
        ),
        range(Object.keys(activeQuests).length, 6).map((idx) =>
          (idx < activeNum) ?
          // Need refreshing
    <TaskRowBase
      key={idx}
      idx={idx}
      leftLabel={__('To be refreshed')}
      leftOverlay={__('Browse your quest list to let poi know your active quests')}
    />
            : (idx < activeCapacity) ?
              // Empty
    <TaskRowBase
      key={idx}
      idx={idx}
      leftLabel={__('Empty quest')}
    />
              :
              // Can expand
              <TaskRowBase
                key={idx}
                idx={idx}
                leftLabel={__('Locked')}
                leftOverlay={__('Increase your active quest limit with a "Headquarters Personnel".')}
              />
        ),
      ]}
    </Panel>
  )
})

export default TaskPanel
