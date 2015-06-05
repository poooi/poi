{React} = window
module.exports = React.createClass
  render: ->
    <div className="divider">
      <h5>{@props.text}</h5>
      <hr />
    </div>
