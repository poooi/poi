{$, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel} = ReactBootstrap
module.exports =
  name: 'FactoryView'
  priority: 1
  displayName: '工厂'
  description: '工厂面板，提供工厂相关功能展示'
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
