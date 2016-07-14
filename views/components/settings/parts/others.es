import React from 'react'
import { shell } from 'electron'
import Divider from './divider'
import { Grid, Col } from 'react-bootstrap'

const {ROOT, POI_VERSION, CONST, i18n} = window
const __ = i18n.setting.__.bind(i18n.setting)
const {Component} = React

class Others extends Component {
  render() {
    return (
      <div id='poi-others'>
        <Grid>
          <Col xs={12}>
            <img src={`file://${ROOT}/assets/img/logo.png`} style={{width: '100%'}} />
            <p>{__("poi-description %s %s", POI_VERSION, process.versions.electron)}</p>
            {
              (window.language === "zh-CN" || window.language === "zh-TW") ?
                <div>
                  <p>微博: <a onClick={shell.openExternal.bind(this, 'http://weibo.com/letspoi')}>  今天 poi 出新版本了吗 </a></p>
                  <p>开发讨论与意见交流群: 378320628 </p>
                </div>
              :
              null
            }
            <p>{__("Database")}:<a onClick={shell.openExternal.bind(this, 'http://db.kcwiki.moe')}> http://db.kcwiki.moe </a></p>
            <p>{__("Wiki")}: <a onClick={shell.openExternal.bind(this, 'https://github.com/poooi/poi/wiki')}> https://github.com/poooi/poi/wiki </a></p>
            <p>GitHub：<a onClick={shell.openExternal.bind(this, 'https://github.com/poooi/poi')}> https://github.com/poooi/poi </a></p>
          </Col>
        </Grid>
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
      </div>
    )
  }
}

export default Others
