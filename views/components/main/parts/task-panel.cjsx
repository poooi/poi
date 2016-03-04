{ROOT, APPDATA_PATH, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
CSON = require 'cson'
fs = require 'fs-extra'
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

zero = 331200000
isDifferentDay = (time1, time2) ->
  day1 = (time1 - zero) // 86400000
  day2 = (time2 - zero) // 86400000
  day1 != day2
isDifferentWeek = (time1, time2) ->
  week1 = (time1 - zero) // 604800000
  week2 = (time2 - zero) // 604800000
  week1 != week2
isDifferentMonth = (time1, time2) ->
  # UTC time to UTC+4
  date1 = new Date(time1 + 14400000)
  date2 = new Date(time2 + 14400000)
  date1.getUTCMonth() != date2.getUTCMonth() || date1.getUTCFullYear() != date2.getUTCFullYear()

prevTime = (new Date()).getTime()

getCategory = (api_category) ->
  switch api_category
    when 0
      return '#ffffff'
    when 1
      return '#19BB2E'
    when 2, 8
      return '#e73939'
    when 3
      return '#87da61'
    when 4
      return '#16C2A3'
    when 5
      return '#E2C609'
    when 6
      return '#805444'
    when 7
      return '#c792e8'
    else
      return '#fff'

getStyleByProgress = (progress) ->
  switch progress
    when __ 'In progress'
      return 'warning'
    when '50%'
      return 'primary'
    when '80%'
      return 'info'
    when __ 'Completed'
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
  name: __ 'Empty quest'
  id: 100000
  content: '...'
  progress: ''
  category: 0
  type: 0

lockedTask =
  name: __ 'Locked'
  id: 100001
  content: __ "Increase your active quest limit with a \"Headquarters Personnel\"."
  progress: ''
  category: 0
  type: 0


memberId = -1
# Quest Tracking
questGoals = {}
try
  questGoals = CSON.parseCSONFile join(ROOT, 'assets', 'data', 'quest_goal.cson')
catch
  console.log 'No quest tracking data!'
questRecord = {}
syncQuestRecord = ->
  questRecord.time = (new Date()).getTime()
  fs.writeFileSync join(APPDATA_PATH, "quest_tracking_#{memberId}.cson"), CSON.stringify questRecord, null, 2
clearQuestRecord = (id) ->
  delete questRecord[id] if questRecord[id]?
  syncQuestRecord()
activateQuestRecord = (id, progress) ->
  if questRecord[id]?
    questRecord[id].active = true
  else
    questRecord[id] =
      count: 0
      required: 0
      active: true
    for k, v of questGoals[id] when typeof v is 'object' and v isnt null
      questRecord[id][k] =
        count: v.init
        required: v.required
        description: v.description
      questRecord[id].count += v.init
      questRecord[id].required += v.required
  # Only sync progress with game progress if the quest has only one goal.
  goals = (k for own k, v of questGoals[id] when typeof v is 'object' and v isnt null)
  if goals.length is 1
    progress = switch progress
      when __ 'Completed'
        1
      when '80%'
        0.8
      when '50%'
        0.5
      else
        0
    [k] = goals
    before = questRecord[id][k].count
    questRecord[id][k].count = Math.max(questRecord[id][k].count, Math.ceil(questRecord[id][k].required * progress))
    questRecord[id].count += questRecord[id][k].count - before
  syncQuestRecord()
inactivateQuestRecord = (id) ->
  return unless questRecord[id]?
  questRecord[id].active = false
  syncQuestRecord()
resetQuestRecord = (types, resetInterval, id, questRecord) ->
  return unless questGoals[id]?
  if questGoals[id].type in types
    questRecord.active = false
    questRecord.count = 0
  else if questGoals[id].resetInterval is resetInterval
    questRecord.count = 0
resetQuestRecordDaily = resetQuestRecord.bind(null, [2, 4, 5], 1)
resetQuestRecordWeekly = resetQuestRecord.bind(null, [3], 2)
resetQuestRecordMonthly = resetQuestRecord.bind(null, [6], 3)
resetTask = (types, resetInterval, tasks, idx, task) ->
  if task.type in types
    tasks[idx] = Object.clone(emptyTask)
  else if questGoals[task.id]? and questGoals[task.id].resetInterval is resetInterval
    task.count = 0
resetTaskDaily = resetTask.bind(null, [2, 4, 5], 1)
resetTaskWeekly = resetTask.bind(null, [3], 2)
resetTaskMonthly = resetTask.bind(null, [6], 3)
updateQuestRecord = (e, options, delta) ->
  flag = false
  for id, q of questRecord
    continue unless q.active and q[e]?
    continue if questGoals[id][e]?.shipType? and options.shipType not in questGoals[id][e].shipType
    continue if questGoals[id][e]?.mission? and options.mission not in questGoals[id][e].mission
    continue if questGoals[id][e]?.maparea? and options.maparea not in questGoals[id][e].maparea
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

firstBattle = false

TaskPanel = React.createClass
  getInitialState: ->
    taskLimits: 5
    tasks: [Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask),
            Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(lockedTask)]
    show: true
  shouldComponentUpdate: (nextProps, nextState) ->
    nextState.show
  handleVisibleResponse: (e) ->
    {visible} = e.detail
    @setState
      show: visible
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {tasks} = @state
    flag = false
    switch path
      when '/kcsapi/api_port/port'     #Handle parallel quest show
        if @state.taskLimits < body.api_parallel_quest_count
          for i in [@state.taskLimits...body.api_parallel_quest_count]
            tasks[i] = Object.clone(emptyTask)
          @setState
            tasks: tasks
            taskLimits: body.api_parallel_quest_count
      when '/kcsapi/api_get_member/basic'
        memberId = window._nickNameId
        try
          questRecord = CSON.parseCSONFile join(APPDATA_PATH, "quest_tracking_#{memberId}.cson")
          if questRecord? and questRecord.time?
            now = (new Date()).getTime()
            return unless isDifferentDay now, questRecord.time
            isDiffWeek = isDifferentWeek now, questRecord.time
            isDiffMonth = isDifferentMonth now, questRecord.time
            for id, q of questRecord when questGoals[id]?
              resetQuestRecordDaily id, q
              if isDiffWeek
                resetQuestRecordWeekly id, q
              if isDiffMonth
                resetQuestRecordMonthly id, q
            syncQuestRecord()
        catch err
          questRecord = {}
      when '/kcsapi/api_get_member/questlist'
        return unless body.api_list?
        for task in body.api_list
          continue if task is -1 || task.api_state < 2
          # Determine progress
          progress = __ 'In progress'
          if task.api_state == 3
            progress = __ 'Completed'
          else if task.api_progress_flag == 1
            progress = '50%'
          else if task.api_progress_flag == 2
            progress = '80%'
          # Determine customize progress
          activateQuestRecord task.api_no, progress if questGoals[task.api_no]?
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
      # type: sally
      when '/kcsapi/api_req_map/start'
        firstBattle = true
      when '/kcsapi/api_req_sortie/battleresult', '/kcsapi/api_req_combined_battle/battleresult'
        if firstBattle
          flag = updateQuestRecord('sally', null, 1)
          firstBattle = false
    return unless flag
    for task in tasks when task.id < 100000 and questGoals[task.id]?
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
      for task in tasks when task.id < 100000 and questGoals[task.id]?
        task.tracking = true
        task.percent = questRecord[task.id].count / questRecord[task.id].required
        task.progress = questRecord[task.id].count + ' / ' + questRecord[task.id].required
      tasks = _.sortBy tasks, (e) -> e.id
      @setState
        tasks: tasks
  refreshDay: ->
    now = (new Date()).getTime();
    return unless isDifferentDay now, prevTime
    isDiffWeek = isDifferentWeek now, prevTime
    isDiffMonth = isDifferentMonth now, prevTime
    {tasks} = @state
    for task, idx in tasks when task.id < 100000
      resetTaskDaily tasks, idx, task
      if isDiffWeek
        resetTaskWeekly tasks, idx, task
      if isDiffMonth
        resetTaskMonthly tasks, idx, task
    for id, q of questRecord when questGoals[id]?
      resetQuestRecordDaily id, q
      if isDiffWeek
        resetQuestRecordWeekly id, q
      if isDiffMonth
        resetQuestRecordMonthly id, q
    syncQuestRecord()
    tasks = _.sortBy tasks, (e) -> e.id
    @setState
      tasks: tasks
    event = new CustomEvent 'task.change',
      bubbles: true
      cancelable: true
      detail:
        tasks: tasks
    window.dispatchEvent event
    prevTime = now
  handleTaskInfo: (e) ->
    {tasks} = e.detail
    @setState
      tasks: tasks
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'task.info', @handleTaskInfo
    window.addEventListener 'battle.result', @handleBattleResult
    window.addEventListener 'view.main.visible', @handleVisibleResponse
    @interval = setInterval @refreshDay, 30000
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'task.info', @handleTaskInfo
    window.removeEventListener 'battle.result', @handleBattleResult
    window.removeEventListener 'view.main.visible', @handleVisibleResponse
    clearInterval @interval
  render: ->
    <Panel bsStyle="default">
    {
      for i in [0..5]
        if @state.tasks[i].tracking
          <div className="panel-item task-item" key={i}>
            <OverlayTrigger placement={if (!window.doubleTabbed) && (window.layout == 'vertical') then 'top' else 'left'} overlay={<Tooltip id="task-quest-name-#{i}"><strong>{@state.tasks[i].name}</strong><br />{@state.tasks[i].content}</Tooltip>}>
              <div className="quest-name">
                <span className="cat-indicator" style={backgroundColor: getCategory @state.tasks[i].category}></span>
                {@state.tasks[i].name}
              </div>
            </OverlayTrigger>
            <div>
              <OverlayTrigger placement='left' overlay={<Tooltip id="task-progress-#{i}">{getToolTip @state.tasks[i].id}</Tooltip>}>
                <Label className="quest-progress" bsStyle={getStyleByPercent @state.tasks[i].percent}>{@state.tasks[i].progress}</Label>
              </OverlayTrigger>
            </div>
          </div>
        else
          <div className="panel-item task-item" key={i}>
            <OverlayTrigger placement={if (!window.doubleTabbed) && (window.layout == 'vertical') then 'top' else 'left'} overlay={<Tooltip id="task-name-#{i}"><strong>{@state.tasks[i].name}</strong><br />{@state.tasks[i].content}</Tooltip>}>
              <div className="quest-name">
                <span className="cat-indicator" style={backgroundColor: getCategory @state.tasks[i].category}></span>
                {@state.tasks[i].name}
              </div>
            </OverlayTrigger>
            <div>
              <Label className="quest-progress" bsStyle={getStyleByProgress @state.tasks[i].progress}>{@state.tasks[i].progress}</Label>
            </div>
          </div>
    }
    </Panel>

module.exports = TaskPanel
