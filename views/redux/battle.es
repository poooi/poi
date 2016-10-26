/*
battle.result =
  rank: String
  boss: Boolean
  map: Integer(2-3 => 23)
  enemyHp: Array of Integer
  deckHp: Array of Integer
  enemyShipId: Array of Integer
  deckShipId: Array of Integer
*/

import {Models, PacketManager, Simulator} from 'poi-lib-battle'
const {BattleType} = Models

const pm = new PacketManager()
pm.addListener('result', handleResult)

function handleResult(battle, packet) {
  // HACK: Skip pratice battle.
  // TODO: Update when lib-battle updated.
  if (battle.type === BattleType.Pratice)
    return

  const simulator = new Simulator(battle.fleet)
  let stages = []
  for (const packet of battle.packet) {
    stages = stages.concat(simulator.simulate(packet))
  }

  const deckShipId = [], deckHp = []
  const deck = [].concat(simulator.mainFleet || [], simulator.escortFleet || [])
  deck.map(ship => {
    if (ship != null) {
      deckShipId.push(ship.id)
      deckHp.push(ship.nowHP)
    }
  })
  const enemyShipId = [], enemyHp = []
  const enemy = [].concat(simulator.enemyFleet || [], simulator.enemyEscort || [])
  enemy.map(ship => {
    if (ship != null) {
      enemyShipId.push(ship.id)
      enemyHp.push(ship.nowHP)
    }
  })
  const result = {
    rank: packet.api_win_rank,
    boss: battle.type === BattleType.Boss,
    map:  battle.map[0] * 10 + battle.map[1],
    deckShipId: deckShipId,
    deckHp:     deckHp,
    enemyShipId: enemyShipId,
    enemyHp:     enemyHp,
  }

  const e = new CustomEvent('battle.result', {
    bubbles: true,
    cancelable: true,
    detail: result,
  })
  window.dispatchEvent(e)
}

// Subscriber, used on battle completion.
// Need to observe on state battle.result
export function dispatchBattleResult(dispatch, battleResult, oldBattleResult) {
  if (!battleResult.valid)
    return
  dispatch({
    type: '@@BattleResult',
    result: battleResult,
  })
  // TODO: Backward compatibility for old battle-env event
  // Delete them when backward compatibility support is over
  const e = new CustomEvent('battle.result', {
    bubbles: true,
    cancelable: true,
    detail: battleResult,
  })
  window.dispatchEvent(e)
}
