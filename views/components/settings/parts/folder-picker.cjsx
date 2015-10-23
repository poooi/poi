{$, $$, _, React, ROOT} = window
document.addEventListener 'DOMContentLoaded', ->
  # React.js wont render webkitdirectory attribute, so add this attribute using dom operaion.
  document.getElementById('folder-picker').setAttribute "webkitdirectory", ""
FolderPicker = React.createClass
  propTypes:
    onDrop: React.PropTypes.func
  onDragEnter: (e) ->
    e.preventDefault()
  onDragOver: (e) ->
    e.preventDefault()
  onDragLeave: (e) ->
    e.preventDefault()
  onDrop: (e) ->
    e.preventDefault()
    droppedFiles = if e.dataTransfer then e.dataTransfer.files else e.target.files
    @props.onDrop droppedFiles[0], e
  open: ->
    fileInput = React.findDOMNode(@refs.fileInput)
    fileInput.value = null
    fileInput.click()
  render: ->
    <div
      className="folder-picker"
      style={
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: '#666',
        borderStyle: 'dashed',
        borderRadius: 0,
        textAlign: 'center',
        padding: '5px',
      }
      onClick={@open}
      onDrop={@onDrop}
      onDragEnter={@onDragEnter}
      onDragOver={@onDragOver}
      onDragLeave={@onDragLeave}
    >
      {@props.children}
      <input
        type='file'
        ref='fileInput'
        id="folder-picker"
        style={{ display: 'none' }}
        multiple={false}
        onChange={@onDrop}
      />
    </div>

module.exports = FolderPicker
