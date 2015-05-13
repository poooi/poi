{$, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel} = ReactBootstrap
module.exports =
  name: 'ShipView'
  priority: 0.1
  displayName: '舰队'
  description: '舰队展示页面，展示舰队详情信息'
  reactClass: React.createClass
    render: ->
      <div>
        <Panel header='test' bsStyle='warning'>
          Test
        </Panel>
        <Panel header='test2' bsStyle='primary'>
          Test
        </Panel>
      </div>
