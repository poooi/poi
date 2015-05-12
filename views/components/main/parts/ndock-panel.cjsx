{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{allShips, myShips} = window
{resolveTime} = window
{Panel, Table} = ReactBootstrap

NdockPanel = React.createClass
  getInitialState: ->
    docks: [
        api_ship_id: -1
        countdown: -1
      ,
        api_ship_id: -1
        countdown: -1
      ,
        api_ship_id: -1
        countdown: -1
      ,
        api_ship_id: -1
        countdown: -1
      ,
        api_ship_id: -1
        countdown: -1
    ]
    notified: []
  render: ->
    <Panel header="入渠" bsStyle="warning">
      <Table>
        <tbody>
        {
          for i in [1..4]
            name = '未使用'
            if @state.docks[i]?.api_ship_id >= 0
              name = allShips[myShips[@state.docks[i].api_ship_id].api_ship_id].api_name
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

module.exports = NdockPanel
