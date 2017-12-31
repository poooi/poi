import React, { Component } from 'react'
import { shell, remote } from 'electron'
import Divider from '../components/divider'
import { Grid, Col, Row, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get, range } from 'lodash'
import CheckboxLabel from '../components/checkbox'
import { checkUpdate } from 'views/services/update'
import CONTRIBUTORS from 'poi-asset-contributor-data/dist/contributors.json'
import FA from 'react-fontawesome'

import DownloadProgress from './download-progress'
import AppMetrics from './app-metrics'
import FCD from './fcd'
import WctfDB from './wctf-db'

import '../assets/misc.css'

const {ROOT, POI_VERSION, CONST, i18n, config} = window
const __ = i18n.setting.__.bind(i18n.setting)
const { changeChannel } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

config.on('config.set', (path, value) => {
  if (path === 'poi.betaChannel' && process.platform !== 'linux') {
    changeChannel(value ? "beta" : "latest")
  }
})

const getAvatarUrl = url => /.*githubusercontent.com\/u\/.*/.test(url)
  ? `${url}&s=160`
  : url

const Misc = connect(state => ({
  layout: get(state, 'config.poi.layout', 'horizontal'),
}))(class Misc extends Component {
  render() {
    return (
      <div id='poi-others' className='poi-others'>
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
                  : <Button onClick={shell.openExternal.bind(this, 'https://discordapp.com/channels/118339803660943369/367575898313981952')}>
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
            <FCD />
          </Col>
          <Col xs={12}>
            <WctfDB />
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
              {
                range(10).map(i => (
                  <a
                    href={`https://opencollective.com/poi/sponsor/${i}/website`}
                    key={i}
                  >
                    <img src={`https://opencollective.com/poi/sponsor/${i}/avatar.svg`} />
                  </a>
                ))
              }
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
