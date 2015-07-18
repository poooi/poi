{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
path = require 'path-extra'
fs = require 'fs-extra'
QuestTracker = if 'index.cjsx' in fs.readdirSync(path.join(ROOT, 'plugins', 'quest-tracker')) then true else false

# Local time -> Task Refresh time(GMT + 4)
getCurrentDay = ->
  curTime = new Date()
  curTime.setTime(curTime.getTime() + (curTime.getTimezoneOffset() + 240) * 60000)
  curTime.getDay()

prevDay = getCurrentDay()

getType = (api_category) ->
  switch api_category
    when 0
      if window.isDarkTheme
        return '#ffffff'
      else
        return '#000000'
    when 1
      return '#21bb3a'
    when 2
      return '#e73939'
    when 3
      return '#87da61'
    when 4
      return '#32bab8'
    when 5
      return '#f4df22'
    when 6
      return '#cd6c48'
    when 7
      return '#c792e8'

getStyleByProgress = (progress) ->
  switch progress
    when '进行'
      return 'warning'
    when '50%'
      return 'primary'
    when '80%'
      return 'primary'
    when '达成'
      return 'success'
    else
      return 'default'

getStyleByPercent = (percent) ->
  if percent < 50
    return 'warning'
  if percent < 100
    return 'primary'
  if percent == 100
    return 'success'
  return 'default'

emptyTask =
  name: '未接受'
  id: 100000
  content: '...'
  progress: ''
  category: 0
  type: 0

TaskPanel = React.createClass
  getInitialState: ->
    percent: [0, 0, 0, 0, 0, 0]
    progress: [0, 0, 0, 0, 0, 0]
    target: [1, 1, 1, 1, 1, 1]
    codeA: [0, 0, 0, 0]
    tasks: [Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask),
            Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask)]
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {tasks} = @state
    flag = false
    switch path
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
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
        tasks[idx] = Object.clone(emptyTask)
        flag = true
      # Stop quest
      when '/kcsapi/api_req_quest/stop'
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
        tasks[idx] = Object.clone(emptyTask)
        flag = true
    if flag
      tasks = _.sortBy tasks, (e) -> e.id
      @setState
        tasks: tasks
      event = new CustomEvent 'task.change',
        bubbles: true
        cancelable: true
        detail:
          tasks: tasks
      window.dispatchEvent event
  refreshDay: ->
    curDay = getCurrentDay()
    return if prevDay == curDay
    {tasks} = @state
    for task, idx in tasks
      continue if task.id == 100000
      if task.type in [2, 4, 5]
        tasks[idx] = Object.clone(emptyTask)
      if task.type is 3 and curDay is 1
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
    prevDay = curDay
  handleTaskInfo: (e) ->
    {tasks} = e.detail
    @setState
      tasks: tasks
  handleTaskUpdate: (e) ->
    {codeA, percent, progress, target} = e.detail
    @setState
      codeA: codeA
      percent: percent
      progress: progress
      target: target
  componentDidMount: ->
    window.addEventListener 'task.update', @handleTaskUpdate
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'task.info', @handleTaskInfo
    @interval = setInterval @refreshDay, 30000
  componentWillUnmount: ->
    window.removeEventListener 'task.update', @handleTaskUpdate
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'task.info', @handleTaskInfo
    clearInterval @interval
  render: ->
    <Panel header="任务" bsStyle="success">
      <Table>
        <tbody>
        {
          for i in [0..5]
            <tr key={i}>
              <OverlayTrigger placement='left' overlay={<Tooltip><strong>{@state.tasks[i].name}</strong><br />{@state.tasks[i].content}</Tooltip>}>
                <td style={color: getType @state.tasks[i].category}>{@state.tasks[i].name}</td>
              </OverlayTrigger>
              <td>
                {
                  if QuestTracker
                    <OverlayTrigger placement='left' overlay={<Tooltip>{
                          if @state.tasks[i].id != 214
                            <span>"当前进度: #{@state.progress[i]} / #{@state.target[i]}"</span>
                          else
                            <span>"当前进度: "<br/>
                              "出击: #{@state.codeA[0]}"<br/>
                              "S胜: #{@state.codeA[1]}" <br/>
                              "Boss战: #{@state.codeA[2]}" <br/>
                              "Boss战S胜: #{@state.codeA[3]}"
                            </span>}</Tooltip>}>
                      <Label style={if @state.tasks[i].id == 100000 then display:"none"}
                             bsStyle={getStyleByPercent @state.percent[i]}>
                        {@state.percent[i]}%
                      </Label>
                    </OverlayTrigger>
                  else
                    <Label bsStyle={getStyleByProgress @state.tasks[i].progress}>{@state.tasks[i].progress}</Label>
                }
              </td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = TaskPanel
