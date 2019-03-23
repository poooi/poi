/* global APPDATA_PATH */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import _, { get } from 'lodash'
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import Promise from 'bluebird'
import { Button, Intent } from '@blueprintjs/core'
import { Trans } from 'react-i18next'

import { wctfSelector } from 'views/utils/selectors'
import { installPackage, getNpmConfig } from 'views/services/plugin-manager/utils'

const PACKAGE_NAME = 'whocallsthefleet-database'
const DB_ROOT = path.join(APPDATA_PATH, 'wctf-db')
const DB_META_PATH = path.join(DB_ROOT, 'node_modules', PACKAGE_NAME, 'package.json')
const DB_FILE_PATH = path.join(DB_ROOT, 'node_modules', PACKAGE_NAME, 'db')

const DB_KEY = {
  arsenal_all: 'id',
  arsenal_weekday: 'weekday',
  item_type_collections: 'id',
  item_types: 'id',
  items: 'id',
  ship_classes: 'id',
  ship_type_collections: 'id',
  ship_types: 'id',
  ships: 'id',
  ship_namesuffix: 'id',
}

const fetchHeader = new Headers()
fetchHeader.set('Cache-Control', 'max-age=0')
const defaultFetchOption = {
  method: 'GET',
  cache: 'default',
  headers: fetchHeader,
}

@connect(state => ({
  version: get(wctfSelector(state), 'version', '0.0.0'),
}))
export class WctfDB extends Component {
  state = {
    updating: false,
  }

  componentDidMount = async () => {
    await fs.ensureDir(DB_ROOT)
    await fs.ensureDir(path.join(DB_ROOT, 'node_modules'))
    this.updateDB()
  }

  loadDB = async () => {
    try {
      const meta = await fs.readJSON(DB_META_PATH)
      const data = await this.parseData()
      if (data) {
        this.props.dispatch({
          type: '@@wctf-db-update',
          payload: {
            version: meta.version,
            lastModified: +new Date(), // reloading database should effective for plugin windows
            ...data,
          },
        })
      }
    } catch (e) {
      console.error(e.stack)
    }
  }

  // updateDB is similar to update a plugin
  // Steps:
  // - locally check if wctf-db should be updated or reinstalled
  //  + read package.json, if failure, should update
  //  + compare version package.json and props.version, if not equal, should update
  // - fetch remote data to get the latest version info, also checks update
  //  + get npm config data (mirror, proxy)
  //  + fetch latest release info json
  // - if should update, install the npm package
  // - load the new db if updated or forced to load
  // @params force: Boolean, reloads DB if no update available
  updateDB = async (force = false) => {
    this.setState({
      updating: true,
    })

    let updateFlag = false
    let meta

    try {
      meta = await fs.readJSON(DB_META_PATH)
    } catch (e) {
      updateFlag = true
    }

    if (get(meta, 'version') !== this.props.version) {
      updateFlag = true
    }

    const npmConfig = getNpmConfig(DB_ROOT)
    const data = await fetch(`${npmConfig.registry}${PACKAGE_NAME}/latest`, defaultFetchOption)
      .then(res => (res.ok ? res.json() : undefined))
      .catch(e => undefined)
    if (!data || !data.version) {
      console.warn("Can't find update info for wctf-db")
    }

    updateFlag = updateFlag || get(data, 'version', this.props.version) !== this.props.version

    if (updateFlag) {
      try {
        await installPackage(PACKAGE_NAME, data.version, npmConfig)
        this.loadDB()
        // eslint-disable-next-line no-console
        console.log(`wctf-db updated to ${data.version}`)
      } catch (e) {
        console.error(e)
      }
    } else {
      if (force) {
        this.loadDB()
      }
      // eslint-disable-next-line no-console
      console.log(`No update for wctf-db, current: ${this.props.version}, remote: ${data.version}`)
    }

    this.setState({
      updating: false,
    })
  }

  parseData = async () => {
    const data = {}
    try {
      await Promise.map(glob.sync(`${DB_FILE_PATH}/*.nedb`), async dbPath => {
        const dbName = path.basename(dbPath, '.nedb')
        if (!(dbName in DB_KEY)) {
          return
        }
        const buf = await fs.readFile(dbPath)
        const entries = buf
          .toString()
          .split('\n')
          .filter(Boolean)
        data[dbName] = _(entries)
          .map(content => JSON.parse(content))
          .keyBy(DB_KEY[dbName])
          .value()
      })
    } catch (e) {
      console.error(e.stack)
      return
    }

    return data
  }

  handleRefesh = () => this.updateDB(true)

  render() {
    const { updating } = this.state
    return (
      <>
        {this.props.version}{' '}
        <Button minimal onClick={this.handleRefesh} disabled={updating} intent={Intent.PRIMARY}>
          <Trans>setting:Update</Trans>
        </Button>
      </>
    )
  }
}
