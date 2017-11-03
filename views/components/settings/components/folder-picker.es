import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import fs from 'fs-extra'
import { get } from 'lodash'
import { remote } from 'electron'

const { dialog } = remote.require('electron')
const { config } = window

const FolderPickerConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    label: props.label,
  })
})(class extends Component {
  static propTypes = {
    label: PropTypes.string,
    configName: PropTypes.string,
    value: PropTypes.string,
    isFolder: PropTypes.bool,
    placeholder: PropTypes.string,
  }
  static defaultProps = {
    isFolder: true,
  }
  onDrag = (e) => {
    e.preventDefault()
  }
  synchronize = (callback) => {
    if (this.lock) {
      return
    }
    this.lock = true
    callback()
    this.lock = false
  }
  setPath = (val) => {
    config.set(this.props.configName, val)
  }
  folderPickerOnDrop = (e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (fs.statSync(droppedFiles[0].path).isDirectory() || !this.props.isFolder) {
      this.setPath(droppedFiles[0].path)
    }
  }
  folderPickerOnClick = () => {
    this.synchronize(() => {
      let defaultPath
      try {
        if (this.props.isFolder) {
          fs.ensureDirSync(this.props.value)
          defaultPath = this.props.value
        }
      } catch (e) {
        defaultPath = remote.app.getPath('desktop')
      }
      const filenames = dialog.showOpenDialog({
        title: this.props.label,
        defaultPath,
        properties: this.props.isFolder ? [
          'openDirectory',
          'createDirectory',
        ] : [
          'openFile',
        ],
      })
      if (filenames !== undefined) {
        this.setPath(filenames[0])
      }
    })
  }
  render() {
    return (
      <div className="folder-picker"
        onClick={this.folderPickerOnClick}
        onDrop={this.folderPickerOnDrop}
        onDragEnter={this.onDrag}
        onDragOver={this.onDrag}
        onDragLeave={this.onDrag}
      >
        {this.props.value || this.props.placeholder}
      </div>
    )
  }
})

export default FolderPickerConfig
