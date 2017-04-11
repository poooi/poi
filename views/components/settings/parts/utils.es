import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Row, Col, Grid, Checkbox, Radio } from 'react-bootstrap'
import fs from 'fs-extra'
import { get } from 'lodash'
import { remote } from 'electron'

const { dialog } = remote.require('electron')
const { config } = window

export const CheckboxLabelConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    undecided: props.undecided,
    label: props.label,
  })
})(class checkboxLabelConfig extends Component {
  static propTypes = {
    label: React.PropTypes.string,
    configName: React.PropTypes.string,
    value: React.PropTypes.bool,
    undecided: React.PropTypes.bool,
  }
  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }
  render () {
    return (
      <div className={this.props.undecided ? 'undecided-checkbox-inside' : ''} >
        <Checkbox
          disabled={this.props.undecided}
          checked={this.props.undecided ? false : this.props.value}
          onChange={this.props.undecided ? null : this.handleChange}>
          {this.props.label}
        </Checkbox>
      </div>
    )
  }
})

export const RadioConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    label: props.label,
    availableVal: props.availableVal,
  })
})(class radioConfig extends Component {
  static propTypes = {
    label: React.PropTypes.string,
    configName: React.PropTypes.string,
    value: React.PropTypes.string,
    availableVal: React.PropTypes.array,
  }
  onSelect = (value) => {
    config.set(this.props.configName, value)
  }
  render() {
    return (
      <Grid>
        {
          this.props.availableVal.map((item, index) => {
            return (
              <Col key={index} xs={3}>
                <Radio checked={this.props.value === item.value}
                       onChange={this.onSelect.bind(this, item.value)} >
                  {item.name}
                </Radio>
              </Col>
            )
          })
        }
      </Grid>
    )
  }
})


export const FolderPickerConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    label: props.label,
  })
})(class extends Component {
  static propTypes = {
    label: React.PropTypes.string,
    configName: React.PropTypes.string,
    value: React.PropTypes.string,
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
    if (fs.statSync(droppedFiles[0].path).isDirectory()) {
      this.setPath(droppedFiles[0].path)
    }
  }
  folderPickerOnClick = () => {
    this.synchronize(() => {
      fs.ensureDirSync(this.props.value)
      const filenames = dialog.showOpenDialog({
        title: this.props.label,
        defaultPath: this.props.value,
        properties: [
          'openDirectory',
          'createDirectory',
        ],
      })
      if (filenames !== undefined) {
        this.setPath(filenames[0])
      }
    })
  }
  render() {
    return (
      <Grid>
        <Col xs={12}>
          <div className="folder-picker"
               onClick={this.folderPickerOnClick}
               onDrop={this.folderPickerOnDrop}
               onDragEnter={this.onDrag}
               onDragOver={this.onDrag}
               onDragLeave={this.onDrag}>
            {this.props.value}
          </div>
        </Col>
      </Grid>
    )
  }
})
