import React, { Component, Fragment } from 'react'
import { shell, remote } from 'electron'
import { Divider } from '../components/divider'
import { Grid, Col, Row, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { CheckboxLabelConfig } from '../components/checkbox'
import { checkUpdate } from 'views/services/update'
import CONTRIBUTORS from 'poi-asset-contributor-data/dist/contributors.json'
import FA from 'react-fontawesome'
import { Trans } from 'react-i18next'

import { DownloadProgress } from './download-progress'
import { AppMetrics } from './app-metrics'
import { FCD } from './fcd'
import { WctfDB } from './wctf-db'
import { OpenCollective } from './open-collective'

import '../assets/misc.css'

const {ROOT, POI_VERSION, CONST, config} = window
const { changeChannel } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

config.on('config.set', (path, value) => {
  if (path === 'poi.betaChannel' && process.platform !== 'linux') {
    changeChannel(value ? "beta" : "latest")
  }
})

const getAvatarUrl = url => /.*githubusercontent.com\/u\/.*/.test(url)
  ? `${url}&s=160`
  : url

@connect(state => ({
  layout: get(state, 'config.poi.layout', 'horizontal'),
}))
export class Misc extends Component {
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
              <Divider text={<Fragment><Trans>setting:Current version</Trans>: v{POI_VERSION}</Fragment>} />
            </Col>
            <Col xs={6}>
              <DownloadProgress />
            </Col>
          </Row>
        </Grid>
        <Grid>
          <Col xs={6}>
            <Button onClick={checkUpdate}><Trans>setting:Check Update</Trans></Button>
          </Col>
          <Col xs={6}>
            <CheckboxLabelConfig
              label={<Trans>setting:Check update of beta version</Trans>}
              configName="poi.betaChannel"
              defaultVal={false} />
          </Col>
          <Col xs={12}>
            <Trans i18nKey='setting:poi description'>
              <p>poi is an open source Kancolle browser based on Electron {{version: process.versions.electron}} . poi behaves the same as Chrome and does not modify game data, packets or implement bots/macros. The main poi provides basic functionalities and is complemented by a variety of plugins.</p>
            </Trans>
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
              <Button onClick={shell.openExternal.bind(this, 'http://db.kcwiki.org')}>
                <FA name="database" /> <Trans>setting:Database</Trans>
              </Button>
              <Button onClick={shell.openExternal.bind(this, 'https://github.com/poooi/poi/wiki')}>
                <FA name="question" /><Trans>setting:Wiki</Trans>
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
        <Divider text={<Trans>setting:Data version</Trans>} />
        <Grid>
          <Col xs={12}>
            <FCD />
          </Col>
          <Col xs={12}>
            <WctfDB />
          </Col>
        </Grid>
        <Divider text={<Trans>setting:Performance Monitor</Trans>} />
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
            <OpenCollective />
          </Col>
        </Grid>
        <Divider text="Special Thanks To" />
        <Grid className='thanks-to sp-thanks-to'>
          <div className="div-row thanks-to-item">
            <div className='thanks-to-img-container'>
              <img className="thanks-to-img"
                src="https://upload.kcwiki.org/commons/thumb/d/d1/Kcwiki-banner.png/600px-Kcwiki-banner.png"
                style={{
                  WebkitClipPath: 'inset(0px 78% 0px 0px)',
                  maxHeight: '100%',
                  marginLeft: '5%',
                }}
                onClick={shell.openExternal.bind(this, 'https://zh.kcwiki.org/wiki/')}
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
}
