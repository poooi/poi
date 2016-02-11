ShipPane = require './shipPane'
MiniShipPane = class extends ShipPane
MiniShipPane.defaultProps =
  type: 'MINI'

module.exports =
  Slotitems: window.hack.ShipViewSlotitems || require './slotitems'
  StatusLabel: require './statuslabel'
  TopAlert: require './topalert'
  PaneBodyMini: window.hack.ShipViewPaneBodyMini || MiniShipPane
  PaneBody: window.hack.ShipViewPaneBody || ShipPane
