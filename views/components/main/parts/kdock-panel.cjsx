{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{allShips, myShips} = window
{resolveTime} = window
{Panel, Table} = ReactBootstrap

KdockPanel = React.createClass
  getInitialState: ->
    docks: [
        api_created_ship_id: -1
        countdown: -1
      ,
        api_created_ship_id: -1
        countdown: -1
      ,
        api_created_ship_id: -1
        countdown: -1
      ,
        api_created_ship_id: -1
        countdown: -1
      ,
        api_created_ship_id: -1
        countdown: -1
    ]
    notified: []
  render: ->
    <Panel header="建造" bsStyle="danger">
      <Table>
        <tbody>
        {
          for i in [1..4]
            name = '未使用'
            if @state.docks[i]?.api_created_ship_id >= 0
              name = allShips[@state.docks[i].api_created_ship_id].api_name
            else if @state.docks[i]?.api_ship_id == -2
              name = '未开启'
            countdown = ''
            if @state.docks[i]?.countdown >= 0
              countdown = resolveTime @state.docks[i].countdown
            <tr>
              <td>{name}</td>
              <td>{countdown}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = KdockPanel
