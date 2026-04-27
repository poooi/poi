import type { RootState } from 'views/redux/reducer-factory'

import classnames from 'classnames'
import { remove } from 'fs-extra'
import path from 'path'
import React, { memo } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { css, styled } from 'styled-components'
import {
  getShipBackgroundPath,
  getShipImgPath,
  getSlotItemBackgroundPath,
  getSlotItemImgPath,
} from 'views/utils/ship-img'

declare const APPDATA_PATH: string

const ShipAvatarContainer = styled.div`
  align-items: center;
  position: relative;
  display: flex;
  mask-image: -webkit-gradient(
    linear,
    65% 100%,
    100% 100%,
    from(rgb(0 0 0 / 1)),
    to(rgb(0 0 0 / 0))
  );
`

const ShipAvatarInnerContainer = styled.div`
  position: absolute;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  height: 100%;
`

const ShipAvatarImg = styled.img`
  display: block;
`

const EquipAvatar = styled.img`
  width: 90%;
  position: absolute;
`

const ShipAvatarBG = styled.img<{ rank: number }>`
  position: absolute;
  width: 200%;
  z-index: -1;
  ${({ rank }) =>
    rank >= 6
      ? css`
          height: 220%;
          left: -60%;
        `
      : css`
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

// Remove old folder
remove(path.join(APPDATA_PATH, 'avatar')).catch(() => null)

export interface AvatarProps {
  mstId?: number
  height?: number
  rank?: number
  isDamaged?: boolean
  type?: 'equip'
  marginMagic?: number
  className?: string
  children?: React.ReactNode
  useFixedWidth?: boolean
  useDefaultBG?: boolean
  showFullImg?: boolean
}

export const Avatar = memo(
  ({
    mstId = 0,
    height = 121,
    rank: rankProp,
    isDamaged = false,
    type,
    marginMagic: marginMagicProp,
    className,
    children,
    useFixedWidth = true,
    useDefaultBG = true,
    showFullImg = false,
  }: AvatarProps) => {
    const { url, bgurl, marginMagic, rank } = useSelector((state: RootState) => {
      if (!mstId) return { url: '', bgurl: '', marginMagic: 0.555, rank: 7 }
      const ip = state.info.server.ip ?? '203.104.209.71'
      if (type === 'equip') {
        const $equip = state.const.$equips?.[mstId]
        const version = $equip?.api_version ?? 1
        const rank = rankProp ?? $equip?.api_rare ?? 5
        return {
          url: getSlotItemImgPath(mstId, 'item_up', ip, version),
          bgurl: getSlotItemBackgroundPath(rank, ip),
          marginMagic: 0.555,
          rank,
        }
      } else {
        const isEnemy = mstId >= 1500
        const marginMagic =
          marginMagicProp ??
          (isEnemy
            ? 1.5
            : state.fcd.shipavatar?.marginMagics?.[mstId]?.[isDamaged ? 'damaged' : 'normal'])
        const version = state.const.$shipgraph?.find((a) => a.api_id === mstId)?.api_version[0]
        const rank =
          rankProp ??
          state.fcd.shipavatar?.backs?.[mstId] ??
          state.const.$ships?.[mstId]?.api_backs ??
          7
        return {
          url: getShipImgPath(mstId, isEnemy ? 'banner' : 'remodel', isDamaged, ip, version),
          bgurl: !isEnemy ? getShipBackgroundPath(rank, ip) : '',
          marginMagic: marginMagic ?? 0.555,
          rank,
        }
      }
    }, shallowEqual)

    if (!mstId) return <div />

    const containerStyle: React.CSSProperties = { height }
    if (useFixedWidth) {
      containerStyle.width = Math.round(1.85 * height)
    } else if (showFullImg) {
      containerStyle.width = 164
    }

    return (
      <ShipAvatarContainer
        className={classnames(className, 'ship-avatar-container')}
        data-master-id={mstId}
        data-damaged={isDamaged}
        style={containerStyle}
      >
        <ShipAvatarInnerContainer className="ship-avatar-inner-container">
          {type === 'equip' ? (
            <>
              <EquipAvatar className="equip-avatar" src={url} />
              {useDefaultBG && <EquipAvatarBG className="equip-avatar-bg" src={bgurl} />}
            </>
          ) : (
            <>
              <ShipAvatarImg
                className="ship-avatar"
                style={{
                  height: Math.round((height / 176) * 182),
                  marginLeft: showFullImg ? 0 : -Math.round(marginMagic * height),
                  marginTop: -Math.round((height / 176) * 3),
                }}
                src={url}
              />
              {mstId < 1500 && useDefaultBG && (
                <ShipAvatarBG
                  rank={rank}
                  className={classnames('ship-avatar-bg', {
                    'ship-avatar-bg-nr': rank < 6,
                    'ship-avatar-bg-sr': rank >= 6,
                  })}
                  src={bgurl}
                />
              )}
            </>
          )}
        </ShipAvatarInnerContainer>
        {children}
      </ShipAvatarContainer>
    )
  },
)
Avatar.displayName = 'Avatar'
