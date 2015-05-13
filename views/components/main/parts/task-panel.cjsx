{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel, Table} = ReactBootstrap

TaskPanel = React.createClass
  getInitialState: ->
    tasks: [
        name: '未接受'
        progress: ''
      ,
        name: '未接受'
        progress: ''
      ,
        name: '未接受'
        progress: ''
      ,
        name: '未接受'
        progress: ''
      ,
        name: '未接受'
        progress: ''
    ]
  componentDidMount: ->
    setTimeout ->
      # Fix task panel height
      height = window.getComputedStyle($('.mission-panel .panel-body')).height
      $('.task-panel .panel-body').style.height = "#{height}"
    , 2000
  render: ->
    <Panel header="任务" bsStyle="primary">
      <Table>
        <tbody>
        {
          for i in [0..4]
            <tr>
              <td>{@state.tasks[i].name}</td>
              <td>{@state.tasks[i].progress}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = TaskPanel
