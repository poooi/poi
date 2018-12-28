import styled from 'styled-components'
import { Card, Tooltip } from '@blueprintjs/core'

export const CardWrapper = styled(Card)`
  height: 100%;
  overflow: scroll;
  width: 100%;
  padding: 4px 8px;

  .bp3-tag {
    min-height: initial;
    font-size: 90%;
    line-height: 1.2;
  }
`

export const DockPanelCardWrapper = styled(CardWrapper)`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`

export const PanelItemTooltip = styled(Tooltip)`
  flex: 0 0 ${props => `${100 / props.dimension}%`};
  max-width: ${props => `${100 / props.dimension}%`};
  align-items: center;
  display: flex;

  & > * {
    width: 100%;
    padding: 4px;
  }
`

export const DockName = styled.span`
  flex: 1;
  margin-right: auto;
  overflow: hidden;
  padding-right: 10px;
  text-overflow: clip;
  white-space: nowrap;
`

export const DockInnerWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`

export const Panel = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  overflow: scroll;
  justify-content: center;
`

export const Watermark = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50px;
  height: 50px;
  font-size: 50px;
  opacity: 0.15;
  z-index: -1;
  text-align: right;
`

export const EmptyDockWrapper = styled.div`
  color: #777;
  font-size: 16px;
  height: 20px;
  text-align: center;
  width: 37px;
`
