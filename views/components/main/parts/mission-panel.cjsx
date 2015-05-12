{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel, Table} = ReactBootstrap
{resolveTime} = window

MissionPanel = React.createClass
  getInitialState: ->
    decks: [
        api_name: '第0艦隊'
        countdown: -1
      ,
        api_name: '第1艦隊'
        countdown: -1
      ,
        api_name: '第2艦隊'
        countdown: -1
      ,
        api_name: '第3艦隊'
        countdown: -1
      ,
        api_name: '第4艦隊'
        countdown: -1
    ]
    notified: []
  render: ->
    <Panel header="远征" bsStyle="info">
      <Table>
        <tbody>
        {
          for i in [1..4]
            countdown = ''
            if @state.decks[i]?.countdown >= 0
              coutndown = resolveTime @state.decks[i].countdown
            <tr>
              <td>{@state.decks[i]?.api_name}</td>
              <td>{countdown}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = MissionPanel
