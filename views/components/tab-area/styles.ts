import type React from 'react'

import { Classes, Colors, Button, Menu, NonIdealState, Tabs } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { styled, css } from 'styled-components'

export const PoiAppTabpane = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: scroll;
  width: 100%;
  padding: 1px 7px;
`

export const ShipViewTabpanel = styled(PoiAppTabpane)`
  font-size: 15px;
  margin-top: -2px;
`

export const PluginAppTabpane = styled(PoiAppTabpane)`
  height: 100%;
  padding-bottom: 8px;

  & > .bp6-card {
    padding: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
`

export const PoiTabsContainer = styled.div<{ double?: boolean; vertical?: boolean }>`
  display: flex;
  height: 100%;
  ${({ double: d, vertical }) =>
    d &&
    vertical &&
    css`
      flex-direction: column;
    `}
`

export const PoiTabContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

export const PluginDropdownButton = styled(Button)<{ double?: boolean }>`
  width: 100%;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: transparent !important;

  svg[data-icon=${IconNames.CHEVRON_DOWN}] {
    transform: rotate(0);
    transition: transform 0.3s;
  }

  &:hover,
  &.${Classes.ACTIVE} {
    color: ${Colors.BLUE2} !important;

    svg {
      color: ${Colors.BLUE2};
    }

    .${Classes.DARK} & {
      color: ${Colors.BLUE5} !important;

      svg {
        color: ${Colors.BLUE5};
      }
    }
  }

  &.${Classes.ACTIVE} {
    svg[data-icon=${IconNames.CHEVRON_DOWN}] {
      transform: rotate(180deg);
    }
  }

  ${({ double: d }) =>
    d &&
    css`
      width: calc(100% - 13.5px);
      margin-left: 6.5px;
      margin-right: 7px;
    `}
`

export const PluginNonIdealState = styled(NonIdealState)`
  height: 400px;
  max-height: 100%;
  padding: 50px;
`

export const PluginDropdownMenu = styled(Menu)<{ grid?: boolean }>`
  overflow: auto;
  ${({ grid }) =>
    grid
      ? css`
          > *:not(${PluginNonIdealState}) {
            display: block;
            float: left;
            width: calc(100% / 3);
            height: 72px;
          }
        `
      : ''}
`

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const NavTabs = styled(Tabs as React.ComponentType<React.ComponentProps<typeof Tabs>>)`
  width: 100%;

  & > .${Classes.TAB_LIST} {
    gap: 20px;

    & > .${Classes.TAB} {
      flex: 2 0 0;
      margin-right: 0;
      align-items: center;
      justify-content: center;
      display: flex;
      gap: 8px;

      &.half-width {
        flex: 1 0 0;
      }

      svg {
        transform: rotate(0);
        transition: 0s;
      }

      &[aria-selected='true'] {
        svg {
          transform: rotate(360deg);
          transition: 0.75s;
        }
      }
    }
  }
`

export const PluginNameContainer = styled.div`
  align-items: center;
  justify-content: center;
  display: flex;
  gap: 8px;
`

export const PinButton = styled(Button)`
  align-self: center;
  -webkit-app-region: no-drag;
`
