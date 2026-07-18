import type { RootState } from 'views/redux/reducer-factory'

import { Intent } from '@blueprintjs/core'
import path from 'path'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { SlotitemIcon } from 'views/components/etc/icon'
import { ALevel } from 'views/components/ship-parts/styled-components'
import { slotitemsDataSelectorFactory } from 'views/components/ship/slotitems'
import { equipIsAircraft } from 'views/utils/game-utils'

import { ItemName, Level, OnSlot, SlotItemContainerMini, SlotItemName } from './styled-components'

export const MiniSlotitems = ({ shipId }: { shipId: number }) => {
  const { t } = useTranslation('resources')
  const selector = React.useMemo(() => slotitemsDataSelectorFactory(shipId), [shipId])
  const { api_maxeq, equipsData } = useSelector((state: RootState) => selector(state))

  return (
    <ItemName className="item-name slotitems-mini" hide={!equipsData}>
      {(equipsData ?? []).filter(Boolean).map((equipData, equipIdx) => {
        const [equip, $equip, onslot] = equipData!
        const equipIconId = ($equip.api_type as number[])[3]
        const level = equip.api_level as number
        const proficiency = equip.api_alv as number | undefined
        const isAircraft = equipIsAircraft($equip)
        const maxOnslot = (api_maxeq ?? [])[equipIdx]
        const onslotWarning = maxOnslot !== undefined && (onslot ?? 0) < maxOnslot
        return (
          <SlotItemContainerMini key={equipIdx} className="slotitem-container-mini">
            <SlotitemIcon
              key={equip.api_id as number}
              className="slotitem-img"
              slotitemId={equipIconId}
            />
            <SlotItemName>
              {$equip ? t(`resources:${$equip.api_name}`, { keySeparator: '%%%%' }) : '???'}
            </SlotItemName>
            {Boolean(level) && (
              <Level>
                <FontAwesome name="star" />
                {level}
              </Level>
            )}
            {proficiency && (
              <ALevel
                className="alv-img"
                src={path.join('assets', 'img', 'airplane', `alv${proficiency}.png`)}
              />
            )}
            <OnSlot
              className="slotitems-onslot"
              hide={!isAircraft}
              intent={onslotWarning ? Intent.WARNING : Intent.SUCCESS}
            >
              {onslot}
            </OnSlot>
          </SlotItemContainerMini>
        )
      })}
    </ItemName>
  )
}
