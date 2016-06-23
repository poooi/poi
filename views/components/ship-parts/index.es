import {connect} from 'react-redux'
//import TopAlert from './topalert'
import {pluck} from './utils'
import {ShipRow} from './shipitem'
// TODO
import {shipItem} from './minishipitem'
const MiniShipRow = shipItem

const {$, $$, _, React} = window

export const PaneBody = connect(() => {
    const thisFleetShipIdSelector = makeThisFleetShipsIdSelector()
    return (state, props) => ({
      shipsId: thisFleetShipIdSelector(state, props)
    })
  }
)(({fleetId, shipsId}) =>
  <div>
    <div className={"ship-details"}>
    {
      (shipsId || []).map((shipId, i) =>
        <ShipRow
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

export const PaneBodyMini = connect(() => {
    const thisFleetShipIdSelector = makeThisFleetShipsIdSelector()
    return (state, props) => ({
      shipsId: thisFleetShipIdSelector(state, props)
    })
  }
)(({fleetId, shipsId}) =>
  <div>
  </div>
)
