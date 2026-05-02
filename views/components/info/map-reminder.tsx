import type { APIMstMapinfo } from 'kcsapi/api_start2/getData/response'
import type { MapInfo } from 'views/redux/info/maps'
import type { RootState } from 'views/redux/reducer-factory'

import { ProgressBar, Position, PopoverInteractionKind, Intent, Button } from '@blueprintjs/core'
import classNames from 'classnames'
import { map, zip, each } from 'lodash-es'
import { rgba } from 'polished'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { css, keyframes, styled } from 'styled-components'
import { Avatar } from 'views/components/etc/avatar'
import { CustomTag } from 'views/components/etc/custom-tag'
import { MaterialIcon } from 'views/components/etc/icon'
import { Popover } from 'views/components/etc/overlay'
import { config } from 'views/env'
import {
  sortieMapDataSelector,
  sortieMapHpSelector,
  sortieMapEnemySelector,
  fcdSelector,
  currentNodeSelector,
} from 'views/utils/selectors'

const PoiMapReminderTag = styled(CustomTag)<{ tag?: string; children?: React.ReactNode }>`
  width: 0;
  flex: 0 0 135px;
`

const PopoverContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
`

const EnemyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const MapContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`

const MapReminder = styled.div`
  position: relative;
  width: 135px;
`

const Alert = styled.div`
  margin-bottom: 0;
  min-height: 100%;
  opacity: 0.7;
  padding: 6px 3px 5px;
  border-radius: 0;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
`

const MapHPProgress = styled(ProgressBar)`
  background-color: transparent;
  border-radius: 0;
  height: 3px;
  position: absolute;
  width: 100%;
`

const MapRouteContainer = styled.div`
  display: block;
`

const MapInfoMsg = styled.div`
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const getRouteColor = (color?: string, vibrant?: string) =>
  rgba(color ?? '#137CBD', vibrant === 'dark' ? 0.75 : 0.25)

const MapRoutesSVG = styled.svg<{ theme?: { BLUE5?: string; vibrant?: string } }>`
  background-color: ${(props) => getRouteColor(props.theme?.BLUE5, props.theme?.vibrant)};
`

const MaproutesBlink = keyframes`
  from { fill: #d50000; }
  50% { fill: #ff9800; }
  to { fill: #d50000; }
`

const Point = styled.rect<{ active?: boolean; passed?: boolean; boss?: boolean }>`
  fill: white;
  ${({ active }) =>
    active &&
    css`
      animation: ${MaproutesBlink} 1s linear infinite;
    `}
  ${({ passed }) =>
    passed &&
    css`
      fill: #039be5;
    `}
  ${({ boss }) =>
    boss &&
    css`
      fill: #c62828;
    `}
`

const Line = styled.line<{ passed?: boolean }>`
  stroke: #373737;
  stroke-width: 1.5;
  ${({ passed }) =>
    passed &&
    css`
      stroke: #f5f5f5;
      stroke-width: 2;
    `}
`

const ReminderIcon = styled(MaterialIcon)`
  height: 15px;
  margin-right: 0.5ex;
  width: 15px;
`

const ItemStatSpan = styled.span`
  &:not(:last-child) {
    margin-right: 1ex;
  }
`

const MapTooltipMsg = styled.span`
  &::after {
    content: '  |  ';
  }

  &:last-child::after {
    content: '';
  }
`

const PinBtn = styled(Button)`
  pointer-events: all;
  position: absolute;
  right: 0;
  top: 0;
`

const emptyMap = (
  <MapRouteContainer className="map-route-container">
    <MapRoutesSVG width="190" height="110" viewBox="0 0 190 110" className="maproutes" />
  </MapRouteContainer>
)

const MapRoutes = () => {
  const sortieMapId = useSelector((state: RootState) => state.sortie?.sortieMapId)
  const spotHistory = useSelector((state: RootState) => state.sortie?.spotHistory)
  const bossSpot = useSelector((state: RootState) => state.sortie?.bossSpot)
  const allMaps = useSelector((state: RootState) => state.fcd?.map)

  if (!sortieMapId || !allMaps) return emptyMap
  const mapKey =
    `${Math.floor(Number(sortieMapId ?? 0) / 10)}-${Number(sortieMapId ?? 0) % 10}` as const
  const mapspots = allMaps?.[mapKey]?.spots
  if (!mapspots || !Object.keys(mapspots).length) return emptyMap
  const maproutes = allMaps?.[mapKey]?.route ?? []
  const histLen = (spotHistory ?? []).length
  const activeSpot = (spotHistory ?? [])[histLen - 1]
  const bossSpotLoc = mapspots[maproutes?.[bossSpot ?? 0]?.[1] ?? ''] ?? [-100, -100]
  const locHistory = (spotHistory ?? []).map(
    (i) => mapspots[maproutes?.[i ?? 0]?.[1] ?? ''] ?? [-1, -1],
  )
  const lineHistory = histLen
    ? zip(locHistory.slice(0, histLen - 1), locHistory.slice(1))
    : undefined
  const SCALE = 1 / 6
  return (
    <MapRouteContainer className="map-route-container">
      <MapRoutesSVG width="190" height="110" viewBox="0 0 190 110" className="maproutes">
        {map(maproutes, ([beg, end], i) => {
          if (!beg || !end) return null
          if (!(mapspots[beg] && mapspots[end])) return null
          const [begX, begY] = mapspots[beg]
          const [endX, endY] = mapspots[end]
          return (
            <Line
              key={i}
              x1={Math.floor(begX * SCALE)}
              y1={Math.floor(begY * SCALE)}
              x2={Math.floor(endX * SCALE)}
              y2={Math.floor(endY * SCALE)}
            />
          )
        })}
        {lineHistory?.map(([begPt, endPt], i) => {
          const [begX, begY] = begPt ?? [-1, -1]
          const [endX, endY] = endPt ?? [-1, -1]
          return begX > 0 && endX > 0 ? (
            <Line
              key={i}
              x1={Math.floor(begX * SCALE)}
              y1={Math.floor(begY * SCALE)}
              x2={Math.floor(endX * SCALE)}
              y2={Math.floor(endY * SCALE)}
              passed
            />
          ) : (
            <span key={i} />
          )
        })}
        <Point
          x={Math.floor(bossSpotLoc[0] * SCALE) - 4.5}
          y={Math.floor(bossSpotLoc[1] * SCALE) - 4.5}
          width={9}
          height={9}
          boss
        />
        {map(mapspots, ([x, y], id) => (
          <Point
            key={id}
            x={Math.floor(x * SCALE) - 3}
            y={Math.floor(y * SCALE) - 3}
            width={6}
            height={6}
          />
        ))}
        {map(zip(spotHistory ?? [], locHistory), ([id, pt]) => {
          const [x, y] = pt ?? [-1, -1]
          return x > 0 ? (
            <Point
              key={id}
              x={Math.floor(x * SCALE) - 3}
              y={Math.floor(y * SCALE) - 3}
              width={6}
              height={6}
              active={id === activeSpot}
              passed={id !== activeSpot}
            />
          ) : (
            <span key={id} />
          )
        })}
      </MapRoutesSVG>
    </MapRouteContainer>
  )
}

const ItemStat = () => {
  const { t } = useTranslation('others')
  const itemHistory = useSelector((state: RootState) => state?.sortie?.itemHistory)
  const stat: Record<string, number> = {}
  each(itemHistory ?? [], (item = {}) => {
    each(Object.keys(item), (itemKey) => {
      stat[itemKey] = (item[Number(itemKey)] ?? 0) + (stat[itemKey] ?? 0)
    })
  })
  return (
    <MapInfoMsg className="map-info-msg">
      {Object.keys(stat).length > 0 && `${t('Resources')}: `}
      {map(
        Object.keys(stat),
        (itemKey) =>
          itemKey && (
            <ItemStatSpan key={itemKey} className="item-stat">
              <ReminderIcon materialId={parseInt(itemKey)} className="material-icon reminder" />
              {stat[itemKey] > 0 ? `+${stat[itemKey]}` : String(stat[itemKey])}
            </ItemStatSpan>
          ),
      )}
    </MapInfoMsg>
  )
}

const mapReminderSelector = createSelector(
  [
    sortieMapDataSelector,
    sortieMapHpSelector,
    sortieMapEnemySelector,
    currentNodeSelector,
    fcdSelector,
    (state: RootState) => state.config?.poi?.misc?.pinminimap,
  ],
  (mapData, mapHp, nextEnemy, currentNode, fcd, pinminimap) => ({
    mapId: mapData?.[0]?.api_id,
    rank: mapData?.[0]?.api_eventmap?.api_selected_rank,
    nextEnemy,
    currentNode,
    mapData,
    mapHp,
    maps: fcd?.map,
    pinminimap,
  }),
)

export const PoiMapReminder = () => <PoiMapReminderInner />

const PoiMapReminderInner = () => {
  const { t } = useTranslation()
  const { mapHp, mapData, nextEnemy, currentNode, mapId, maps, pinminimap } = useSelector(
    (state: RootState) => mapReminderSelector(state),
  )

  const alphaNode =
    maps?.[`${Math.floor((mapId ?? 0) / 10)}-${(mapId ?? 0) % 10}`]?.route?.[
      currentNode ?? 0
    ]?.[1] ?? '?'

  const getMapText = (
    mapDataArg: [MapInfo, APIMstMapinfo] | undefined,
    mapRanks: string[],
    rank: number | undefined,
  ): React.ReactNode => {
    if (!mapDataArg) return t('Not in sortie')
    const { api_maparea_id, api_no } = mapDataArg[1] ?? {}
    const mapName = `${api_maparea_id}-${api_no}` + (rank == null ? '' : mapRanks[rank])
    return (
      <>
        {t('Sortie area')}: {mapName}
      </>
    )
  }

  return (
    <PoiMapReminderTag tag="poi-map-reminder">
      <Popover
        position={Position.TOP_RIGHT}
        portalClassName={classNames('map-reminder-popover', {
          pinned: !!mapData && pinminimap,
        })}
        disabled={!mapData}
        modifiers={{
          offset: {
            options: { offset: [-5, 15] },
          },
        }}
        content={
          <PopoverContainer>
            {(nextEnemy ?? []).reverse().map(({ api_ship_ids = [] }, index) => (
              <EnemyContainer key={index}>
                {api_ship_ids.map((id, idx) => (
                  <Avatar
                    key={`${id}-${idx}`}
                    height={38}
                    mstId={id}
                    useFixedWidth={false}
                    useDefaultBG={false}
                    showFullImg
                  />
                ))}
              </EnemyContainer>
            ))}
            <MapContainer>
              <MapRoutes />
              <MapInfoMsg className="map-info-msg">
                {!!currentNode && (
                  <MapTooltipMsg className="map-tooltip-msg">
                    {t('Node')}: {alphaNode as string} ({currentNode})
                  </MapTooltipMsg>
                )}
                {!!mapHp && (mapHp?.[1] ?? 0) > 0 && (mapHp?.[0] ?? 0) !== 0 && (
                  <MapTooltipMsg className="map-tooltip-msg">
                    HP: {mapHp[0]} / {mapHp[1]}
                  </MapTooltipMsg>
                )}
              </MapInfoMsg>
              <ItemStat />
              <PinBtn
                icon="pin"
                minimal
                small
                active={pinminimap}
                onClick={() => config.set('poi.misc.pinminimap', !!mapData && !pinminimap)}
              />
            </MapContainer>
          </PopoverContainer>
        }
        {...(pinminimap
          ? { isOpen: !!mapData }
          : { interactionKind: PopoverInteractionKind.HOVER })}
      >
        <MapReminder>
          {mapHp && (
            <MapHPProgress
              className="map-hp-progress"
              animate={false}
              stripes={false}
              intent={Intent.PRIMARY}
              value={(mapHp?.[0] ?? 0) / (mapHp?.[1] ?? 1)}
            />
          )}
          <Alert>
            <span id="map-reminder-area">
              {getMapText(mapData, ['', t('丁'), t('丙'), t('乙'), t('甲')], undefined)}
            </span>
          </Alert>
        </MapReminder>
      </Popover>
    </PoiMapReminderTag>
  )
}
