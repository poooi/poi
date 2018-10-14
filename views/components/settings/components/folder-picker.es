import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import fs from 'fs-extra'
import { get, split, map } from 'lodash'
import { remote } from 'electron'
import i18next from 'views/env-parts/i18next'
import path from 'path'
import {
  Position,
  Button,
  Intent,
  Classes,
  OverflowList,
} from '@blueprintjs/core'
import { translate } from 'react-i18next'
import styled from 'styled-components'

import { Tooltip } from 'views/components/etc/panel-tooltip'

import { isSubdirectory } from 'views/utils/tools'

const { dialog } = remote.require('electron')
const { config } = window

const PickerBox = styled.div`
  display: flex;

  .bp3-overflow-list {
    flex: 1;
  }

  button {
    margin-left: 1em;
  }

  .bp3-breadcrumb {
    font-size: 12px;
  }
`

@translate(['setting'])
@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultVal),
  configName: props.configName,
  label: props.label,
}))
export class FolderPickerConfig extends Component {
  static propTypes = {
    label: PropTypes.string,
    configName: PropTypes.string,
    value: PropTypes.string,
    isFolder: PropTypes.bool,
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    exclude: PropTypes.arrayOf(PropTypes.string),
    defaultVal: PropTypes.string,
  }

  static defaultProps = {
    isFolder: true,
    exclude: [],
  }

  componentDidMount = () => {
    const { exclude, value, defaultVal, configName } = this.props
    if (exclude.length && exclude.some(parent => isSubdirectory(parent, value))) {
      this.emitErrorMessage()
      config.set(configName, defaultVal)
    }
  }

  handleOnDrag = e => {
    e.preventDefault()
  }

  synchronize = callback => {
    if (this.lock) {
      return
    }
    this.lock = true
    callback()
    this.lock = false
  }

  emitErrorMessage = () =>
    window.toast(i18next.t('setting:DirectoryNotAvailable', { path: this.props.label }), {
      type: 'warning',
      title: i18next.t('setting:Error'),
    })

  setPath = val => {
    const { exclude } = this.props
    if (exclude.length && exclude.some(parent => isSubdirectory(parent, val))) {
      this.emitErrorMessage()
      return
    }
    config.set(this.props.configName, val)
  }

  handleOnDrop = e => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (fs.statSync(droppedFiles[0].path).isDirectory() || !this.props.isFolder) {
      this.setPath(droppedFiles[0].path)
    }
  }

  handleOnClick = () => {
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
        properties: this.props.isFolder ? ['openDirectory', 'createDirectory'] : ['openFile'],
      })
      if (filenames !== undefined) {
        this.setPath(filenames[0])
      }
    })
  }

  parseBreadcrumb = value =>
    map(split(this.props.value, path.sep), p => ({
      text: p,
    }))

  renderBreadcrumb = (item, index) => {
    return (
      <li className={Classes.BREADCRUMB} key={index}>
        {item.text}
      </li>
    )
  }

  renderOverflow = items => {
    return (
      <li>
        <Tooltip position={Position.BOTTOM_LEFT} content={map(items, 'text').join(path.sep)}>
          <span className={Classes.BREADCRUMBS_COLLAPSED} />
        </Tooltip>
      </li>
    )
  }

  render() {
    const { t } = this.props
    return (
      <PickerBox
        className="folder-picker"
        onDrop={this.handleOnDrop}
        onDragEnter={this.handleOnDrag}
        onDragOver={this.handleOnDrag}
        onDragLeave={this.handleOnDrag}
      >
        {this.props.value ? (
          <>
            <OverflowList
              className={Classes.BREADCRUMBS}
              items={this.parseBreadcrumb(this.props.value)}
              overflowRenderer={this.renderOverflow}
              visibleItemRenderer={this.renderBreadcrumb}
            />
            <Button onClick={this.handleOnClick} minimal intent={Intent.PRIMARY}>
              {t('Change')}
            </Button>
          </>
        ) : (
          this.props.placeholder
        )}
      </PickerBox>
    )
  }
}
