import {join} from 'path-extra'
import classNames from 'classnames'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'

const {$, $$, _, React, ReactBootstrap, ROOT} = window
const {OverlayTrigger, Tooltip} = ReactBootstrap

import {SlotitemIcon} from '../etc/icon'
import {getItemData} from './slotitems-data'

function between(n, min, max) {
  return n >= min && n <= max;
}

function getBackgroundStyle() {
  return window.isDarkTheme ?
  {backgroundColor: 'rgba(33, 33, 33, 0.7)'}
  :
  {backgroundColor: 'rgba(256, 256, 256, 0.7)'}
}

export const Slotitems = connect(
  () => createSelector([
      makeThisShipDataSelector(),
      makeThisShipEquipDataSelector(),
      constSelector,
    ], ([ship, $ship]=[], equipsData) => ({
      ship: ship || {},
      $ship: $ship || {},
      equipsData,
    }))
)(({ship, $ship, equipsData}) =>
  <div className="slotitems">
  {equipsData &&
    equipsData.map((equipData, equipIdx) => {
      const isExslot = equipIdx == (equipsData.length-1)
      if (isExslot && ship.api_slot_ex == 0) {
        return <div></div>
      }
      const [equip, $equip, onslot] = equipData || []
      const itemOverlay = equipData &&
        <Tooltip id={`equip-${equip.api_id}`}>
          <div>
            <div>
              {i18n.resources.__(($equip || {api_name: '??'}).api_name)}
              {(equip.api_level == null || equip.api_level == 0) ? undefined :
                <strong style={{color: '#45A9A5'}}> ★{equip.api_level}</strong>
              }
              {(equip.api_alv && equip.api_alv >= 1 && equip.api_alv <= 7) &&
                <img className='alv-img' src={join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)} />
              }
            </div>
            {$equip &&
              getItemData($equip).map((data, propId) =>
                <div key={propId}>{data}</div>
              )
            }
          </div>
        </Tooltip>
  
      const equipIconId = equipData ? $equip.api_type[3] : 0
      const isAircraft = between(equipIconId, 6, 10) || between(equipIconId, 21, 22) || equipIconId == 33
      const showItemSpan = !equipData || isExslot || isAircraft
      const maxOnslot = isExslot ? 0 : $ship.api_maxeq[equipIdx]
      const slotWarning = equipData && onslot < maxOnslot
      const itemSpanClassName = classNames("slotitem-onslot", {
        'show': showItemSpan,
        'hide': !showItemSpan,
        'text-warning': slotWarning,
      })
      const itemSpan =
        <span>
          <SlotitemIcon className='slotitem-img' slotitemId={equipIconId} />
          <span className={itemSpanClassName} style={getBackgroundStyle()} >
            {isExslot ? "+" : equipData ? onslot : maxOnslot}
          </span>
        </span>
  
      return (
        <div key={equipIdx} className="slotitem-container">
        {
          itemOverlay ?
            <OverlayTrigger placement='left' overlay={itemOverlay}>
              {itemSpan}
            </OverlayTrigger>
          :
            itemSpan
        }
        </div>
      )
    })
  }
  </div>
)
