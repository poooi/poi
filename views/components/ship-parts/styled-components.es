
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
  ${({transition}) => transition && css`
    transition: all 0.3s 0.2s cubic-bezier(1, 0, 0, 1);
  `}
  ${({left, right}) => left ? css`
    transform: translateX(calc(-100% - 10px));
  ` : right &&  css`
    transform: translateX(calc(100% + 10px));
  `}
  ${({active}) => !active && css`
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
  align-items: flex-end;
  display: flex;
  flex: 1;
  flex-flow: row nowrap;
  overflow: hidden;
  padding-left: 3px;
  padding-top: 7px;
  position: relative;
  white-space: nowrap;

  .bp3-progress-bar {
    height: 7px;
  }
`

export const ShipAvatar = styled(Avatar)`
  position: absolute;
  top: 9px;
  z-index: 10;
  pointer-events: none;
`

export const ShipInfo = styled.div`
  display: flex;
  flex-basis: 0;
  flex-flow: column nowrap;
  justify-content: space-between;
  margin-right: auto;
  min-width: 0;
  padding: 0 4px;
  ${({ show }) => show ? css`
    flex-grow: 1.2;
    flex-shrink: 0;
  ` : css`
    flex-grow: 0;
    flex-shrink: 0;
    height: 58px;
  `}
  ${({avatar}) => avatar && css`
    flex-basis: 100px;
    padding-left: 95px;
  `}
`

export const ShipBasic = styled.div`
  flex: 1;
  font-size: 80%;
  opacity: 0.8;
  padding-top: 0;
  vertical-align: bottom;
  ${({ show }) => !show && css`
    padding-left: 5px;
  `}
`

export const ShipSubText = styled.div`
  flex: 1;
  font-size: 75%;
  opacity: 0.8;
  overflow: hidden;
  padding-top: 0;
  text-overflow: ellipsis;
  vertical-align: bottom;
  margin-bottom: -1px;
`

export const ShipLabel = styled.span`
  margin-left: 5px;
  margin-right: 5px;
  ${({ isTag }) => isTag && css`
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

export const ShipName = styled.span`
  flex: 1;
  font-size: 120%;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const ShipStatWToolTip = styled(Tooltip)`
  display: flex;
  flex-basis: 0;
  flex-flow: column nowrap;
  flex-grow: 2;
  font-size: 90%;
  justify-content: space-between;
  margin-left: auto;
  min-width: 120px;
`

export const LandBaseStat = styled.div`
  display: flex;
  flex-flow: column nowrap;
  font-size: 90%;
  justify-content: space-between;
  margin-left: auto;
  flex-basis: 90px;
  flex-grow: 0.8;
  min-width: 90px;
  padding-right: 5px;
  padding-bottom: 5px;
`

export const ShipHPRow = styled.div`
  margin-bottom: 3px;
`

export const ShipHPTextRow = styled.span`
  display: flex;
  flex-direction: row;
  padding-bottom: 5px;
  align-items: end;

  span,
  div {
    align-self: flex-end;
  }
`


export const ShipHP = styled.span`
  flex: 1;
`

export const StatusLabelContainer = styled.div`
  display: inline-block;
  margin-left: 5px;
  margin-top: -1px;
  position: relative;
  text-align: center;
  vertical-align: middle;
  width: 18px;
  z-index: 100;
`

export const ShipCond = styled.span`
  display: table;
  margin-left: auto;
  text-align: right;
  width: 30px;
`

export const ShipFB = styled.span`
  display: flex;
  flex: 0.75;
  flex-direction: column;
  margin: 0 4px;
  height: 22px;
  margin-bottom: 3px;

  > div {
    margin-top: 4px;
  }
`

export const ShipSlot = styled.div`
  flex-basis: 172px;
  flex-grow: 0;
  flex-shrink: 0;
  overflow: hidden;
  padding: 5px 5px 5px 5px;
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
    background-color: rgba(33, 33, 33, 0.7);
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
    display: ${props => props.onslot ? 'inline' : 'none' };
  }

  ${({warining}) => warining && css`
    color: #F39C12;
  `}

  .png {
    height: 32px;
    margin-bottom: -3px;
    margin-left: -5px;
    margin-top: -5px;
    width: 32px;
  }

  .svg {
    height: 23px;
    width: 26px;
  }
`

export const OnSlotMini = styled(Tag)`
  font-size: 90%;
  margin-left: 2px;
  padding: 3px 6px 3px 5px;
  ${({hide}) => hide && css`
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
