import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import PropTypes from 'prop-types'
import { join } from 'path-extra'
import { remove } from 'fs-extra'
import { getShipImgPath } from 'views/utils/ship-img'

import './assets/avatar.css'

const { APPDATA_PATH } = window

// Remove old folder
remove(join(APPDATA_PATH, 'avatar')).catch(e => null)

@connect((state, props) => {
  const uri = getShipImgPath(props.mstId, 'banner', props.isDamaged)
  const ip = get(state, 'info.server.ip', '203.104.209.71')
  const version = get(get(state, 'const.$shipgraph', []).find(a => a.api_id === props.mstId), 'api_version.0')
  let url = `http://${ip}${uri}`
  if (version && parseInt(version) > 1) {
    url = `${url}?version=${version}`
  }
  return {
    url,
  }
})
export class Avatar extends PureComponent {
  static propTypes = {
    mstId: PropTypes.number.isRequired,
    height: PropTypes.number,
    url: PropTypes.string.isRequired,
    isDamaged: PropTypes.bool,
    children: PropTypes.node,
  }

  static defaultProps = {
    height: 121,
    // marginMagic: 0.555,
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
          style={{ height: this.props.height, marginLeft: -Math.round(1.5 * this.props.height) }}
          src={this.props.url} />
        { this.props.children }
      </div>
    )
  }
}
