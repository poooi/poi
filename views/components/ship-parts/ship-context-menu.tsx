import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { Ship } from 'views/redux/info/ships'
import type { RootState } from 'views/redux/reducer-factory'

import {
  Button,
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
  Position,
  showContextMenu,
  Tooltip,
} from '@blueprintjs/core'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { openEquipSearchForShip } from 'views/components/etc/global-search/event'
import { config } from 'views/env'

/**
 * The right-click menu the ship tiles share, headed by the ship's full name —
 * the tiles themselves ellipsize it, and the mini tile can hide it entirely.
 *
 * Returned as a handler rather than a wrapper component so the tiles keep the
 * DOM shape their grid layouts depend on. Blueprint's imperative context menu
 * renders into `document.body`, which carries the `bp6-dark` class, so it
 * picks up the current theme on its own.
 */
export const useShipContextMenu = (ship?: Ship, $ship?: APIMstShip) => {
  const { t } = useTranslation(['main', 'resources'])

  return useCallback(
    (event: React.MouseEvent) => {
      if (!ship || !$ship) return
      event.preventDefault()
      event.stopPropagation()
      showContextMenu({
        content: (
          <Menu>
            <MenuDivider title={t(`resources:${$ship.api_name}`, { keySeparator: 'chiba' })} />
            <MenuItem
              icon="search"
              text={t('main:Search equipment for this ship')}
              onClick={() =>
                openEquipSearchForShip({
                  shipMstId: $ship.api_id,
                  shipMemId: ship.api_id,
                  name: $ship.api_name,
                  slots: ship.api_slotnum ?? 0,
                  // 0 means the ex-slot was never opened; -1 is open and empty.
                  hasExtra: (ship.api_slot_ex ?? 0) !== 0,
                })
              }
            />
          </Menu>
        ),
        targetOffset: { left: event.clientX, top: event.clientY },
      })
    },
    [ship, $ship, t],
  )
}

const HINT_DISMISSED_CONFIG = 'poi.misc.shipContextMenuHintDismissed'

const HintBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
  padding: 1px 2px 1px 6px;
  border-radius: 3px;
  background: rgb(45 114 210 / 0.18);
  font-size: 12px;
`

const HintText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/**
 * One-shot pointer at the menu above, which is otherwise undiscoverable: a
 * right-click target looks exactly like one that is not.
 *
 * Both ship panes render it and both share the one config flag, so dismissing
 * it in either place retires it everywhere.
 */
export const ShipContextMenuHint = () => {
  const { t } = useTranslation('main')
  const dismissed = useSelector(
    (state: RootState) => state.config?.poi?.misc?.shipContextMenuHintDismissed ?? false,
  )
  if (dismissed) return null

  return (
    <HintBar className="ship-context-menu-hint">
      <Icon icon="info-sign" size={12} />
      <HintText title={t('main:Right-click a ship for more options')}>
        {t('main:Right-click a ship for more options')}
      </HintText>
      <Tooltip content={t('main:Got it')} position={Position.TOP}>
        <Button
          minimal
          small
          icon="cross"
          onClick={() => config.set(HINT_DISMISSED_CONFIG, true)}
        />
      </Tooltip>
    </HintBar>
  )
}
