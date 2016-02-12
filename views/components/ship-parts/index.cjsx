ShipPane = require './shipPane'
ShipPane.defaultProps = require './shipitem'

MiniShipPane = class extends ShipPane
MiniShipPane.defaultProps = require './minishipitem'

module.exports =
  Slotitems: window.hack.ShipViewSlotitems || require './slotitems'
  StatusLabel: require './statuslabel'
  TopAlert: require './topalert'
  PaneBodyMini: window.hack.ShipViewPaneBodyMini || MiniShipPane
  PaneBody: window.hack.ShipViewPaneBody || ShipPane
