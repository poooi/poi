{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap

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
      return 'info'
    when '达成'
      return 'success'
    else
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
    tasks: [Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask),
            Object.clone(emptyTask), Object.clone(emptyTask), Object.clone(emptyTask)]
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {tasks} = @state
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
      # Finish quest
      when '/kcsapi/api_req_quest/clearitemget'
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
        tasks[idx] = Object.clone(emptyTask)
      # Stop quest
      when '/kcsapi/api_req_quest/stop'
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
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
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'task.info', @handleTaskInfo
    @interval = setInterval @refreshDay, 30000
  componentWillUnmount: ->
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
                <Label bsStyle={getStyleByProgress @state.tasks[i].progress}>{@state.tasks[i].progress}</Label>
              </td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = TaskPanel
