import type { RootState } from 'views/redux/reducer-factory'

import classnames from 'classnames'
import { remove } from 'fs-extra'
import path from 'path'
import React, { memo } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { css, styled } from 'styled-components'
import { equipRankBackgrounds, shipRankBackgrounds } from 'views/utils/game-utils'
import { getShipImgPath, getSlotItemImgPath } from 'views/utils/ship-img'
import { indexify } from 'views/utils/tools'

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

// The old <img> got its height from the image's intrinsic aspect ratio and used
// offsets to frame the interesting part; a gradient has no intrinsic size, so
// just fill the container. The container's mask only fades content past 65%,
// which leaves the gradient as a hard-edged block on the panel — so fade the
// BG itself the same way the ship art fades, but earlier and never fully
// opaque, letting the panel background mix through.
const avatarBGFade = css`
  position: absolute;
  inset: 0;
  z-index: -1;
  mask-image: linear-gradient(
    to right,
    rgb(0 0 0 / 0.85) 0%,
    rgb(0 0 0 / 0.5) 55%,
    rgb(0 0 0 / 0) 95%
  );
`

const ShipAvatarBG = styled.div<{ rank: number }>`
  ${avatarBGFade}
  background: ${({ rank }) => shipRankBackgrounds[rank] ?? shipRankBackgrounds[0]};
`

const EquipAvatarBG = styled.div<{ rank: number }>`
  ${avatarBGFade}
  background: ${({ rank }) => equipRankBackgrounds[rank] ?? equipRankBackgrounds[0]};
`

// Remove old folder
remove(path.join(APPDATA_PATH, 'avatar')).catch(() => null)

// $shipgraph is an array; every mounted Avatar's selector runs on every store
// dispatch, so index it once per const-data update instead of a linear find
const shipgraphIndexSelector = createSelector(
  [(state: RootState) => state.const.$shipgraph],
  ($shipgraph) => indexify($shipgraph ?? []),
)

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
    const { url, marginMagic, rank } = useSelector((state: RootState) => {
      if (!mstId) return { url: '', marginMagic: 0.555, rank: 7 }
      const ip = state.info.server.ip ?? '203.104.209.71'
      if (type === 'equip') {
        const $equip = state.const.$equips?.[mstId]
        const version = $equip?.api_version ?? 1
        const rank = rankProp ?? $equip?.api_rare ?? 5
        return {
          url: getSlotItemImgPath(mstId, 'item_up', ip, version),
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
        const version = shipgraphIndexSelector(state)[mstId]?.api_version[0]
        const rank =
          rankProp ??
          state.fcd.shipavatar?.backs?.[mstId] ??
          state.const.$ships?.[mstId]?.api_backs ??
          7
        return {
          url: getShipImgPath(mstId, isEnemy ? 'banner' : 'remodel', isDamaged, ip, version),
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
              {useDefaultBG && <EquipAvatarBG className="equip-avatar-bg" rank={rank} />}
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
