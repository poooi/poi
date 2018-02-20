import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Col, Button, ButtonGroup } from 'react-bootstrap'
import { ipcRenderer } from 'electron'
import mousetrap from 'mousetrap'
import { get } from 'lodash'
import { Trans } from 'react-i18next'

const { config } = window

let keyListener

config.on('config.set', (path, value) => {
  switch(path) {
  case 'poi.shortcut.bosskey':
    ipcRenderer.send('refresh-shortcut')
    break
  }
})

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultVal),
  configName: props.configName,
}))
export class ShortcutConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
    active: PropTypes.bool,
    configName: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  }
  constructor (props) {
    super(props)
    this.state = {
      recording: false,
    }
  }
  displayText = () => {
    if (this.recording()) {
      return <Trans>setting:Press the key, or Esc to cancel</Trans>
    }
    else if (this.enabled()) {
      return `<${this.props.value}>`
    } else {
      return <Trans>setting:Disabled</Trans>
    }
  }
  active = () => ((typeof this.props.active === "undefined") ? true : this.props.active)
  showDisableButton = () => (this.active() && this.enabled() && !this.recording())
  recording = () => (this.state.recording)
  enabled = () => (!!this.props.value)
  handleClickAnywhere = (e) => {
    document.removeEventListener('mousedown', this.handleClickAnywhere)
    this.abortRecording()
  }
  keyShouldIgnore = (character, modifiers) => {
    if (character.length === 0) {
      return true
    }
    if (character.charCodeAt(0) < 32) {
      return true
    }
    return false
  }
  handleClickRecord = (e) => {
    keyListener = (character, modifiers, e) => {
      if (this.keyShouldIgnore(character, modifiers)) {
        return
      }
      keyListener = null
      if (character === 'esc' && modifiers.length === 0) {
        this.abortRecording()
      }
      else {
        this.setKey(character, modifiers)
      }
    }
    document.addEventListener('mousedown', this.handleClickAnywhere)
    this.setState({recording: true})
  }
  handleDisable = () => {
    this.setState({
      myval: null,
      recording: false,
    })
    this.newVal('')
  }
  abortRecording = () => {
    this.setState({recording: false})
  }
  transformKeyStr = (character, modifiers) => {
    const mapping = {
      shift: 'Shift',
      alt: 'Alt',
      ctrl: 'Ctrl',
      meta: ('ctrl' in modifiers) ? 'Cmd' : 'CmdOrCtrl',
      Del: 'Delete',
      Ins: 'Insert',
    }
    const str_modifiers = (() => {
      const results = []
      for (let i = 0; i < modifiers.length; i++) {
        results.push(mapping[modifiers[i]])
      }
      return results
    })()
    character = character[0].toUpperCase() + character.substr(1)
    const s = (str_modifiers.concat([mapping[character] || character])).join('+')
    return s
  }
  setKey = (character, modifiers) => {
    const s = this.transformKeyStr(character, modifiers)
    this.setState({
      recording: false,
    })
    this.newVal(s)
  }
  newVal = (val) =>{
    config.set(this.props.configName, val)
  }
  render() {
    return (
      <Col xs={12}>
        <ButtonGroup justified>
          <Button
            active={false}
            bsStyle="link"
            style={{width: '25%', align: 'left', cursor: 'default'}} >
            {this.props.label}
          </Button>
          <Button
            active={this.active()}
            disabled={!this.active() || this.recording()}
            bsStyle={!this.active() ? 'default' : (this.enabled() ? "success" : "danger")}
            onClick={this.recording() || (!this.active() ? null : this.handleClickRecord)}
            style={{width: '60%'}} >
            {this.displayText()}
          </Button>
          {
            this.showDisableButton() ?
              <Button bsStyle="danger"
                onMouseDown={this.handleDisable}
                style={{width: '15%'}}>
                <i className="fa fa-times"></i>
              </Button>
              :
              null
          }
        </ButtonGroup>
      </Col>
    )
  }
}

mousetrap.prototype.handleKey = (character, modifiers, e) => {
  if (e.type !== 'keydown' || ['shift', 'alt', 'ctrl', 'meta'].includes(character)) {
    return
  }
  const fn = keyListener
  if (typeof fn === 'function') {
    fn(character, modifiers, e)
  }
}
