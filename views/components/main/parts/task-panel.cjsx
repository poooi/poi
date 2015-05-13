{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel, Table, Label} = ReactBootstrap

getStyleByProgress = (progress) ->
  switch progress
    when '进行中'
      return 'default'
    when '50%'
      return 'info'
    when '80%'
      return 'primary'
    when '达成'
      return 'success'
    else
      return 'default'

TaskPanel = React.createClass
  getInitialState: ->
    tasks: [
        name: '未接受'
        id: 100000
        progress: '-'
      ,
        name: '未接受'
        id: 100000
        progress: '-'
      ,
        name: '未接受'
        id: 100000
        progress: '-'
      ,
        name: '未接受'
        id: 100000
        progress: '-'
      ,
        name: '未接受'
        id: 100000
        progress: '-'
    ]
  handleResponse: (method, path, body, postBody) ->
    {tasks} = @state
    switch path
      when '/kcsapi/api_get_member/questlist'
        for task in body.api_list
          continue if task is -1 || task.api_state < 2
          # Determine progress
          progress = '进行中'
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
              progress: progress
          # Update current
          else
            tasks[idx] =
              name: task.api_title
              id: task.api_no
              progress: progress
      # Finish quest
      when '/kcsapi/api_req_quest/clearitemget'
        idx = _.findIndex tasks, (e) ->
          e.id == postBody.api_quest_id
        return if idx == -1
        tasks[idx] =
          name: '未接受'
          id: 100000
          progress: '-'
      # Stop quest
      when '/kcsapi/api_req_quest/stop'
        idx = _.findIndex tasks, (e) ->
          e.id == postBody.api_quest_id
        return if idx == -1
        tasks[idx] =
          name: '未接受'
          id: 100000
          progress: '-'
    tasks = _.sortBy tasks, (e) ->
      e.id
    @setState
      tasks: tasks
  componentDidMount: ->
    # Fix task panel height uglily
    setTimeout ->
      height = window.getComputedStyle($('.mission-panel .panel-body')).height
      $('.task-panel .panel-body').style.height = "#{height}"
    , 2000
    proxy.addListener 'game.response', @handleResponse
  componentWillUnmount: ->
    proxy.removeListener 'game.response', @handleResponse
  render: ->
    <Panel header="任务" bsStyle="primary">
      <Table>
        <tbody>
        {
          for i in [0..4]
            <tr>
              <td>{@state.tasks[i].name}</td>
              <td>
                <Label bsStyle={getStyleByProgress @state.tasks[i].progress}>{@state.tasks[i].progress}</Label>
              </td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = TaskPanel
