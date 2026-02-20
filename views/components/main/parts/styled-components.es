import { Card, Tooltip } from '@blueprintjs/core'
import { styled } from 'styled-components'

export const CardWrapper = styled(Card)`
  height: 100%;
  overflow: scroll;
  width: 100%;
  padding: 4px 8px;
  container-type: size;

  .bp5-tag {
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
  display: flex;
  align-items: center;

  & > * {
    width: 100%;
    padding: 4px;
  }
`

export const DockName = styled.div`
  flex: 1;
  margin-right: auto;
  overflow: hidden;
  padding-right: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;

  @container (min-width: 132px) {
    opacity: 1;
  }
`

export const DockInnerWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  container-type: size;
`

export const Panel = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  overflow: scroll;
  justify-content: center;
  vertical-align: middle;
  align-items: center;
  grid-template-columns: repeat(1, 1fr);

  @container (min-width: 256px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @container (min-width: 496px) {
    grid-template-columns: repeat(4, 1fr);
  }
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

  + ${DockName} {
    opacity: 1;
  }
`
