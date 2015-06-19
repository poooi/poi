{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap

prevHours = (new Date()).getUTCHours()
interval = null

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

TaskPanel = React.createClass
  getInitialState: ->
    tasks: [
        name: '未接受'
        id: 100000
        content: '...'
        progress: ''
        category: 0
        type: 0
      ,
        name: '未接受'
        id: 100000
        content: '...'
        progress: ''
        category: 0
        type: 0
      ,
        name: '未接受'
        id: 100000
        content: '...'
        progress: ''
        category: 0
        type: 0
      ,
        name: '未接受'
        id: 100000
        content: '...'
        progress: ''
        category: 0
        type: 0
      ,
        name: '未接受'
        id: 100000
        content: '...'
        progress: ''
        category: 0
        type: 0
      ,
        name: '未接受'
        id: 100000
        content: '...'
        progress: ''
        category: 0
        type: 0
    ]
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {tasks} = @state
    switch path
      when '/kcsapi/api_get_member/questlist'
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
          # Update current
          else
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
        tasks[idx] =
          name: '未接受'
          id: 100000
          content: '...'
          progress: ''
          category: 0
          type: 0
      # Stop quest
      when '/kcsapi/api_req_quest/stop'
        idx = _.findIndex tasks, (e) ->
          e.id == parseInt(postBody.api_quest_id)
        return if idx == -1
        tasks[idx] =
          name: '未接受'
          id: 100000
          content: '...'
          progress: ''
          category: 0
          type: 0
    tasks = _.sortBy tasks, (e) ->
      e.id
    @setState
      tasks: tasks
    event = new CustomEvent 'task.change',
      bubbles: true
      cancelable: true
      detail:
        tasks: tasks
    window.dispatchEvent event
  refreshDay: ->
    curHours = (new Date()).getUTCHours()
    return if prevHours == curHours
    # UTC 20:00 -> Beijing 4:00 -> Tokyo 5:00
    if prevHours <= 19 and curHours >= 20
      {tasks} = @state
      for task, idx in tasks
        continue if task.id == 100000
        if task.type in [2, 4, 5]
          tasks[idx] =
            name: '未接受'
            id: 100000
            content: '...'
            progress: ''
            category: 0
            type: 0
        if task.type is 3 and (new Date()).getUTCDay() is 0
          tasks[idx] =
            name: '未接受'
            id: 100000
            content: '...'
            progress: ''
            category: 0
            type: 0
      tasks = _.sortBy tasks, (e) ->
        e.id
      @setState
        tasks: tasks
      event = new CustomEvent 'task.change',
        bubbles: true
        cancelable: true
        detail:
          tasks: tasks
      window.dispatchEvent event
    prevHours = curHours
  handleTaskInfo: (e) ->
    {tasks} = e.detail
    @setState
      tasks: tasks
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'task.info', @handleTaskInfo
    interval = setInterval @refreshDay, 30000
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'task.info', @handleTaskInfo
    clearInterval interval
  render: ->
    <Panel header="任务" bsStyle="success">
      <Table>
        <tbody>
        {
          for i in [0..5]
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
