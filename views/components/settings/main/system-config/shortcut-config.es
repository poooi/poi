import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { ipcRenderer } from 'electron'
import mousetrap from 'mousetrap'
import { get } from 'lodash'
import { Tag, Button, Intent, Dialog, Callout } from '@blueprintjs/core'
import { translate } from 'react-i18next'
import cls from 'classnames'
import styled from 'styled-components'

const { config } = window

const BorderlessDialog = styled(Dialog)`
  padding: 0;
`

let keyListener

config.on('config.set', (path, value) => {
  switch (path) {
  case 'poi.shortcut.bosskey':
    ipcRenderer.send('refresh-shortcut')
    break
  }
})

@translate(['setting'])
@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultValue),
  configName: props.configName,
}))
export class ShortcutConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
    active: PropTypes.bool,
    configName: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  }

  state = {
    recording: false,
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

  handleClickRecord = e => {
    keyListener = (character, modifiers, e) => {
      if (this.keyShouldIgnore(character, modifiers)) {
        return
      }
      keyListener = null
      if (character === 'esc' && modifiers.length === 0) {
        this.abortRecording()
      } else {
        this.setKey(character, modifiers)
      }
    }
    this.setState({ recording: true })
  }

  handleDisable = () => {
    this.setState({
      recording: false,
    })
    config.set(this.props.configName, '')
  }

  abortRecording = () => {
    this.setState({ recording: false })
  }

  transformKeyStr = (character, modifiers) => {
    const mapping = {
      shift: 'Shift',
      alt: 'Alt',
      ctrl: 'Ctrl',
      meta: 'ctrl' in modifiers ? 'Cmd' : 'CmdOrCtrl',
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
    const s = str_modifiers.concat([mapping[character] || character]).join('+')
    return s
  }

  setKey = (character, modifiers) => {
    const key = this.transformKeyStr(character, modifiers)
    this.setState({
      recording: false,
    })
    config.set(this.props.configName, key)
  }

  render() {
    const { disabled, value, className, t, ...props } = this.props
    const { recording } = this.state

    return (
      <div className={cls('shortcut-config', className)} {...props}>
        <Tag
          minimal
          disabled={disabled || recording}
          intent={disabled || !value ? Intent.NONE : Intent.SUCCESS}
        >
          {value || t('key not set')}
        </Tag>

        <BorderlessDialog autoFocus isOpen={recording} onClose={this.abortRecording}>
          <Callout intent={Intent.SUCCESS}>{t('Press the key, or Esc to cancel')}</Callout>
        </BorderlessDialog>

        <Button
          disabled={disabled}
          minimal
          intent={Intent.PRIMARY}
          onClick={this.handleClickRecord}
        >
          {value ? t('Change') : t('Set')}
        </Button>

        {!disabled &&
          value &&
          !recording && (
          <Button minimal intent={Intent.WARNING} onClick={this.handleDisable}>
            {t('Remove')}
          </Button>
        )}
      </div>
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
