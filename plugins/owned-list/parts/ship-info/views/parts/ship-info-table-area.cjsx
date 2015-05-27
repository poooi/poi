{React, ReactBootstrap} = window
{Panel, Table} = ReactBootstrap

ShipInfoTableArea = React.createClass
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
					<tr>
						<td>1</td>
						<td>10</td>
						<td>正规空母</td>
						<td>赤城</td>
						<td>Lv.117</td>
						<td>100</td>
						<td>999</td>
						<td>999</td>
						<td>999</td>
						<td>999</td>
						<td>999</td>
						<td>999</td>
						<td>此 处 装 备</td>
					</tr>
				</tbody>
			</Table>

module.exports = ShipInfoTableArea