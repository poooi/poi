path = require 'path-extra'
{relative, join} = require 'path-extra'
{Alert, Grid, Col, Input, DropdownButton, Table, MenuItem, Button} = ReactBootstrap

shipGirlType = [  '潜水艦',
  '駆逐艦', '軽巡洋艦','重雷装巡洋艦', '練習巡洋艦','水上機母艦','潜水空母','揚陸艦',
  '重巡洋艦', '航空巡洋艦','高速戦艦', '軽空母', '潜水母艦',
  '戦艦', '航空戦艦', '正規空母','装甲空母', '工作艦',   ]
repairRate = [  0.5,
  1.0,1.0,1.0,1.0,1.0,1.0,1.0,
  1.5,1.5,1.5,1.5,1.5,
  2.0,2.0,2.0,2.0,2.0 ]

module.exports = {
  name: "Repair"
  displayName:  [<FontAwesome name='medkit' key={0} />, ' 修理时间']
  priority: 998
  author: "Ayaphis"
  link: "https://github.com/Ayaphis"
  description: "舰娘修理时间"
  version: "0.1.0"
  reactClass: React.createClass
    getInitialState:->
      _shipGirlType : shipGirlType[0]
      shipLevel : 1
      shipDamage : 1
      rT1 : "5s"
      rTT : "5s"
    formatTime:(seconds)->
      tempT= ''
      _seconds = seconds
      if _seconds >= 3600
        tempT = tempT + Math.floor(_seconds/3600) + 'h'
      _seconds = _seconds % 3600
      if _seconds >= 60
        tempT = tempT + Math.floor(_seconds/60) + 'm'
      _seconds = _seconds % 60
      return tempT + _seconds + 's'
    handleChange:( __shipGirlType,_shipLevel,_shipDamage)->
      for x, i in shipGirlType
        if x == __shipGirlType
          _shipGirlTypeKey = i
      if _shipLevel < 12
        _rT1 = _shipLevel*10*repairRate[_shipGirlTypeKey]
      else
        _rT1 =(_shipLevel*5+Math.floor(_shipLevel-11) + 50)*repairRate[_shipGirlTypeKey]
      _rTT = _rT1*_shipDamage
      @setState
        _shipGirlType : __shipGirlType
        shipLevel : _shipLevel
        shipDamage : _shipDamage
        rT1 : @formatTime _rT1
        rTT : @formatTime _rTT
    handleSGTChange:(e)->
      @handleChange  e.target.value,@state.shipLevel,@state.shipDamage
    handleSGLChange:(e)->
      @handleChange  @state._shipGirlType,e.target.value,@state.shipDamage
    handleSGDChange:(e)->
      @handleChange  @state._shipGirlType,@state.shipLevel,e.target.value
    render:->
      <div>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'repair.css')} />
        <Grid>
          <Col xs = 12>
            <Input type="select" label="舰娘类型" onChange={@handleSGTChange}>
            {
              for x, i in shipGirlType
                <option key={i} value={shipGirlType[i]}>{x}</option>
            }
            </Input>
          </Col>
          <Col xs=6>
            <Input type="text" label="等级" value={@state.shipLevel} onChange={@handleSGLChange} />
          </Col>
          <Col xs=6>
            <Input type="text" label="损伤" value={@state.shipDamage} onChange={@handleSGDChange} />
          </Col>
        </Grid>
        <Table>
          <tbody>
            <tr key={0}>
              <td width="10%">　</td>
              <td width="40%">1HP维修时间</td>
              <td width="50%">总维修时间</td>
            </tr>
            <tr key={1}>
              <td width="10%">　</td>
              <td width="40%">{@state.rT1}</td>
              <td width="50%">{@state.rTT}</td>
            </tr>
          </tbody>
        </Table>
      </div>
};
