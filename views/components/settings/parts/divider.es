import React from 'react'
export default class Divider extends React.Component{
  static propTypes = {
    text: React.PropTypes.string,
  }
  render() {
    return (
      <div className="divider" style={{cursor: 'default'}}>
        <h5>{this.props.text}</h5>
        <hr />
      </div>)
  }
}
