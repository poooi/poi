import React, { Component, PureComponent } from 'react'
import { shell, remote } from 'electron'
import Divider from './divider'
import { Grid, Col, Row, Button, ProgressBar } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get, throttle, sortBy, round, sumBy } from 'lodash'
import { sync as globSync } from 'glob'
import { CheckboxLabelConfig } from './utils'
import { checkUpdate } from 'views/services/update'

const {ROOT, POI_VERSION, CONST, i18n, config} = window
const __ = i18n.setting.__.bind(i18n.setting)
const { changeChannel, updater } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

config.on('config.set', (path, value) => {
  if (path === 'poi.betaChannel' && process.platform !== 'linux') {
    changeChannel(value ? "beta" : "latest")
  }
})

const serverList = [
  "https://poi.io/fcd/",
  "https://raw.githubusercontent.com/poooi/poi/master/assets/data/fcd/",
  "http://7xj6zx.com1.z0.glb.clouddn.com/",
]

const fetchHeader = new Headers()
fetchHeader.set("Cache-Control", "max-age=0")

const fetchFromRemote = async (url, cacheMode = "default") => {
  const res = await fetch(url, {method: "GET", cache: cacheMode, headers: fetchHeader}).catch(e => e)
  if (res.status === 200) {
    try {
      return await res.json()
    } catch (e) {
      return
    }
  }
}

class DownloadProgress extends Component {
  state = {
    bytesPerSecond: 0,
    percent: 0,
    total: 0,
    transferred: 0,
  }
  updateProgress = progress => {
    this.setState(progress)
  }
  componentDidMount() {
    if (!this.updateProgressDebounced) {
      this.updateProgressDebounced = throttle(this.updateProgress, 1500)
    }
    if (process.platform === 'win32') {
      updater.on('download-progress', progress => this.updateProgressDebounced(progress))
    }
  }
  render () {
    return this.state.percent > 0 && process.platform === 'win32' && (
      <h5 className="update-progress">
        <ProgressBar bsStyle='success'
          now={this.state.percent} />
        <span>
          {`${Math.round(this.state.bytesPerSecond / 1024)} KB/s, ${Math.round(this.state.transferred / 1048576)} / ${Math.round(this.state.total / 1048576)} MB`}
        </span>
      </h5>
    )
  }
}

class AppMetrics extends PureComponent {
  constructor(props) {
    super(props)

    this.getAppMetrics = remote.require('electron').app.getAppMetrics
    
    this.getAllWindows = remote.require('electron').BrowserWindow.getAllWindows
    
    this.state = {
      metrics: [],
      total: {},
      pidmap: {},
      active: false,
    }
  }

  collect = () => {
    const metrics = this.getAppMetrics()

    const total = {}
    
    const pidmap = {}
    ;['workingSetSize', 'peakWorkingSetSize'].map(prop =>
      total[prop] = round(sumBy(metrics, metric => metric.memory[prop]) / 1000, 2)
    )

    total.percentCPUUsage = round(sumBy(metrics, metric => metric.cpu.percentCPUUsage), 2)

    this.getAllWindows().map(win => {
      const pid = win.webContents.getOSProcessId()
      const title = win.getTitle()
      pidmap[pid] = title
      return pidmap
    })
    this.setState({
      metrics: sortBy(JSON.parse(JSON.stringify(metrics)), 'pid'),
      total,
      pidmap,
    })
  }

  componentWillUnmount() {
    if (this.cycle) {
      clearInterval(this.cycle)
    }
  }

  handleClick = () => {
    const { active } = this.state
    if (active) {
      clearInterval(this.cycle)
    } else {
      this.collect()
      this.cycle = setInterval(this.collect.bind(this), 5 * 1000)
    }

    this.setState({
      active: !active,
    })
  }

  render() {
    const { metrics, active, total, pidmap } = this.state
    return (
      <div>
        <div>
          <Button onClick={this.handleClick} bsStyle={active ? 'success' : 'default'}>
            {
              active
                ? <span>{__('Monitor on')}</span>
                : <span>{__('Monitor off')}</span>
            }
          </Button>
        </div>
        {
          active &&
          <div className="metric-table">
            <div className="metric-row metric-haeder">
              <span>PID</span>
              {
                ['type', 'working/MB', 'peak/MB', 'private/MB', 'shared/MB', 'CPU/%', 'wakeup'].map(str =>
                  <span key={str} title={str}>{str}</span>
                )
              }
            </div>
            {
              metrics.map(metric => (
                <div className='metric-row' key={metric.pid}>
                  <span>{metric.pid}</span>
                  <span title={metric.type}>
                    {
                      Object.keys(pidmap).includes(metric.pid.toString()) ? pidmap[metric.pid] : metric.type
                    }
                  </span>
                  {
                    ['workingSetSize', 'peakWorkingSetSize', 'privateBytes', 'sharedBytes'].map(prop =>
                      <span key={prop}>{round((metric.memory || [])[prop] / 1000, 2)}</span>
                    )
                  }
                  {
                    ['percentCPUUsage', 'idleWakeupsPerSecond'].map(prop =>
                      <span key={prop}>{round((metric.cpu || [])[prop], 1)}</span>
                    )
                  }
                </div>
              ))
            }
            <div className='metric-row metric-total'>
              <span>
                {__('TOTAL')}
              </span>
              <span />
              <span>
                {total.workingSetSize}
              </span>
              <span>
                {total.peakWorkingSetSize}
              </span>
              <span />
              <span />
              <span>
                {total.percentCPUUsage}
              </span>
              <span />
            </div>
          </div>
        }
      </div>
    )
  }
}

const initState = {}

const Others = connect(state => ({
  version: state.fcd.version || initState,
}))(class others extends Component {
  updateData = (cacheMode = 'default') => async () => {
    // Update from local
    const localFileList = globSync(`${ROOT}/assets/data/fcd/*`)
    for (const file of localFileList) {
      if (!file.includes('meta.json')) {
        const data = require(file)
        const version = get(data, 'meta.version')
        const name = get(data, 'meta.name')
        if (name && version) {
          const localVersion = get(this.props.version, name, '1970/01/01/01')
          if (version > localVersion) {
            this.props.dispatch({
              type: '@@updateFCD',
              value: data,
            })
          }
        }
      }
    }
    // Update from server
    let flag
    for (const server of serverList) {
      flag = true
      const fileList = await fetchFromRemote(`${server}meta.json`, cacheMode)
      if (fileList) {
        for (const file of fileList) {
          const localVersion = get(this.props.version, file.name, '1970/01/01/01')
          if (file.version > localVersion) {
            // eslint-disable-next-line no-console
            console.log(`Updating ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`)
            const data = await fetchFromRemote(`${server}${file.name}.json`, cacheMode)
            if (data) {
              this.props.dispatch({
                type: '@@updateFCD',
                value: data,
              })
            } else {
              flag = false
            }
          } else {
            // eslint-disable-next-line no-console
            console.log(`No newer version of ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`)
          }
        }
      } else {
        flag = false
      }
      if (flag) {
        // eslint-disable-next-line no-console
        console.log(`Update fcd from ${server} successfully in mode ${cacheMode}.`)
        break
      } else {
        console.warn(`Update fcd from ${server} failed in mode ${cacheMode}.`)
      }
    }
  }
  componentDidMount() {
    this.updateData()()
  }
  render() {
    const fcds = Object.keys(this.props.version || {}).map(key => [key, this.props.version[key]])
    return (
      <div id='poi-others'>
        <Grid>
          <Col xs={12}>
            <img src={`file://${ROOT}/assets/img/logo.png`} style={{width: '100%'}} />
          </Col>
        </Grid>
        <Grid>
          <Row>
            <Col xs={6}>
              <Divider text={`${__("Current version")}: ${POI_VERSION}`} />
            </Col>
            <Col xs={6}>
              <DownloadProgress />
            </Col>
          </Row>
        </Grid>
        <Grid>
          <Col xs={6}>
            <Button onClick={checkUpdate}>{__("Check Update")}</Button>
          </Col>
          <Col xs={6}>
            <CheckboxLabelConfig
              label={__('Check update of beta version')}
              configName="poi.betaChannel"
              defaultVal={false} />
          </Col>
          <Col xs={12}>
            <p>{__("poi-description %s", process.versions.electron)}</p>
            {
              (window.language === "zh-CN" || window.language === "zh-TW") ?
                <div>
                  <p>微博: <a href='http://weibo.com/letspoi'>  今天 poi 出新版本了吗 </a></p>
                  <p>开发讨论与意见交流群: 378320628 </p>
                </div>
                :
                null
            }
            <p>{__("Database")}:<a href='http://db.kcwiki.moe'> http://db.kcwiki.moe </a></p>
            <p>{__("Wiki")}: <a href='https://github.com/poooi/poi/wiki'> https://github.com/poooi/poi/wiki </a></p>
            <p>GitHub：<a href='https://github.com/poooi/poi'> https://github.com/poooi/poi </a></p>
          </Col>
        </Grid>
        <Divider text={__("Data version")} />
        <Grid>
          <Col xs={12}>
            {
              fcds.map(fcd => (
                fcd ? <p key={fcd[0]}>{`${fcd[0]}: ${fcd[1]}`}</p> : null
              ))
            }
          </Col>
          <Col xs={12}>
            <Button onClick={this.updateData('reload')}>
              {__("Update data")}
            </Button>
          </Col>
        </Grid>
        <Divider text={__('Performance Monitor')} />
        <Col xs={12}>
          <AppMetrics />
        </Col>
        <Divider text="Contributors" />
        <Grid>
          {
            CONST.contributors.map((e, i) => (
              <Col xs={2} key={i}>
                <img className="avatar-img" src={e.avatar} onClick={shell.openExternal.bind(this, e.link)} title={e.name} />
              </Col>
            ))
          }
        </Grid>
        <Divider text="Thanks To" />
        <Grid className='thanks-to'>
          {
            CONST.thanksTo.map((e, i) => (
              <div className="div-row thanks-to-item" key={i}>
                <div className='thanks-to-img-container'>
                  <img className="thanks-to-img" src={e.avatar} style={e.extraCSS} onClick={shell.openExternal.bind(this, e.link)} title={e.name} />
                </div>
                <div className='thanks-to-container'>
                  <b>{e.name}</b>
                  <p>{e.description}</p>
                </div>
              </div>
            ))
          }
        </Grid>
      </div>
    )
  }
})

export default Others
