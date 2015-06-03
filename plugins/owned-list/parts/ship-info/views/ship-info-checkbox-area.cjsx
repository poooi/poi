{React, ReactBootstrap, jQuery} = window
{Panel, Button, Input, Col, Grid} = ReactBootstrap
Divider = require './divider'
shipTypes = ['', '海防艦', '駆逐艦', '軽巡洋艦', '重雷装巡洋艦', '重巡洋艦', '航空巡洋艦', '軽空母', '戦艦', '航空戦艦', '正規空母',
             '潜水艦', '潜水空母', '水上機母艦', '揚陸艦', '装甲空母', '工作艦', '潜水母艦', '練習巡洋艦']

ShipInfoCheckboxArea = React.createClass
  getInitialState: ->
    checked: [false, false, true, true, true, true, true, true, true, true, true, true,
              true, true, true, true, true, true, true, true, true, true, true, true]
  handleClickAscend: ->
    @props.sortRules($('#sortbase').value, 0)
  handleClickDescend: ->
    @props.sortRules($('#sortbase').value, 1)
  handleClickCheckbox: (index) ->
    checkboxes = []
    {checked} = @state
    checked[index] = !checked[index]
    for shipType, i in shipTypes
      checkboxes.push i if checked[i]
    @setState {checked}
    @props.filterRules(checkboxes)
  render: ->
    <div id='ship-info-settings'>
      <Divider text="排序设置" />
      <Grid className='vertical-center'>
        <Col xs={2}>排序规则</Col>
        <Col xs={6}>
          <Input id='sortbase' type='select' placeholder='id'>
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
        <Col xs={2}>
          <Button bsStyle="info" bsSize='small' onClick={@handleClickAscend} block>升序</Button>
        </Col>
        <Col xs={2}>
          <Button bsStyle="info" bsSize='small' onClick={@handleClickDescend} block>降序</Button>
        </Col>
      </Grid>
      <Divider text="舰种过滤" />
      <Grid id='ship-info-filter'>
      {
        for shipType, index in shipTypes
          continue if index < 2
          <Col key={index} xs={2}>
            <Input type='checkbox' label={shipType} key={index} value={index} onChange={@handleClickCheckbox.bind(@, index)} checked={@state.checked[index]} />
          </Col>
      }
      </Grid>
    </div>

module.exports = ShipInfoCheckboxArea
