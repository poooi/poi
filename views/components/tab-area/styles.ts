import type React from 'react'

import { Classes, Colors, Button, Card, Menu, NonIdealState, Tabs } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { styled, css, keyframes } from 'styled-components'
import ScrollShadow from 'views/components/etc/scroll-shadow'

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

export const PluginDropdownButton = styled(Button)<{ double?: boolean; $compact?: boolean }>`
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

  /* Inside the tab list the button must shrink to its icon, not fill 100% of the row */
  ${({ $compact }) =>
    $compact &&
    css`
      width: auto;
    `}
`

export const PluginNonIdealState = styled(NonIdealState)`
  height: 400px;
  max-height: 100%;
  padding: 50px;
`

export const PluginDropdownMenu = styled(Menu)`
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 72px;
  align-content: start;
  background: transparent !important;

  > ${PluginNonIdealState} {
    grid-column: 1 / -1;
    height: auto;
  }
`

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

const drawerReveal = keyframes`
  from { opacity: 0; transform: scale(1.12); }
  to   { opacity: 1; transform: scale(1);    }
`

const drawerDismiss = keyframes`
  from { opacity: 1; transform: scale(1);    }
  to   { opacity: 0; transform: scale(1.12); }
`

export const PluginContentArea = styled.div`
  flex: 1 0 0;
  height: 100%;
  position: relative;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

export const PluginDrawerCard = styled(Card)<{ $closing?: boolean; $noAnimation?: boolean }>`
  position: absolute;
  inset: 8px;
  z-index: 10;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: transform, opacity;
  animation: ${({ $closing, $noAnimation }) =>
    $noAnimation
      ? 'none'
      : $closing
        ? css`
            ${drawerDismiss} 0.15s cubic-bezier(0.4, 0, 1, 1) forwards
          `
        : css`
            ${drawerReveal} 0.2s cubic-bezier(0, 0, 0.2, 1) forwards
          `};
`

export const DrawerScrollShadow = styled(ScrollShadow)`
  flex: 1;
  overflow-y: auto;
  padding: 4px;
`

export const PluginDrawerOverlay = styled(PluginDropdownMenu)`
  background: transparent;
  overflow: visible;
  grid-auto-rows: 72px;

  .bp6-context-menu {
    align-content: center;
  }
`

/* Permanent wrapper — never conditionally unmounted so TabContentsUnion ref stays stable. */
export const PluginContentWrapper = styled.div<{ $dimmed?: boolean; $noAnimation?: boolean }>`
  flex: 1 0 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: ${({ $noAnimation }) => ($noAnimation ? 'none' : 'opacity 0.2s ease')};
  ${({ $dimmed }) =>
    $dimmed &&
    css`
      opacity: 0;
    `}
`
