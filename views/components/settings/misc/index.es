import React, { Component } from 'react'
import { shell, remote } from 'electron'
import { Divider } from '../components/divider'
import { Grid, Col } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import CONTRIBUTORS from 'poi-asset-contributor-data/dist/contributors.json'
import { translate } from 'react-i18next'

import { VersionInfo } from './version-info'
import { AppMetrics } from './app-metrics'
import { OpenCollective } from './open-collective'
import { GPUStatus } from './gpu-status'
import { Update } from './update'

import '../assets/misc.css'

const { CONST, config} = window
const { changeChannel } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

config.on('config.set', (path, value) => {
  if (path === 'poi.update.beta' && process.platform !== 'linux') {
    changeChannel(value ? 'beta' : 'latest')
  }
})

const getAvatarUrl = url => /.*githubusercontent.com\/u\/.*/.test(url)
  ? `${url}&s=160`
  : url

@translate(['setting'])
@connect(state => ({
  layout: get(state, 'config.poi.layout.mode', 'horizontal'),
}))
export class Misc extends Component {
  render() {
    const { t } = this.props
    return (
      <>
      <VersionInfo />
      <Update />
      <GPUStatus />
      <AppMetrics />
      <div id="poi-others" className="poi-others">


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
        <Grid className="thanks-to sp-thanks-to">
          <div className="div-row thanks-to-item">
            <div className="thanks-to-img-container">
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
            <div className="thanks-to-container">
              <b>KCWiki</b>
              <p>For sponsing poi data server, providing data of item imporvment, task info, shipgirl qoutes, etc.</p>
            </div>
          </div>
        </Grid>
        <Divider text="Thanks To" />
        <Grid className="thanks-to">
          {
            CONST.thanksTo.map((e, i) => (
              <div className="div-row thanks-to-item" key={i}>
                <div className="thanks-to-img-container">
                  <img className="thanks-to-img" src={e.avatar} style={e.extraCSS} onClick={shell.openExternal.bind(this, e.link)} title={e.name} />
                </div>
                <div className="thanks-to-container">
                  <b>{e.name}</b>
                  <p>{e.description}</p>
                </div>
              </div>
            ))
          }
        </Grid>
      </div>
    </>
    )
  }
}
