import type { RootState } from 'views/redux/reducer-factory'
import type { Plugin } from 'views/services/plugin-manager'

import { ContextMenu, Icon, Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import React, { type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'
import { config } from 'views/env'

interface Props {
  plugin: Plugin
  onClick: () => void
  id?: string
  grid?: boolean
}

type Mode = 'legacy-window' | 'window' | 'tab'

const StatusIndicator = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0.6;
`

const PluginMenuItem = styled(MenuItem)<{ grid?: boolean }>`
  align-items: center;
  position: relative;

  ${({ grid }) =>
    grid
      ? css`
          padding: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          ${StatusIndicator} {
            position: absolute;
            top: 7px;
            right: 15px;
          }

          .bp5-menu-item-icon {
            margin-right: 0;
            height: auto;
          }

          .bp5-text-overflow-ellipsis {
            margin-right: 0;
            height: auto;
            line-height: 1.4;
            flex-grow: 0;
            margin-top: 7px;
          }

          /* stylelint-disable-next-line selector-class-pattern */
          [class*='fa-'].svg-inline--fa {
            font-size: 200%;
            margin: 0;
          }
        `
      : css`
          /* stylelint-disable-next-line selector-class-pattern */
          [class*='fa-'].svg-inline--fa {
            width: 1em;
          }
        `}
`

const PluginDropdownMenuItem: FC<Props> = ({ plugin, onClick, id, grid }) => {
  const { t } = useTranslation('setting')
  const pluginConfig = useSelector((state: RootState) => state.config?.poi?.plugin)
  const isFavorite = pluginConfig?.favorite?.[plugin.id]
  const mode: Mode = plugin.handleClick
    ? 'legacy-window'
    : (pluginConfig?.windowmode?.[plugin.id] ?? plugin.windowMode)
      ? 'window'
      : 'tab'

  const contextMenu = (
    <Menu>
      <MenuDivider title={plugin.displayName} />
      <MenuItem
        icon={isFavorite ? 'star' : 'star-empty'}
        text={isFavorite ? t('Unfavorite') : t('Favorite')}
        onClick={(e) => {
          e.preventDefault()
          config.set(`poi.plugin.favorite.${plugin.id}`, !isFavorite)
        }}
      />
      {mode !== 'legacy-window' && (
        <MenuItem
          icon={mode === 'window' ? 'applications' : 'widget-footer'}
          text={mode === 'window' ? t('Open in tab') : t('Open in window')}
          onClick={(e) => {
            e.preventDefault()
            if (mode === 'window') {
              config.set(`poi.plugin.windowmode.${plugin.id}`, false)
            } else {
              config.set(`poi.plugin.windowmode.${plugin.id}`, true)
            }
          }}
        />
      )}
    </Menu>
  )

  return (
    <ContextMenu content={contextMenu}>
      <PluginMenuItem
        onClick={onClick}
        id={id}
        icon={plugin.displayIcon}
        text={plugin.name}
        key={plugin.id}
        grid={grid}
        labelElement={
          <StatusIndicator>
            {isFavorite && <Icon icon="star" />}
            {mode === 'legacy-window' && <Icon icon="open-application" />}
            {mode === 'window' && <Icon icon="applications" />}
          </StatusIndicator>
        }
      />
    </ContextMenu>
  )
}

export default PluginDropdownMenuItem
