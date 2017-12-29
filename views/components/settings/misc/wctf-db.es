import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import _, { get } from 'lodash'
import path from 'path'
import fs from 'fs-extra'
import semver from 'semver'
import glob from 'glob'
import Promise from 'bluebird'
import FA from 'react-fontawesome'
import { Button } from 'react-bootstrap'

import { wctfSelector } from 'views/utils/selectors'
import { installPackage } from 'views/services/plugin-manager-utils'

const { APPDATA_PATH, config, proxy, i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

const MIRROR_JSON_PATH = path.join(global.ROOT, 'assets', 'data', 'mirror.json')
const MIRRORS = require(MIRROR_JSON_PATH)

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
}

const fetchHeader = new Headers()
fetchHeader.set("Cache-Control", "max-age=0")
const defaultFetchOption = {
  method: "GET",
  cache: "default",
  headers: fetchHeader,
}

const WctfDB = connect(
  state => ({
    version: get(wctfSelector(state), 'version', '0.0.0'),
  })
)(class WctfDB extends Component {
  state = {
    updating: false,
  }

  componentDidMount = async () => {
    await fs.ensureDir(DB_ROOT)
    this.updateDB()
  }

  loadDB = async (force = false) => {
    try {
      const meta = await fs.readJSON(DB_META_PATH)
      if (meta.version === this.props.version && !force) {
        return
      }
      const data = await this.parseData()
      if (data) {
        this.props.dispatch({
          type: '@@wctf-db-update',
          payload: {
            version: meta.version,
            ...data,
          },
        })
      }
    } catch (e) {
      console.error(e.stack)
    }
  }

  updateDB = async (force = false) => {
    this.setState({
      updating: true,
    })
    const mirrorConf = config.get('packageManager.mirrorName')
    const useProxy = config.get("packageManager.proxy", false)
    const mirrorName = Object.keys(MIRRORS).includes(mirrorConf) ?
      mirrorConf : ((navigator.language === 'zh-CN') ?  "taobao" : "npm")
    const registry = MIRRORS[mirrorName].server
    const npmConfig = {
      registry,
      prefix: DB_ROOT,
    }
    if (useProxy) {
      const { port } =  proxy
      npmConfig.http_proxy = `http://127.0.0.1:${port}`
    }

    const data = await await fetch(`${registry}${PACKAGE_NAME}/latest`, defaultFetchOption)
      .then(res => res.ok ? res.json() : undefined)
      .catch(e => undefined)
    if (!data || !data.version) {
      console.warn(`Can't find update info for Who Calls The Fleet Database`)
    }

    if (get(data, 'version')) {
      if (semver.gt(data.version, this.props.version)) {
        try {
          await installPackage(PACKAGE_NAME, data.version, npmConfig)
          this.loadDB()
          // eslint-disable-next-line no-console
          console.log(`Who Calls The Fleet Database updated to ${data.version}`)
        } catch (e) {
          console.error(e)
        }
      } else {
        if (force) {
          this.loadDB(force)
        }
        // eslint-disable-next-line no-console
        console.log(`No update for Who Calls The Fleet Database, current: ${this.props.version}, remote: ${data.version}`)
      }
    }

    this.setState({
      updating: false,
    })
  }

  parseData = async () => {
    const data = {}
    try {
      await Promise.map(glob.sync(`${DB_FILE_PATH}/*.nedb`), async (dbPath) => {
        const dbName = path.basename(dbPath, '.nedb')
        if (!(dbName in DB_KEY)) {
          return
        }
        const buf = await fs.readFile(dbPath)
        const entries = buf.toString().split('\n').filter(Boolean)
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
      <Fragment>
        {__('Who Calls The Fleet Database')}: {this.props.version}
        <Button
          bsSize="small"
          onClick={this.handleRefesh}
          disabled={updating}
          style={{ marginLeft: '2em' }}
        >
          <FA name="refresh" spin={updating} />
        </Button>
      </Fragment>
    )
  }
})

export default WctfDB