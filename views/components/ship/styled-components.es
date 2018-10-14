
import { Avatar } from 'views/components/etc/avatar'
import styled, { css } from 'styled-components'
import { Tooltip } from '@blueprintjs/core'

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
`

export const ShipLabel = styled.span`
  margin-left: 5px;
  margin-right: 5px;
  ${({ isTag }) => {
    isTag && css`
      position: relative;
      top: -1px;
      .bp3-tag {
        overflow: visible;
        max-width: initial;
        font-size: 80%;
        padding: 0.125em 0.6em;
      }
    `
  }}
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
  flex-basis: 0;
  flex-flow: column nowrap;
  flex-grow: 2;
  font-size: 90%;
  justify-content: space-between;
  margin-left: auto;
  min-width: 120px;
  flex-basis: 90px;
  flex-grow: 0.8;
  min-width: 90px;
  padding-right: 5px;
  padding-bottom: 5px;
`

export const ShipHPRow = styled.div`
  margin-bottom: 5px;
`

export const ShipHPTextRow = styled.span`
  display: flex;
  flex-direction: row;
  padding-bottom: 5px;
  align-items: end;
  span, div {
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
  margin-bottom: 5px;
  > div {
    margin-top: 4px;
  }
`

export const SlotItemContainer = styled.div`
  flex-basis: 172px;
  flex-grow: 0;
  flex-shrink: 0;
  overflow: hidden;
  padding: 5px 5px 5px 5px;
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
