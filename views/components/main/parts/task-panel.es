import { connect } from 'react-redux'
import { get, map, range, forEach, values, sortBy } from 'lodash'
import { Panel, Label, OverlayTrigger, Tooltip, Col } from 'react-bootstrap'
import { createSelector } from 'reselect'
import React from 'react'
import { translate, Trans } from 'react-i18next'
import { escapeI18nKey } from 'views/utils/tools'

import {
  configLayoutSelector,
  configReverseLayoutSelector,
  extensionSelectorFactory,
} from 'views/utils/selectors'
import defaultLayout from '../default-layout'

import '../assets/task-panel.css'

const getPanelDimension = width => {
  width = width / window.getStore('config.poi.zoomLevel', 1)
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
    return <Trans>main:Completed</Trans>
  switch (api_progress_flag) {
  case 1:         // 50%
    return '50%'
  case 2:         // 80%
    return '80%'
  default:        // api_progress_flag == 0, which means empty progress
    return <Trans>main:In progress</Trans>
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
    <>
      {
        values(record).map((subgoal, idx) =>
          (subgoal && typeof subgoal === 'object')
            ? <div key={idx}><Trans i18nKey={`data:${ escapeI18nKey(subgoal.description) }`}>{ subgoal.description }</Trans> - {subgoal.count} / {subgoal.required}</div>
            : undefined
        )
      }
    </>
  )
}

const TaskRowBase = connect(
  createSelector([
    configLayoutSelector,
    configReverseLayoutSelector,
    state => get(state, 'layout.mainpane.width', 450),
    state => get(state, 'config.poi.mainpanel.layout', defaultLayout),
  ], (layout, reversed, mainPanelWidth, mainPanelLayout) => {
    const taskPanelLayout = mainPanelLayout[mainPanelWidth > 750 ? 'lg' : 'sm']
      .find(panel => panel.i === 'task-panel')
    const colCnt = mainPanelWidth > 750 ? 20 : 10
    const colWidth = mainPanelWidth / colCnt
    const leftDist = taskPanelLayout.x * colWidth
    return {
      leftOverlayPlacement: (layout !== 'horizontal' || (layout === 'horizontal' && reversed)) && (leftDist < 180) ? 'top' : 'left',
    }
  })
)(function({
  idx,                  // Mandatory: 0..5
  bulletColor='#fff',
  leftLabel='',
  leftOverlay,
  rightLabel='',
  rightOverlay,
  rightBsStyle='success',
  leftOverlayPlacement,
  colwidth,
}) {
  return (
    <Col className="panel-item task-item" xs={colwidth}>
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
    </Col>
  )
})

const TaskRow = translate(['resources'])(connect(
  (state, {quest}) => ({
    quest,
    record: get(state, ['info', 'quests', 'records', quest.api_no]),
    translation: get(extensionSelectorFactory('poi-plugin-quest-info')(state), ['quests', quest.api_no, 'condition']),
    wikiId: get(extensionSelectorFactory('poi-plugin-quest-info')(state), ['quests', quest.api_no, 'wiki_id']),
    title: get(extensionSelectorFactory('poi-plugin-quest-info')(state), ['quests', quest.api_no, 'title']),
  })
)(function ({idx, quest, record, translation, wikiId, title, colwidth, t}) {
  const questName = title ? title : quest && quest.api_title ? t(`resources:${ escapeI18nKey(quest.api_title) }`) : '???'
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
      colwidth={colwidth}
    />
  )
}))

@translate(['main'])
@connect(({info: {quests: {activeQuests, activeCapacity, activeNum}}}) => ({
  activeQuests,
  activeCapacity,
  activeNum,
}))
export class TaskPanel extends React.Component {
  state = {
    dimension: 1,
  }

  componentDidMount() {
    this.panelArea = document.querySelector('.MainView .task-panel .panel-body')
    if (this.panelArea) {
      this.observer = new ResizeObserver(this.handleResize)
      this.observer.observe(this.panelArea)
    }
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.unobserve(this.panelArea)
    }
  }

  handleResize = entries => {
    const dimension = getPanelDimension(entries[0].contentRect.width)
    if (dimension !== this.state.dimension) {
      this.setState({ dimension })
    }
  }

  render () {
    const { activeQuests, activeCapacity, activeNum, t} = this.props
    const colwidth = Math.floor(12 / this.state.dimension)
    return (
      <Panel bsStyle="default">
        <Panel.Body>
          {[
            sortBy(map(values(activeQuests), 'detail'), 'api_no').map((quest, idx) =>
              <TaskRow
                key={(quest || {}).api_no || idx}
                idx={idx}
                quest={quest}
                colwidth={colwidth}
              />
            ),
            range(Object.keys(activeQuests).length, 6).map((idx) =>
              (idx < activeNum) ?  (
                // Need refreshing
                <TaskRowBase
                  key={idx}
                  idx={idx}
                  leftLabel={t('main:To be refreshed')}
                  leftOverlay={t('main:Browse your quest list to let poi know your active quests')}
                  colwidth={colwidth}
                />
              ) : (idx < activeCapacity) ? (
                // Empty
                <TaskRowBase
                  key={idx}
                  idx={idx}
                  leftLabel={t('main:Empty quest')}
                  colwidth={colwidth}
                /> ) : (
                // Can expand
                <TaskRowBase
                  key={idx}
                  idx={idx}
                  leftLabel={t('main:Locked')}
                  leftOverlay={t('main:QuestLimitMsg')}
                  colwidth={colwidth}
                /> )
            ),
          ]}
        </Panel.Body>
      </Panel>
    )
  }
}
