import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import PropTypes from 'prop-types'
import { join } from 'path-extra'
import { remove } from 'fs-extra'
import { getShipImgPath, getShipBackgroundPath } from 'views/utils/ship-img'

import './assets/avatar.css'

const { APPDATA_PATH } = window

// Remove old folder
remove(join(APPDATA_PATH, 'avatar')).catch(e => null)

@connect((state, props) => {
  const isEnemy = props.mstId >= 1500
  const marginMagic = props.marginMagic || (isEnemy ? 1.5 : get(state, `fcd.shipavatar.marginMagics.${props.mstId}.${props.isDamaged ? 'damaged' : 'normal'}`))
  const ip = get(state, 'info.server.ip', '203.104.209.71')
  const version = get(get(state, 'const.$shipgraph', []).find(a => a.api_id === props.mstId), 'api_version.0')
  const rank = get(state, `const.$ships.${props.mstId}.api_backs`, 7)
  const url = getShipImgPath(props.mstId, isEnemy ? 'banner' : 'remodel' , props.isDamaged, ip, version)
  const bgurl = !isEnemy ? getShipBackgroundPath(rank, ip) : ''
  return {
    url,
    bgurl,
    marginMagic,
  }
})
export class Avatar extends PureComponent {
  static propTypes = {
    mstId: PropTypes.number.isRequired,
    height: PropTypes.number,
    url: PropTypes.string.isRequired,
    bgurl: PropTypes.string.isRequired,
    isDamaged: PropTypes.bool,
    children: PropTypes.node,
  }

  static defaultProps = {
    height: 121,
    marginMagic: 0.555,
    isDamaged: false,
    children: null,
  }

  render() {
    return (
      <div className="ship-avatar-container" data-mstid={this.props.mstId} data-damaged={this.props.isDamaged} style={{
        width: Math.round(1.85 * this.props.height),
        height: this.props.height,
      }}>
        <img
          className="ship-avatar"
          style={{ height: this.props.height, marginLeft: -Math.round(this.props.marginMagic * this.props.height) }}
          src={this.props.url} />
        {
          !this.props.isEnemy && (
            <div className="ship-avatar-bg-container">
              <img
                className="ship-avatar-bg"
                src={this.props.bgurl} />
            </div>
          )
        }
        { this.props.children }
      </div>
    )
  }
}
