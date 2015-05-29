{React, ReactBootstrap} = window
{Panel, Button, Input, Col, Grid} = ReactBootstrap

filterPanelTitle = 
	<h3>排序设置</h3>

ShipInfoCheckboxArea = React.createClass
	handleClickAscend: ->
		@props.sortRules($('#sortbase').value,1)	
	handleClickDescend: ->
		@props.sortRules($('#sortbase').value,0)
	render: ->
		<Panel collapsible header={filterPanelTitle} bsStyle='primary' id='paneltest'>
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
					<Button bsStyle="info" onClick={@handleClickAscend}>升序</Button>
					<Button bsStyle="info" onClick={@handleClickDescend}>降序</Button>
			  </Col>
	    </Grid>
		</Panel>

module.exports = ShipInfoCheckboxArea