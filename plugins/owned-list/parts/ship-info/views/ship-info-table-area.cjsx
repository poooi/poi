{React, ReactBootstrap} = window
{Panel, Table} = ReactBootstrap

ShipInfoTable = React.createClass
		render: ->
			<tr>
				<td>{@props.index}</td>
				<td>{@props.id}</td>
				<td>{@props.type}</td>
				<td>{@props.name}</td>
				<td>{@props.lv}</td>
				<td>{@props.cond}</td>
				<td>{@props.karyoku}</td>
				<td>{@props.raisou}</td>
				<td>{@props.taiku}</td>
				<td>{@props.soukou}</td>
				<td>{@props.lucky}</td>
				<td>{@props.sakuteki}</td>
				<td>此 处 装 备</td>
			</tr>

ShipInfoTableArea = React.createClass
	getInitialState: ->
		rows: []
	handleResponse: (e) ->
		{method, path, body, postBody} = e.detail
		{$shipTypes, $ships, _ships} = window
		{rows} = @state
		if path is '/kcsapi/api_port/port' or path is '/kcsapi/api_req_kousyou/getship'
			rows = []
			for ship in _ships
				row = 
					id: ship.api_id
					type: $shipTypes[$ships[ship.api_ship_id].api_stype].api_name
					name: $ships[ship.api_ship_id].api_name
					lv:	ship.api_lv
					cond: ship.api_cond
					karyoku: ship.api_karyoku[0]
					raisou: ship.api_raisou[0]
					taiku: ship.api_taiku[0]
					soukou: ship.api_soukou[0]
					lucky: ship.api_lucky[0]
					sakuteki: ship.api_sakuteki[0]
				rows.push row
		@setState
			rows: rows

	componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
	render: ->
		<Table striped bordered condensed hover>
			<thead>
				<tr>
					<th>NO</th>
					<th>ID</th>
					<th>舰种</th>
					<th>舰名</th>
					<th>等级</th>
					<th>状态</th>
					<th>火力</th>
					<th>雷装</th>
					<th>对空</th>
					<th>装甲</th>
					<th>幸运</th>
					<th>索敌</th>
					<th>装备</th>
				</tr>
			</thead>
			<tbody>
			{
				for row, index in @state.rows
					<ShipInfoTable 
						key = {index}
						index = {index + 1}
						id = {row.id}
						type = {row.type}
						name = {row.name}
						lv = {row.lv}
						cond = {row.cond}
						karyoku = {row.karyoku}
						raisou = {row.raisou}
						taiku = {row.taiku}
						soukou = {row.soukou}
						lucky = {row.lucky}
						sakuteki = {row.sakuteki}
						/>
			}
			</tbody>
		</Table>

module.exports = ShipInfoTableArea