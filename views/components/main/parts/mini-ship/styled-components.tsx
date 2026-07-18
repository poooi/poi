import { Tag } from '@blueprintjs/core'
import { css, styled } from 'styled-components'
import { Avatar } from 'views/components/etc/avatar'
import { Gradient, overAvatarText } from 'views/components/ship-parts/styled-components'

export const SlotItemContainerMini = styled.div`
  align-items: center;
  display: flex;
  flex-flow: row;
  margin-top: 4px;

  .png {
    height: 32px;
    margin-bottom: -8px;
    margin-top: -8px;
    width: 32px;
  }

  .svg {
    height: 20px;
    width: 20px;
  }
`

export const ItemName = styled.div<{ hide?: boolean }>`
  display: flex;
  flex-flow: column;
  margin-bottom: 5px;
  ${({ hide }) =>
    hide &&
    css`
      display: none;
    `}
`

export const SlotItemName = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Level = styled.strong`
  color: #45a9a5;
  margin-left: 1em;
  margin-right: 1em;
`

export const OnSlot = styled(Tag)<{ hide?: boolean }>`
  width: 3em;
  text-align: center;
  display: flex;
  align-items: center;
  margin-left: 1ex;
  ${({ hide }) =>
    hide &&
    css`
      display: none;
    `}
`

export const ShipTooltip = styled.div`
  font-size: 13px;
  white-space: nowrap;

  .material-icon {
    margin-right: auto;
  }
`

// The compact 2-row grid of the mini panel; intentionally distinct from the
// 4-row ship-parts ShipItem.
export const MiniShipItem = styled.div<{ avatar?: boolean; shipName?: boolean; isLBAC?: boolean }>`
  align-items: start;
  display: grid;
  flex: 1;
  flex-flow: row nowrap;
  overflow: hidden;
  position: relative;
  white-space: nowrap;
  ${({ avatar = true, shipName = true, isLBAC = false }) => {
    const avatarWidth = avatar ? '50px' : '0'
    const nameWidth = shipName ? 'minmax(35px, 95px)' : isLBAC ? '1fr' : '15px'
    const dataWidth = isLBAC ? '32px 120px' : 'minmax(70px, 5fr) 18px 42px'
    return css`
      grid-template-columns: ${avatarWidth} ${nameWidth} ${dataWidth};
      grid-template-rows: 20px 13px;
      gap: 5px 6px;
    `
  }}
`

export const ShipLvAvatar = styled.div`
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  z-index: 99;
  display: flex;
  filter: drop-shadow(0 0 2px black);
  font-size: 70%;
  line-height: 1;
  text-shadow: 0 0 2px rgb(0 0 0 / 1);
  white-space: nowrap;
`

export const ShipInfo = styled.div`
  grid-row: 1 / 3;
  grid-column: 1 / 3;
  z-index: 100;
  height: 100%;

  & > div {
    height: 100%;
    width: 100%;
  }
`

export const MiniShipName = styled.div<{ avatar?: boolean }>`
  z-index: 2;
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ avatar }) => avatar && overAvatarText({ fontWeight: 600, shadowBlur: '3px' })}
`

export const ShipLvText = styled.div<{ avatar?: boolean }>`
  z-index: 2;
  grid-row: 2 / 3;
  grid-column: 2 / 3;
  font-size: 70%;
  line-height: 1;
  overflow: hidden;
  align-items: center;
  ${({ avatar }) => avatar && overAvatarText({ shadowBlur: '3px' })}
`

export const ShipStateText = styled.div`
  display: flex;
`

export const MiniShipHP = styled.span`
  font-size: 110%;
  grid-row: 1 / 2;
  grid-column: 3 / 4;
`

export const MiniStatusLabelContainer = styled.div`
  grid-row: 1 / 2;
  grid-column: 4 / 5;
  position: relative;
  text-align: center;
  vertical-align: middle;
  z-index: 101;
`

export const MiniShipCond = styled.div`
  align-self: flex-end;
  grid-row: 1 / 2;
  grid-column: 5 / 6;
  text-align: right;
  white-space: nowrap;
`

export const HPProgress = styled.div`
  grid-row: 2 / 3;
  grid-column: 3 / 6;

  .bp6-progress-bar {
    flex: auto;
    height: 7px;
    margin-top: 3px;
  }
`

export const MiniShipAvatar = styled(Avatar)`
  pointer-events: none;
  align-items: end;
  align-self: center;
  grid-row: 1 / 3;
  grid-column: 1 / 3;
`

// Same per-ship gradient as the main panel, spanning the mini grid's 2 rows.
export const MiniGradient = styled(Gradient)`
  grid-row: 1 / 3;
`

export const ShipTile = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  position: relative;
  width: 100%;

  .ship-item-wrapper {
    width: 100%;
  }

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
`

export const LandBaseStatTag = styled(Tag)`
  grid-column: 3 / 4;
  grid-row: 2 / 3;
  font-size: 63% !important;
  text-align: center;
`

export const LandBaseState = styled.div`
  grid-column: 4 / 5;
  grid-row: 1 / 3;
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  justify-content: space-between;
  align-self: end;
`

export const ShipFP = styled.div<{ avatar?: boolean }>`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  font-size: 70%;
  z-index: 2;
  ${({ avatar }) => avatar && overAvatarText({ shadowBlur: '3px' })}
`
