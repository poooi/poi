import type { FcdShipTagState } from 'views/redux/fcd'
import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import { isEqual } from 'lodash'
import React, { memo } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

const TEXTS = [['Retreated'], ['Repairing'], ['Resupply Needed']]
const INTENTS = [Intent.WARNING, Intent.NONE, Intent.WARNING]
const ICONS = ['reply', 'wrench', 'database']

const initState: FcdShipTagState = {
  color: [],
  mapname: [],
  fleetname: { 'zh-CN': [], 'zh-TW': [], 'en-US': [], 'ja-JP': [] },
}

interface StatusLabelProps {
  label?: number | null
}

export const StatusLabel = memo(({ label: i }: StatusLabelProps) => {
  const { t, i18n } = useTranslation('main')
  const shipTag = useSelector((state: RootState) => state.fcd.shiptag ?? initState, isEqual)
  const { color, mapname, fleetname } = shipTag
  const language = i18n.language

  if (i != null && i >= 0) {
    return (
      <Tooltip
        position={Position.TOP}
        content={
          i > 2
            ? // @ts-expect-error type is ensured by the selector
              `${(fleetname[language] ?? [])[i - 3] ?? t('main:Ship tag')} - ${mapname[i - 3] || i - 2}`
            : t(`main:${TEXTS[i]}`)
        }
      >
        <Tag
          minimal
          intent={INTENTS[i] ?? Intent.NONE}
          style={i > 2 ? { color: color[i - 3] } : {}}
        >
          <FontAwesome key={0} name={ICONS[i] ?? 'tag'} />
        </Tag>
      </Tooltip>
    )
  } else {
    return null
  }
})
StatusLabel.displayName = 'StatusLabel'
