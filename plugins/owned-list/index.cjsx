{React, ReactBootstrap} = window
{ButtonGroup} = ReactBootstrap
{ShipButton, ItemButton} = require './parts'
module.exports = 
	name: 'OwnedList'
	priority: 50
	displayName: '详细信息'
	description: '提供已有舰娘和已有装备详细信息查看'
	reactClass: React.createClass
		render: ->
			<div>
				<ShipButton ref="shipButton" />
				<ItemButton ref="itemButton" /> 
			</div>
