{React, ReactBootstrap, jQuery} = window
{Panel, Button, Input, Col, Grid} = ReactBootstrap

sortPanelTitle =
  <h3>排序设置</h3>

filterPanelTitle =
  <h3>过滤器设置</h3>

ShipInfoCheckboxArea = React.createClass
  handleClickAscend: ->
    @props.sortRules($('#sortbase').value,0)
  handleClickDescend: ->
    @props.sortRules($('#sortbase').value,1)
  handleClickCheckbox: ->
    checkboxes = []
    jQuery('#checkboxPanel input[type=checkbox]').each ->
      if jQuery(this).prop "checked" then checkboxes.push jQuery(this).val()
    for box,index in checkboxes
      checkboxes[index] = parseInt(box)
    @props.filterRules(checkboxes)

  render: ->
    <div>
      <Panel collapsible header={sortPanelTitle} bsStyle='primary'>
        <Grid>
          <Col xs={8} md={8}>
            <Input id='sortbase' type='select' label='选择排序规则' placeholder='id'>
              <option value='id'>ID</option>
              <option value='type'>舰种</option>
              <option value='name'>舰名</option>
              <option value='lv'>等级</option>
              <option value='cond'>状态</option>
              <option value='karyoku'>火力</option>
              <option value='raisou'>雷装</option>
              <option value='taiku'>对空</option>
              <option value='soukou'>装甲</option>
              <option value='lucky'>幸运</option>
              <option value='sakuteki'>索敌</option>
            </Input>
          </Col>
          <Col xs={4} md={4}>
            <Button bsStyle="info" onClick={@handleClickAscend} block>升序</Button>
            <Button bsStyle="info" onClick={@handleClickDescend} block>降序</Button>
          </Col>
        </Grid>
      </Panel>

      <Panel collapsible header={filterPanelTitle} bsStyle='primary' id='checkboxPanel'>
        <Grid>
          <Col xs={2} md={2}>
            <p>舰种筛选</p>
          </Col>
          <Col xs={5} md={5}>
            <Input type='checkbox' label='駆逐艦' value='2' />
            <Input type='checkbox' label='軽巡洋艦' value='3' />
            <Input type='checkbox' label='重雷装巡洋艦' value='4' />
            <Input type='checkbox' label='重巡洋艦' value='5' />
            <Input type='checkbox' label='航空巡洋艦' value='6' />
            <Input type='checkbox' label='軽空母' value='7' />
            <Input type='checkbox' label='戦艦' value='8' />
            <Input type='checkbox' label='航空戦艦' value='10' />
            <Input type='checkbox' label='正規空母' value='11' />
          </Col>
          <Col xs={5} md={5}>
            <Input type='checkbox' label='潜水艦' value='13' />
            <Input type='checkbox' label='潜水空母' value='14' />
            <Input type='checkbox' label='水上機母艦' value='16' />
            <Input type='checkbox' label='揚陸艦' value='17' />
            <Input type='checkbox' label='装甲空母' value='18' />
            <Input type='checkbox' label='工作艦' value='19' />
            <Input type='checkbox' label='潜水母艦' value='20' />
            <Input type='checkbox' label='練習巡洋艦' value='21' />
          </Col>
        </Grid>
        <Grid>
          <Col xs={2} md={2}>
            <Button bsStyle="info" onClick={@handleClickCheckbox} block>确认设置</Button>
          </Col>
        </Grid>
      </Panel>
    </div>

module.exports = ShipInfoCheckboxArea
