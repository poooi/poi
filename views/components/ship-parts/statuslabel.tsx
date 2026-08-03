import type { FcdShipTagState } from 'views/redux/fcd'
import type { RootState } from 'views/redux/reducer-factory'
import type { ShipLabel } from 'views/utils/game-utils'

import { Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import { isEqual } from 'lodash'
import React, { memo } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ShipLabelStatus } from 'views/utils/game-utils'

const TEXTS: Record<ShipLabelStatus, string> = {
  [ShipLabelStatus.Retreated]: 'Retreated',
  [ShipLabelStatus.Repairing]: 'Repairing',
  [ShipLabelStatus.ResupplyNeeded]: 'Resupply Needed',
  [ShipLabelStatus.ShipTag]: 'Ship tag',
}
const INTENTS: Record<ShipLabelStatus, Intent> = {
  [ShipLabelStatus.Retreated]: Intent.WARNING,
  [ShipLabelStatus.Repairing]: Intent.NONE,
  [ShipLabelStatus.ResupplyNeeded]: Intent.WARNING,
  [ShipLabelStatus.ShipTag]: Intent.NONE,
}
const ICONS: Record<ShipLabelStatus, string> = {
  [ShipLabelStatus.Retreated]: 'reply',
  [ShipLabelStatus.Repairing]: 'wrench',
  [ShipLabelStatus.ResupplyNeeded]: 'database',
  [ShipLabelStatus.ShipTag]: 'tag',
}

const initState: FcdShipTagState = {
  color: [],
  mapname: [],
  fleetname: { 'zh-CN': [], 'zh-TW': [], 'en-US': [], 'ja-JP': [] },
}

interface StatusLabelProps {
  label?: ShipLabel[] | null
}

export const StatusLabel = memo(({ label: labels }: StatusLabelProps) => {
  const { t, i18n } = useTranslation('main')
  const shipTag = useSelector((state: RootState) => state.fcd.shiptag ?? initState, isEqual)
  const { color, mapname, fleetname } = shipTag
  const language = i18n.language

  if (!labels?.length) {
    return null
  }

  const describe = ({ status, sallyArea }: ShipLabel): string => {
    if (status === ShipLabelStatus.ShipTag && sallyArea) {
      const tagIndex = sallyArea - 1
      const name = (fleetname[language] ?? [])[tagIndex] ?? t('main:Ship tag')
      return `${name} - ${mapname[tagIndex] || sallyArea}`
    }
    return t(`main:${TEXTS[status]}`)
  }

  // the first label is the most significant one, it decides how the tag looks
  const [{ status: primary, sallyArea }] = labels

  return (
    <Tooltip
      position={Position.TOP}
      content={
        <>
          {labels.map((label) => (
            <div key={label.status}>{describe(label)}</div>
          ))}
        </>
      }
    >
      <Tag
        minimal
        intent={INTENTS[primary] ?? Intent.NONE}
        style={
          primary === ShipLabelStatus.ShipTag && sallyArea ? { color: color[sallyArea - 1] } : {}
        }
      >
        <FontAwesome key={0} name={ICONS[primary] ?? 'tag'} />
      </Tag>
    </Tooltip>
  )
})
StatusLabel.displayName = 'StatusLabel'
