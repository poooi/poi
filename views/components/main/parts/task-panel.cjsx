{ROOT, APPDATA_PATH, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
CSON = require 'cson'
{join} = require 'path-extra'
fs = require 'fs-extra'

# Local time -> Task Refresh time(GMT + 4)
getCurrentDay = ->
  curTime = new Date()
  curTime.setTime(curTime.getTime() + (curTime.getTimezoneOffset() + 240) * 60000)
  curTime.getDay()

prevDay = getCurrentDay()

getCurrentDate = ->
  curTime = new Date()
  curTime.setTime(curTime.getTime() + (curTime.getTimezoneOffset() + 240) * 60000)
  curTime.getDate()

getCurrentMonth = ->
  curTime = new Date()
  curTime.setTime(curTime.getTime() + (curTime.getTimezoneOffset() + 240) * 60000)
  curTime.getMonth() + 1

prevMonth = getCurrentMonth()

getStyleByProgress = (progress) ->
  switch progress
    when '进行'
      return 'warning'
    when '50%'
      return 'primary'
    when '80%'
      return 'info'
    when '达成'
      return 'success'
    else
      return 'default'

getStyleByPercent = (percent) ->
  if percent < 0.5
    return 'warning'
  if percent < 0.8
    return 'primary'
  if percent < 1
    return 'info'
  return 'success'

emptyTask =
  name: '未接受'
  id: 100000
  content: '...'
  progress: ''
  category: 0
  type: 0

memberId = -1
# Quest Tracking
try
  questGoals = CSON.parseCSONFile join(ROOT, 'assets', 'data', 'quest_goal.cson')
catch
  console.log 'No quest tracking data!'
questRecord = {}
syncQuestRecord = ->
  questRecord.day = getCurrentDay()
  questRecord.month = getCurrentMonth()
  fs.writeFileSync join(APPDATA_PATH, "quest_tracking_#{memberId}.cson"), CSON.stringify questRecord, null, 2
clearQuestRecord = (id) ->
  delete questRecord[id] if questRecord[id]?
  syncQuestRecord()
activateQuestRecord = (id) ->
  if questRecord[id]?
    questRecord[id].active = true
    return
  questRecord[id] =
    count: 0
    required: 0
    active: true
  for k, v of questGoals[id]
    continue if k == 'type'
    questRecord[id][k] =
      count: v.init
      required: v.required
      description: v.description
    questRecord[id].count += v.init
    questRecord[id].required += v.required
  syncQuestRecord()
inactivateQuestRecord = (id) ->
  return unless questRecord[id]?
  questRecord[id].active = false
  syncQuestRecord()
updateQuestRecord = (e, options, delta) ->
  flag = false
  for id, q of questRecord
    continue unless q.active and q[e]?
    continue if questGoals[id][e].shipType? and options.shipType not in questGoals[id][e].shipType
    continue if questGoals[id][e].mission? and options.mission not in questGoals[id][e].mission
    continue if questGoals[id][e].maparea? and options.maparea not in questGoals[id][e].maparea
    before = q[e].count
    q[e].count = Math.min(q[e].required, q[e].count + delta)
    q.count += q[e].count - before
    flag = true
  if flag
    syncQuestRecord()
    return true
  return false
getToolTip = (id) ->
  <div>
  {
    for k, v of questRecord[id]
      if v.count? and v.required?
        <div key={k}>{v.description} - {v.count} / {v.required}</div>
  }
  </div>

TaskPanel = React.createClass
  getInitialState: ->
    tasks: [Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask),
            Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask)]
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {tasks} = @state
    flag = false
    switch path
      when '/kcsapi/api_get_member/basic'
        memberId = window._nickNameId
        try
          questRecord = CSON.parseCSONFile join(APPDATA_PATH, "quest_tracking_#{memberId}.cson")
          if getCurrentDay() != questRecord.day
            for id, q of questRecord
              delete questRecord[id] if questGoals[id].type in [2, 4, 5]
          if getCurrentDay() < questRecord.day
            for id, q of questRecord
              delete questRecord[id] if questGoals[id].type is 3
          if getCurrentMonth() > questRecord.month
            for id, q of questRecord
              delete questRecord[id] if questGoals[id].type is 6
        catch error
          false
      when '/kcsapi/api_get_member/questlist'
        return unless body.api_list?
        for task in body.api_list
          continue if task is -1 || task.api_state < 2
          # Determine progress
          progress = '进行'
          if task.api_state == 3
            progress = '达成'
          else if task.api_progress_flag == 1
            progress = '50%'
          else if task.api_progress_flag == 2
            progress = '80%'
          # Determine customize progress
          activateQuestRecord task.api_no if questGoals[task.api_no]?
          idx = _.findIndex tasks, (e) ->
            e.id == task.api_no
          # Do not exist currently
          if idx == -1
            idx = _.findIndex tasks, (e) ->
              e.id == 100000
          tasks[idx] =
            name: task.api_title
            id: task.api_no
            content: task.api_detail
            progress: progress
            category: task.api_category
            type: task.api_type
        flag = true
      # Finish quest
      when '/kcsapi/api_req_quest/clearitemget'
        clearQuestRecord parseInt(postBody.api_quest_id)
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
        tasks[idx] = Object.clone(emptyTask)
        flag = true
      # Stop quest
      when '/kcsapi/api_req_quest/stop'
        inactivateQuestRecord parseInt(postBody.api_quest_id)
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
        tasks[idx] = Object.clone(emptyTask)
        flag = true
      # Add api listener for quest tracking
      # type: practice, practice_win
      when '/kcsapi/api_req_practice/battle_result'
        switch body.api_win_rank
          when 'S', 'A', 'B'
            flag = updateQuestRecord('practice_win', null, 1) || flag
            flag = updateQuestRecord('practice', null, 1) || flag
          else
            flag = updateQuestRecord('practice', null, 1) || flag
      # type: mission_success
      when '/kcsapi/api_req_mission/result'
        if body.api_clear_result > 0
          flag = updateQuestRecord('mission_success', {mission: body.api_quest_name}, 1)
      # type: repair
      when '/kcsapi/api_req_nyukyo/start'
        flag = updateQuestRecord('repair', null, 1)
      # type: supply
      when '/kcsapi/api_req_hokyu/charge'
        flag = updateQuestRecord('supply', null, 1)
      # type: create_item
      when '/kcsapi/api_req_kousyou/createitem'
        flag = updateQuestRecord('create_item', null, 1)
      # type: create_ship
      when '/kcsapi/api_req_kousyou/createship'
        flag = updateQuestRecord('create_ship', null, 1)
      # type: destroy_ship
      when '/kcsapi/api_req_kousyou/destroyship'
        flag = updateQuestRecord('destroy_ship', null, 1)
      # type: remodel_item
      when '/kcsapi/api_req_kousyou/remodel_slot'
        flag = updateQuestRecord('remodel_item', null, 1)
      # type: remodel_ship
      when '/kcsapi/api_req_kaisou/powerup'
        if body.api_powerup_flag == 1
          flag = updateQuestRecord('remodel_ship', null, 1)
      # type: destory_item
      when '/kcsapi/api_req_kousyou/destroyitem2'
        flag = updateQuestRecord('destory_item', null, 1)
    return unless flag
    for task in tasks
      continue if task.id == 100000
      if questGoals[task.id]?
        task.tracking = true
        task.percent = questRecord[task.id].count / questRecord[task.id].required
        task.progress = questRecord[task.id].count + ' / ' + questRecord[task.id].required
    tasks = _.sortBy tasks, (e) -> e.id
    @setState
      tasks: tasks
    event = new CustomEvent 'task.change',
      bubbles: true
      cancelable: true
      detail:
        tasks: tasks
    window.dispatchEvent event
  handleBattleResult: (e) ->
    flag = false
    {rank, boss, map, enemyHp, enemyShipId} = e.detail
    # type: battle
    flag = updateQuestRecord('battle', null, 1) || flag
    # type: battle_win
    if rank == 'S' || rank == 'A' || rank == 'B'
      flag = updateQuestRecord('battle_win', null, 1) || flag
    # type: battle_rank_s
    if rank == 'S'
      flag = updateQuestRecord('battle_rank_s', null, 1) || flag
    # type: battle_boss
    if boss
      flag = updateQuestRecord('battle_boss', null, 1) || flag
      # type: battle_boss_win
      if rank == 'S' || rank == 'A' || rank == 'B'
        flag = updateQuestRecord('battle_boss_win', {maparea: map}, 1) || flag
      # type: battle_boss_win_rank_a
      if rank == 'S' || rank == 'A'
        flag = updateQuestRecord('battle_boss_win_rank_a', {maparea: map}, 1) || flag
      # type: battle_boss_win_rank_s
      if rank == 'S'
        flag = updateQuestRecord('battle_boss_win_rank_s', {maparea: map}, 1) || flag
    # type: sinking
    for shipId, idx in enemyShipId
      continue if shipId == -1 or enemyHp[idx] > 0
      shipType = window.$ships[shipId].api_stype
      if shipType in [7, 11, 13, 15]
        flag = updateQuestRecord('sinking', {shipType: shipType}, 1) || flag
    if flag
      {tasks} = @state
      for task in tasks
        continue if task.id == 100000
        if questGoals[task.id]?
          task.tracking = true
          task.percent = questRecord[task.id].count / questRecord[task.id].required
          task.progress = questRecord[task.id].count + ' / ' + questRecord[task.id].required
      tasks = _.sortBy tasks, (e) -> e.id
      @setState
        tasks: tasks
  refreshDay: ->
    curDay = getCurrentDay()
    curMonth = getCurrentMonth()
    curDate = getCurrentDate()
    return if prevDay == curDay and prevMonth == curMonth
    {tasks} = @state
    for task, idx in tasks
      continue if task.id == 100000
      if task.type in [2, 4, 5]
        clearQuestRecord task.id
        tasks[idx] = Object.clone(emptyTask)
      if task.type is 3 and curDay is 1
        clearQuestRecord task.id
        tasks[idx] = Object.clone(emptyTask)
      if task.type is 6 and curDate is 1
        clearQuestRecord task.id
        tasks[idx] = Object.clone(emptyTask)
      tasks = _.sortBy tasks, (e) -> e.id
      @setState
        tasks: tasks
      event = new CustomEvent 'task.change',
        bubbles: true
        cancelable: true
        detail:
          tasks: tasks
      window.dispatchEvent event
    prevMonth = curMonth
    prevDay = curDay
  handleTaskInfo: (e) ->
    {tasks} = e.detail
    @setState
      tasks: tasks
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'task.info', @handleTaskInfo
    window.addEventListener 'battle.result', @handleBattleResult
    @interval = setInterval @refreshDay, 30000
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'task.info', @handleTaskInfo
    window.removeEventListener 'battle.result', @handleBattleResult
    clearInterval @interval
  render: ->
    <Panel header="任务" bsStyle="success">
      <Table>
        <tbody>
        {
          for i in [0..5]
            if @state.tasks[i].tracking
              <tr key={i}>
                <OverlayTrigger placement='left' overlay={<Tooltip><strong>{@state.tasks[i].name}</strong><br />{@state.tasks[i].content}</Tooltip>}>
                  <td>{@state.tasks[i].name}</td>
                </OverlayTrigger>
                <td>
                  <OverlayTrigger placement='left' overlay={<Tooltip>{getToolTip @state.tasks[i].id}</Tooltip>}>
                    <Label bsStyle={getStyleByPercent @state.tasks[i].percent}>{@state.tasks[i].progress}</Label>
                  </OverlayTrigger>
                </td>
              </tr>
            else
              <tr key={i}>
                <OverlayTrigger placement='left' overlay={<Tooltip><strong>{@state.tasks[i].name}</strong><br />{@state.tasks[i].content}</Tooltip>}>
                  <td>{@state.tasks[i].name}</td>
                </OverlayTrigger>
                <td>
                  <Label bsStyle={getStyleByProgress @state.tasks[i].progress}>{@state.tasks[i].progress}</Label>
                </td>
              </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = TaskPanel
