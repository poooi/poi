import React, { Component } from 'react'
import { shell, remote } from 'electron'
import Divider from '../components/divider'
import { Grid, Col, Row, Button, Label } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { sync as globSync } from 'glob'
import CheckboxLabel from '../components/checkbox'
import { checkUpdate } from 'views/services/update'
import CONTRIBUTORS from 'poi-asset-contributor-data/dist/contributors.json'
import FA from 'react-fontawesome'

import DownloadProgress from './download-progress'
import AppMetrics from './app-metrics'

const {ROOT, POI_VERSION, CONST, i18n, config} = window
const __ = i18n.setting.__.bind(i18n.setting)
const { changeChannel } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

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

const getAvatarUrl = url => /.*githubusercontent.com\/u\/.*/.test(url)
  ? `${url}&s=160`
  : url

const initState = {}

const Misc = connect(state => ({
  version: state.fcd.version || initState,
  layout: get(state, 'config.poi.layout', 'horizontal'),
}))(class Misc extends Component {
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
            <CheckboxLabel
              label={__('Check update of beta version')}
              configName="poi.betaChannel"
              defaultVal={false} />
          </Col>
          <Col xs={12}>
            <p>{__("poi-description %s", process.versions.electron)}</p>
            <div className="desc-buttons">
              {
                ['zh-CN', 'zh-TW'].includes(window.language) &&
                    <Button onClick={shell.openExternal.bind(this, 'http://weibo.com/letspoi')}>
                      <FA name="weibo" /> @今天poi出新版本了吗
                    </Button>
              }
              {
                ['zh-CN', 'zh-TW'].includes(window.language)
                  ? <Button><FA name="qq" /> 用户交流群： 378320628 </Button>
                  : <Button onClick={shell.openExternal.bind(this, 'https://discordapp.com/channels/118339803660943369/201057772597411840')}>
                    Discord channel
                  </Button>
              }
              <Button onClick={shell.openExternal.bind(this, 'http://db.kcwiki.moe')}>
                <FA name="database" /> {__("Database")}
              </Button>
              <Button onClick={shell.openExternal.bind(this, 'https://github.com/poooi/poi/wiki')}>
                <FA name="question" /> {__("Wiki")}
              </Button>
              <Button onClick={shell.openExternal.bind(this, 'https://github.com/poooi/poi')}>
                <FA name="github" /> GitHub
              </Button>
              <Button onClick={shell.openExternal.bind(this, 'https://opencollective.com/poi')}>
                OpenCollective
              </Button>
            </div>
          </Col>
        </Grid>
        <Divider text={__("Data version")} />
        <Grid>
          <Col xs={12}>
            {
              fcds.map(fcd => (
                fcd
                  ? <span key={fcd[0]}>
                    {fcd[0]}: <Label bsStyle="primary">{fcd[1]}</Label>
                  </span>
                  : null
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
          <Col xs={12} className="contributors">
            {
              CONTRIBUTORS.map((e, i) => (
                <div key={i} className="contributor-item">
                  <img
                    className="avatar-img"
                    src={getAvatarUrl(e.avatar_url)}
                    onClick={shell.openExternal.bind(this, e.html_url)}
                    title={e.name || e.login}
                  />
                </div>
              ))
            }
          </Col>
        </Grid>
        <Divider text="OpenCollective" />
        <Grid className="opencollective container">
          <Col xs={12}>
            <div>
              <a href="https://opencollective.com/poi/sponsor/0/website"><img src="https://opencollective.com/poi/sponsor/0/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/1/website"><img src="https://opencollective.com/poi/sponsor/1/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/2/website"><img src="https://opencollective.com/poi/sponsor/2/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/3/website"><img src="https://opencollective.com/poi/sponsor/3/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/4/website"><img src="https://opencollective.com/poi/sponsor/4/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/5/website"><img src="https://opencollective.com/poi/sponsor/5/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/6/website"><img src="https://opencollective.com/poi/sponsor/6/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/7/website"><img src="https://opencollective.com/poi/sponsor/7/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/8/website"><img src="https://opencollective.com/poi/sponsor/8/avatar.svg" /></a>
              <a href="https://opencollective.com/poi/sponsor/9/website"><img src="https://opencollective.com/poi/sponsor/9/avatar.svg" /></a>
            </div>
            <div>
              <a href="https://opencollective.com/poi#backers">
                <img src={`https://opencollective.com/poi/backers.svg?width=${this.props.layout === 'horizontal' ? 450 : 900}`} />
              </a>
            </div>
          </Col>
        </Grid>
        <Divider text="Special Thanks To" />
        <Grid className='thanks-to sp-thanks-to'>
          <div className="div-row thanks-to-item">
            <div className='thanks-to-img-container'>
              <img className="thanks-to-img"
                src="https://upload.kcwiki.moe/commons/thumb/d/d1/Kcwiki-banner.png/600px-Kcwiki-banner.png"
                style={{
                  WebkitClipPath: 'inset(0px 78% 0px 0px)',
                  maxHeight: '100%',
                  marginLeft: '5%',
                }}
                onClick={shell.openExternal.bind(this, 'https://zh.kcwiki.moe/wiki/%E8%88%B0%E5%A8%98%E7%99%BE%E7%A7%91')}
                title="KCWiki"
              />
            </div>
            <div className='thanks-to-container'>
              <b>KCWiki</b>
              <p>For sponsing poi data server, providing data of item imporvment, task info, shipgirl qoutes, etc.</p>
            </div>
          </div>
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

export default Misc
