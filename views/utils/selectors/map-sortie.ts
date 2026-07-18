import memoize from 'fast-memoize'
import { createSelector } from 'reselect'

import type { MapData } from './base'

import {
  arrayResultWrapper,
  constSelector,
  getMapData,
  getMapHp,
  mapsSelector,
  sortieSelector,
} from './base'

// Return [map, $map] or undefined
export const mapDataSelectorFactory = memoize((mapId: number | string) =>
  arrayResultWrapper(
    createSelector([mapsSelector, constSelector], (maps, { $maps }) => {
      const numericId = Number(mapId)
      if (Number.isNaN(numericId) || !maps[numericId] || !$maps?.[numericId]) return
      return [maps[numericId], $maps[numericId]] as MapData
    }),
  ),
)

export const sortieMapIdSelector = createSelector(sortieSelector, (sortie) => sortie.sortieMapId)
export const sortieMapDataSelector = createSelector(
  [sortieMapIdSelector, mapsSelector, constSelector],
  (mapId, maps, { $maps }) => getMapData(mapId, maps, $maps),
)
export const sortieMapHpSelector = createSelector(sortieMapDataSelector, (mapData) =>
  mapData ? getMapHp(mapData[0], mapData[1]) : undefined,
)
export const sortieMapEnemySelector = createSelector(
  sortieSelector,
  (sortie) => sortie.nextEnemyInfo,
)
