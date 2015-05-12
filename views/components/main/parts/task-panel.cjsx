{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel, Table} = ReactBootstrap

TaskPanel = React.createClass
  getInitialState: ->
    tasks: [
        task: -1
        progress: -1
      ,
        task: -1
        progress: -1
      ,
        task: -1
        progress: -1
      ,
        task: -1
        progress: -1
      ,
        task: -1
        progress: -1
    ]
  render: ->
    <Panel header="任务" bsStyle="primary">
      <Table>
        <tbody>
        {
          for i in [0..4]
            name = '未接受的任务'
            if @state.tasks[i]?.task >= 0
              name = @state.tasks[i]?.task
            progress = ''
            <tr>
              <td>{name}</td>
              <td>{progress}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = TaskPanel
