import type { Plugin } from 'views/services/plugin-manager'

import React from 'react'
import { useTranslation } from 'react-i18next'

import PluginDropdownMenuItem from './plugin-dropdown-menu-item'
import {
  DrawerScrollShadow,
  PluginDrawerCard,
  PluginDrawerOverlay,
  PluginNonIdealState,
} from './styles'

interface PluginDrawerProps {
  plugins: Plugin[]
  activeMainTab: string
  isWindowMode: (plugin: Plugin) => boolean
  onOpenWindow: (plugin: Plugin) => void
  onSelectTab: (id: string) => void
  handlePluginPin: (plugin: Plugin) => void
  onSelect: (plugin: Plugin) => void
  onClose: () => void
  closing?: boolean
  onCloseAnimationEnd: () => void
  noAnimation?: boolean
}

export const PluginDrawer = ({
  plugins,
  activeMainTab,
  isWindowMode,
  onOpenWindow,
  handlePluginPin,
  onSelect,
  onClose,
  closing,
  onCloseAnimationEnd,
  noAnimation = false,
}: PluginDrawerProps): React.ReactElement => {
  const { t } = useTranslation(['setting'])

  const cardProps = {
    $closing: closing,
    $noAnimation: noAnimation,
    onAnimationEnd:
      !noAnimation && closing
        ? (e: React.AnimationEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onCloseAnimationEnd()
          }
        : undefined,
  }

  if (plugins.length === 0) {
    return (
      <PluginDrawerCard {...cardProps}>
        <DrawerScrollShadow>
          <PluginDrawerOverlay>
            <PluginNonIdealState
              icon="cloud-download"
              title={t('setting:No plugin found')}
              description={t('setting:Install plugins in settings')}
            />
          </PluginDrawerOverlay>
        </DrawerScrollShadow>
      </PluginDrawerCard>
    )
  }

  return (
    <PluginDrawerCard {...cardProps}>
      <DrawerScrollShadow>
        <PluginDrawerOverlay>
          {plugins.map((plugin) => {
            const isTab = !plugin.handleClick && !isWindowMode(plugin)
            const handleClick = () => {
              if (isTab) {
                onSelect(plugin)
              } else {
                onClose()
                if (plugin.handleClick) {
                  plugin.handleClick()
                } else {
                  onOpenWindow(plugin)
                }
              }
            }
            return (
              <PluginDropdownMenuItem
                key={plugin.id}
                onClick={handleClick}
                id={activeMainTab === plugin.id ? '' : plugin.id}
                plugin={plugin}
                handlePluginPin={handlePluginPin}
              />
            )
          })}
        </PluginDrawerOverlay>
      </DrawerScrollShadow>
    </PluginDrawerCard>
  )
}
