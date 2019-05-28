import { Avatar } from 'views/components/etc/avatar'
import styled, { css } from 'styled-components'
import { Tooltip, Card, ButtonGroup, Tag } from '@blueprintjs/core'
import { ScrollShadow } from 'views/components/etc/scroll-shadow'

export const ShipCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2px;
`

export const ShipWrapper = styled.div`
  height: 100%;
  padding: 2px 2px 7px 2px;
  overflow: auto;
`

export const ShipTabContainer = styled.div`
  flex: 1;
  overflow: hidden;
`

export const ShipTabContent = styled.div`
  display: flex;
  flex-flow: row;
  height: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
`

export const ShipDeck = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  ${({ transition }) =>
    transition &&
    css`
      transition: all 0.3s 0.2s cubic-bezier(1, 0, 0, 1);
    `}
  ${({ left, right }) =>
    left
      ? css`
          transform: translateX(calc(-100% - 10px));
        `
      : right &&
        css`
          transform: translateX(calc(100% + 10px));
        `}
  ${({ active }) =>
    !active &&
    css`
      & > * {
        display: none;
      }
    `}
`

export const ShipDetails = styled(ScrollShadow)`
  overflow: scroll;
  flex: 1;
`

export const FleetNameButtonContainer = styled.div`
  overflow: scroll;
  display: flex;
  flex-flow: row;
`

export const FleetNameButton = styled(ButtonGroup)`
  white-space: nowrap;
  display: flex;
  padding: 5px 5px 1px 5px;
  width: 100%;

  .bp3-button {
    flex: 1;
    overflow: hidden;
  }
`

export const AirbaseArea = styled.div`
  padding-left: 8px;
  text-align: left;
  white-space: nowrap;
  margin-top: 5px;
  width: 100%;
`

export const ShipItem = styled.div`
  align-items: center;
  display: grid;
  flex: 1;
  flex-flow: row nowrap;
  overflow: hidden;
  padding-left: 3px;
  padding-top: 7px;
  position: relative;
  white-space: nowrap;
  ${({ avatar = true, shipName = true, isLBAC = false }) => {
    const avatarWidth = avatar ? '95px' : 0
    const nameWidth = shipName ? '5fr' : 0
    const fbWidth = isLBAC ? 0 : '3fr'
    return css`
      grid-template-columns: ${avatarWidth} ${nameWidth} minmax(60px, 5fr) 18px 42px ${fbWidth} 172px;
      grid-template-rows: 16px 10px 16px 16px;
      grid-column-gap: 5px;
    `
  }}

  .bp3-progress-bar {
    height: 7px;
  }
`

export const ShipAvatar = styled(Avatar)`
  grid-column: 1 / 2;
  grid-row: 1 / 5;
  pointer-events: none;
`

export const ShipBasic = styled.div`
  font-size: 80%;
  opacity: 0.8;
  grid-column: 2 / 6;
  grid-row: 1 / 2;
  vertical-align: bottom;
`

export const ShipSubText = styled.div`
  grid-column: 2 / 3;
  grid-row: 4 / 5;
  font-size: 75%;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
`

export const ShipName = styled.span`
  grid-column: 2 / 3;
  grid-row: 2 / 4;
  font-size: 120%;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const LBACName = styled.span`
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  font-size: 120%;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const LBACRange = styled.div`
  grid-column: 2 / 3;
  grid-row: 3 / 4;
  font-size: 75%;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
`

export const LBACFP = ShipSubText

export const ShipStatWToolTip = styled(Tooltip)`
  grid-column: 3 / 6;
  grid-row: 2 / 5;
  z-index: 100;
  height: 100%;

  & > div {
    height: 100%;
    width: 100%;
  }
`

export const ShipHP = styled.span`
  ${({ shipName }) =>
    shipName
      ? css`
          grid-column: 3 / 4;
        `
      : css`
          grid-column: 2 / 4;
        `}
  grid-row: 2 / 4;
  align-self: flex-end;
`

export const StatusLabelContainer = styled.div`
  grid-column: 4 / 5;
  grid-row: 2 / 4;
  z-index: 100;
  align-self: flex-end;
`

export const ShipStatusContainer = styled.div`
  grid-column: 5 / 6;
  grid-row: 2 / 4;
  align-self: flex-end;
  justify-self: flex-end;
`

export const ShipHPProgress = styled.div`
  ${({ shipName }) =>
    shipName
      ? css`
          grid-column: 3 / 6;
        `
      : css`
          grid-column: 2 / 6;
        `}
  grid-row: 4 / 5;
`

export const ShipFB = styled.span`
  grid-column: 6 / 7;
  grid-row: 3 / 5;
  display: flex;
  flex-direction: column;

  > div {
    margin-top: 4px;
  }
`

export const ShipSlot = styled.div`
  grid-column: 7 / 8;
  grid-row: 2 / 5;
  align-self: flex-end;
`

export const ShipLabel = styled.span`
  margin-left: 5px;
  margin-right: 5px;
  height: 1em;
  ${({ isTag }) =>
    isTag &&
    css`
      position: relative;
      top: -1px;
      .bp3-tag {
        overflow: visible;
        max-width: initial;
        font-size: 80%;
        padding: 0.125em 0.6em;
        min-height: 10px;
      }
    `}
`

export const ShipCond = styled.span`
  display: table;
  margin-left: auto;
  text-align: right;
  width: 30px;
`

export const SlotItems = styled.div`
  display: flex;
`

export const SlotItemContainer = styled.div`
  display: inline;
  margin-right: 2px;
  position: relative;
  vertical-align: bottom;

  &::after {
    background-color: ${props => props.theme.slotBg};
    border-radius: 9px;
    bottom: -3px;
    content: attr(data-onslot);
    font-size: 12px;
    height: 18px;
    left: -3px;
    line-height: 18px;
    padding-left: 2px;
    padding-right: 2px;
    position: absolute;
    text-align: center;
    width: 18px;
    display: ${props => (props.showOnslot ? 'inline' : 'none')};
  }

  color: ${props => props.warning && props.theme.ORANGE1};

  .png {
    height: 32px;
    margin-bottom: -3px;
    margin-left: -5px;
    margin-top: -5px;
    width: 32px;
  }

  .svg {
    transform: scale(1.25);
    transform-origin: bottom left;
    height: 23px;
    width: 26px;
  }
`

export const OnSlotMini = styled(Tag)`
  font-size: 90%;
  margin-left: 2px;
  padding: 3px 6px 3px 5px;
  ${({ hide }) =>
    hide &&
    css`
      display: none;
    `}
`

export const AACITypeName = styled.div`
  &:first-child::before {
    content: ' - ';
  }

  &::after {
    content: ' / ';
  }

  &:last-child::after {
    content: '';
  }
`

export const ALevel = styled.img`
  height: 14px;
  margin-bottom: 2px;
`
