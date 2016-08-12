const between = (n, min, max) => (n >= min && n <= max)

export default {
  getMaterialStyle: (percent) => {
    if (percent <= 50) {
      return 'danger'
    } else if (percent <= 75){
      return 'warning'
    } else if (percent < 100) {
      return 'info'
    } else {
      return 'success'
    }
  },

  getStatusStyle: (status) =>{
    if (status != null) {
      const flag = status == 0 || status == 1 // retreat or repairing
      if (flag != null && flag) {
        return {opacity: 0.4}
      }
    } else {
      return {}
    }
  },

  getShipLabelStatus: (ship, $ship, inRepair) =>{
    if (!ship || !$ship) {
      return -1
    }
    if (inRepair) {
      // repairing
      return 1
    } else if (Math.min(ship.api_fuel / $ship.api_fuel_max, ship.api_bull / $ship.api_bull_max) < 1) {
      // supply
      return 6
    } else if ([1, 2, 3, 4].includes(ship.api_sally_area)) {
      // special: locked phase
      // returns 2 for locked phase 1, 3 for phase 2, etc
      return ship.api_sally_area + 1
    }
    return -1
  },

  getHpStyle: (percent) => {
    if (percent <= 25) {
      return 'danger'
    } else if (percent <= 50){
      return 'warning'
    } else if (percent <= 75){
      return 'info'
    } else {
      return 'success'
    }
  },

  // equipIconId: as in $equip.api_type[3]
  equipIsAircraft: (equipIconId) => (
    equipIconId != null && (
      between(equipIconId, 6, 10) ||
      between(equipIconId, 21, 22) ||
      equipIconId == 33
    )
  ),
}
