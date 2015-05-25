{React, ReactBootstrap} = window
{Button} = ReactBootstrap 

ItemButton = React.createClass
	render: ->
		<Button bsStyle='info' bsSize='large' block>装备信息</Button>

module.exports = ItemButton