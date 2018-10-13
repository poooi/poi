import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import PropTypes from 'prop-types'
import { join } from 'path-extra'
import { remove } from 'fs-extra'
import { getShipImgPath, getShipBackgroundPath, getSlotItemImgPath, getSlotItemBackgroundPath } from 'views/utils/ship-img'
import classnames from 'classnames'
import styled, { css } from 'styled-components'

const ShipAvatarContainer = styled.div`
  align-items: center;
  position: relative;
  display: flex;
  -webkit-mask-image: -webkit-gradient(linear, 65% 100%, 100% 100%, from(rgba(0, 0, 0, 1)), to(rgba(0, 0, 0, 0)));
  mask-image: -webkit-gradient(linear, 65% 100%, 100% 100%, from(rgba(0, 0, 0, 1)), to(rgba(0, 0, 0, 0)));
`

const ShipAvatarInnerContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 98%;
  overflow: hidden;
  max-height: calc(100% - 2px);
  display: flex;
  align-items: center;
`

const ShipAvatar = styled.img``

const EquipAvatar = styled.img`
  width: 90%;
  position: absolute;
`

const ShipAvatarBG = styled.img`
  position: absolute;
  width: 200%;
  z-index: -1;
  ${({ rank }) => rank >= 6 ? css`
    height: 220%;
    left: -60%;
  ` : css`
    left: -30%;
    top: -28%;
  `}
`

const EquipAvatarBG = styled.img`
  position: absolute;
  left: -160%;
  width: 400%;
  z-index: -1;
`

const { APPDATA_PATH } = window

// Remove old folder
remove(join(APPDATA_PATH, 'avatar')).catch(e => null)

@connect((state, props) => {
  if (!props.mstId) return {}
  const ip = get(state, 'info.server.ip', '203.104.209.71')
  if (props.type === 'equip') {
    const version = get(state, `const.$equips.${props.mstId}.api_version`, 1)
    const rank = props.rank || get(state, `const.$equips.${props.mstId}.api_rare`, 5)
    const url = getSlotItemImgPath(props.mstId, 'item_up', ip, version)
    const bgurl = getSlotItemBackgroundPath(rank, ip)
    return {
      url,
      bgurl,
    }
  } else {
    const isEnemy = props.mstId >= 1500
    const marginMagic = props.marginMagic || (isEnemy ? 1.5 : get(state, `fcd.shipavatar.marginMagics.${props.mstId}.${props.isDamaged ? 'damaged' : 'normal'}`))
    const version = get(get(state, 'const.$shipgraph', []).find(a => a.api_id === props.mstId), 'api_version.0')
    const rank = props.rank ||  get(state, `fcd.shipavatar.backs.${props.mstId}`, get(state, `const.$ships.${props.mstId}.api_backs`, 7))
    const url = getShipImgPath(props.mstId, isEnemy ? 'banner' : 'remodel' , props.isDamaged, ip, version)
    const bgurl = !isEnemy ? getShipBackgroundPath(rank, ip) : ''
    return {
      url,
      bgurl,
      marginMagic,
      rank,
    }
  }
})
export class Avatar extends PureComponent {
  static propTypes = {
    mstId: PropTypes.number.isRequired,
    height: PropTypes.number,
    rank: PropTypes.number,
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
    if (!this.props.mstId) return <div />
    return (
      <ShipAvatarContainer className={classnames(this.props.className, 'ship-avatar-container')} data-mstid={this.props.mstId} data-damaged={this.props.isDamaged} style={{
        width: Math.round(1.85 * this.props.height),
        height: this.props.height,
      }}>
        <ShipAvatarInnerContainer className="ship-avatar-inner-container">
          {
            this.props.type === 'equip' ? (
              <>
                <EquipAvatar
                  className="equip-avatar"
                  src={this.props.url} />
                <EquipAvatarBG
                  className="equip-avatar-bg"
                  src={this.props.bgurl} />
              </>
            ) : (
              <>
                <ShipAvatar
                  className="ship-avatar"
                  style={{ height: this.props.height, marginLeft: -Math.round(this.props.marginMagic * this.props.height) }}
                  src={this.props.url} />
                {
                  !this.props.isEnemy && (
                    <ShipAvatarBG
                      rank={this.props.rank}
                      className={classnames('ship-avatar-bg', {
                        'ship-avatar-bg-nr': this.props.rank < 6,
                        'ship-avatar-bg-sr': this.props.rank >= 6,
                      })}
                      src={this.props.bgurl} />
                  )
                }
              </>
            )
          }
        </ShipAvatarInnerContainer>
        { this.props.children }
      </ShipAvatarContainer>
    )
  }
}
