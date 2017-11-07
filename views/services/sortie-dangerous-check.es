import {damagedCheck} from './utils'

const {i18n, getStore, toggleModal} =  window

const __ = i18n.main.__.bind(i18n.main)

// These nodes are safe to moving on for there is no battle afterwards.
const safeNodes = getStore('fcd.safenodes')
const map = getStore('fcd.map')

const getPathsToNodes = (mapId, nodeId) => {
  return map[mapId].route.filter((route) => route[1] === nodeId)
}

window.addEventListener('game.response', ({detail: {path, body, postBody}}) => {
  if (path === '/kcsapi/api_req_map/start' || path === '/kcsapi/api_req_map/next') {
    // const {$ships, $equips} = getStore('const') || {}
    // const {sortieStatus, escapedPos} = getStore('sortie') || {}
    // const {fleets, ships, equips} = getStore('info') || {}
    const sortie = getStore('sortie')

    if (safeNodes[sortie.sortieMapId].some((safeNode) => {
      return getPathsToNodes(sortie.sortieMapId, safeNode.nodeId).includes(sortie.currentNode)
    })) {
      return
    }

    const damagedShips = damagedCheck(getStore('const'), getStore('sortie'), getStore('info'))
    if (damagedShips.length > 0) {
      return toggleModal(__('Attention!'), damagedShips.join(' ') + __('is heavily damaged!'))
    }
  }
})
