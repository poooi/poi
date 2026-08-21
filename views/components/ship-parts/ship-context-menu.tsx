import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { Ship } from 'views/redux/info/ships'
import type { RootState } from 'views/redux/reducer-factory'

import { Menu, MenuDivider, MenuItem, showContextMenu } from '@blueprintjs/core'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ContextMenuHint } from 'views/components/etc/context-menu-hint'
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

/** Both ship panes render this, and both share the one flag. */
export const ShipContextMenuHint = () => {
  const { t } = useTranslation('main')
  const dismissed = useSelector(
    (state: RootState) => state.config?.poi?.misc?.shipContextMenuHintDismissed ?? false,
  )
  return (
    <ContextMenuHint
      className="ship-context-menu-hint"
      text={t('main:Right-click a ship for more options')}
      dismissed={dismissed}
      onDismiss={() => config.set(HINT_DISMISSED_CONFIG, true)}
    />
  )
}
