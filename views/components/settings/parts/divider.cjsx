{React} = window
module.exports = React.createClass
  render: ->
    <div className="divider" style={cursor: 'default'}>
      <h5>{@props.text}</h5>
      <hr />
    </div>
