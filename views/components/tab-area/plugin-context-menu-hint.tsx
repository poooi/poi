import type { RootState } from 'views/redux/reducer-factory'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ContextMenuHint } from 'views/components/etc/context-menu-hint'
import { config } from 'views/env'

const HINT_DISMISSED_CONFIG = 'poi.misc.pluginContextMenuHintDismissed'

/**
 * Points at the plugin rows' right-click menu (favourite, tab/window, pin).
 *
 * Sits above the plugin grid rather than inside it: the drawer lays its rows
 * out on a fixed 72px grid, which a one-line hint has no business joining.
 */
export const PluginContextMenuHint = () => {
  const { t } = useTranslation('main')
  const dismissed = useSelector(
    (state: RootState) => state.config?.poi?.misc?.pluginContextMenuHintDismissed ?? false,
  )
  return (
    <ContextMenuHint
      className="plugin-context-menu-hint"
      text={t('main:Right-click a plugin for more options')}
      dismissed={dismissed}
      onDismiss={() => config.set(HINT_DISMISSED_CONFIG, true)}
    />
  )
}
