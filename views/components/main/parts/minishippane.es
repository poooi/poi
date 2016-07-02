import {connect} from 'react-redux'
import TopAlert from '../../ship-parts/topalert'
import {MiniShipRow} from './minishipitem'

export const PaneBodyMini = connect(() => {
    const thisFleetShipIdSelector = makeThisFleetShipsIdSelector()
    return (state, props) => ({
      shipsId: thisFleetShipIdSelector(state, props)
    })
  }
)(({fleetId, shipsId}) =>
  <div>
    <div className='fleet-name'>
      <TopAlert
        fleetId={fleetId}
        isMini={true}
      />
    </div>
    <div className={"ship-details-mini"}>
    {
      (shipsId || []).map((shipId, i) =>
        <MiniShipRow
          key={shipId}
          fleetId={fleetId}
          shipId={shipId}
          shipIndex={i}
          />
      )
    }
    </div>
  </div>
)
