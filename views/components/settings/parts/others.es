import React, { Component } from 'react'
import { shell } from 'electron'
import Divider from './divider'
import { Grid, Col, Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { sync as globSync } from 'glob'

const {ROOT, POI_VERSION, CONST, i18n} = window
const __ = i18n.setting.__.bind(i18n.setting)

const serverList = [
  "https://poi.io/fcd/",
  "https://raw.githubusercontent.com/poooi/poi/master/assets/data/fcd/",
  "http://7xj6zx.com1.z0.glb.clouddn.com/",
]

const Others = connect(state => ({
  fcd: Object.keys(state.fcd || {}).map(key => (get(state, `fcd.${key}.meta`))),
}))(class others extends Component {
  updateData = async () => {
    // Update from local
    const fileList = globSync(`${ROOT}/assets/data/fcd/*`)
    for (const file of fileList) {
      if (!file.includes('meta.json')) {
        this.props.dispatch({
          type: '@@updateFCD',
          value: require(file),
        })
      }
    }
    // Update from server
    let flag
    for (const server of serverList) {
      flag = true
      const meta = await fetch(`${server}meta.json`, {method: "GET"}).catch(e => e)
      if (meta.status === 200) {
        let fileList
        try {
          fileList = await meta.json()
        } catch (e) {
          flag = false
          console.warn(`Update fcd from ${server} failed.`)
          continue
        }
        for (const file of fileList) {
          const res = await fetch(`${server}${file.name}.json`, {method: "GET"}).catch(e => e)
          if (res.status !== 200) {
            flag = false
            continue
          }
          let body
          try {
            body = await res.json()
          } catch (e) {
            flag = false
            continue
          }
          this.props.dispatch({
            type: '@@updateFCD',
            value: body,
          })
        }
      } else {
        flag = false
      }
      if (flag) {
        console.log(`Update fcd from ${server} successfully.`)
        break
      } else {
        console.warn(`Update fcd from ${server} failed.`)
      }
    }
  }
  componentDidMount() {
    this.updateFCD()
  }
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
        <Divider text={__("Data version")} />
        <Grid>
          <Col xs={12}>
            {
              this.props.fcd.map(fcd => (
                fcd ? <p>{`${fcd.name}: ${fcd.version}`}</p> : null
              ))
            }
          </Col>
          <Col xs={12}>
            <Button onClick={this.updateData}>
              {__("Update data")}
            </Button>
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
})

export default Others
