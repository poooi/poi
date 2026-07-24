import type { Intent } from '@blueprintjs/core'
import type { RootState } from 'views/redux/reducer-factory'

import { memoize, get } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { styled } from 'styled-components'
import { SlotItemContainer } from 'views/components/ship-parts/styled-components'
import { LandbaseSlotitems } from 'views/components/ship/slotitems'
import {
  getEquipAvatarBGByRarity,
  getTyku,
  LBAC_INTENTS,
  LBAC_STATUS_NAMES,
} from 'views/utils/game-utils'
import { landbaseSelectorFactory, landbaseEquipDataSelectorFactory } from 'views/utils/selectors'

import {
  LandBaseState,
  LandBaseStatTag,
  MiniGradient,
  MiniShipAvatar,
  MiniShipItem,
  MiniShipName,
  ShipFP,
  ShipLvAvatar,
  ShipStateText,
  ShipTile,
} from './styled-components'

const MiniLandbaseSlotitems = styled(LandbaseSlotitems)`
  ${SlotItemContainer} .png {
    height: 32px;
    margin-bottom: -3px;
    margin-left: -5px;
    margin-top: -5px;
    width: 32px;
  }

  ${SlotItemContainer} .svg {
    height: 23px;
    margin-right: 2px;
    width: 26px;
  }
`

const miniSquardSelectorFactory = memoize((squardId: number) =>
  createSelector(
    [landbaseSelectorFactory(squardId), landbaseEquipDataSelectorFactory(squardId)],
    (landbase, equipsData) => ({ landbase, equipsData, squardId }),
  ),
)

export const MiniSquardRow = ({
  squardId,
  enableAvatar,
  compact,
}: {
  squardId: number
  enableAvatar?: boolean
  compact?: boolean
}) => {
  const { t } = useTranslation('main')
  const selector = React.useMemo(() => miniSquardSelectorFactory(squardId), [squardId])
  const { landbase, equipsData } = useSelector((state: RootState) => selector(state))

  const hideShipName = enableAvatar && compact
  const lb = landbase
  const api_action_kind = lb?.api_action_kind ?? 0
  const api_name = lb?.api_name ?? ''
  const tyku = getTyku(equipsData ? [equipsData] : [], api_action_kind)
  return (
    <ShipTile className="ship-tile">
      <MiniShipItem className="ship-item" avatar={enableAvatar} shipName={!hideShipName} isLBAC>
        {enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
          <>
            <MiniShipAvatar
              type="equip"
              mstId={equipsData?.[0]?.[0]?.api_slotitem_id}
              height={38}
              useDefaultBG={false}
              useFixedWidth={false}
            />
            <MiniGradient color={getEquipAvatarBGByRarity(equipsData?.[0]?.[1]?.api_rare ?? 5)} />
          </>
        )}
        {hideShipName && (
          <ShipLvAvatar className="ship-lv-avatar">
            {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
          </ShipLvAvatar>
        )}
        {!hideShipName && (
          <>
            <MiniShipName className="ship-name" avatar={enableAvatar}>
              {api_name}
            </MiniShipName>
            <ShipFP className="ship-fp" avatar={enableAvatar}>
              {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
            </ShipFP>
          </>
        )}
        <LandBaseStatTag
          className="landbase-status"
          minimal
          intent={LBAC_INTENTS[api_action_kind] as Intent}
        >
          {t(LBAC_STATUS_NAMES[api_action_kind])}
        </LandBaseStatTag>
        <LandBaseState className="ship-stat landbase-stat">
          <ShipStateText>
            <MiniLandbaseSlotitems landbaseId={squardId} isMini />
          </ShipStateText>
        </LandBaseState>
      </MiniShipItem>
    </ShipTile>
  )
}
