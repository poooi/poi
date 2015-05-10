{remote, $, $$, React, ReactBootstrap} = window
{Button, TabbedArea, TabPane} = ReactBootstrap

ControlledTabArea = React.createClass
  getInitialState: ->
    key: 1
  handleSelect: (key) ->
    console.log "select #{key}"
    @setState {key}
  render: ->
    <TabbedArea activeKey={@state.key} onSelect={@handleSelect}>
      <TabPane eventKey={1} tab='Tab 1'>
      </TabPane>
      <TabPane eventKey={2} tab='Tab 2'>
      </TabPane>
      <TabPane eventKey={3} tab='Tab 3'>
      </TabPane>
    </TabbedArea>

React.render <ControlledTabArea />, $('poi-nav-tabs')
