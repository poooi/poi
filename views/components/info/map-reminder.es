/* global config */

import React, { Component } from 'react'
import { ProgressBar, Position, PopoverInteractionKind, Intent, Button } from '@blueprintjs/core'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { get, map, zip, each } from 'lodash'
import { withNamespaces } from 'react-i18next'
import styled, { css, keyframes } from 'styled-components'
import { rgba } from 'polished'
import classNames from 'classnames'

import { MaterialIcon } from 'views/components/etc/icon'
import {
  sortieMapDataSelector,
  sortieMapHpSelector,
  sortieMapEnemySelector,
  fcdSelector,
  currentNodeSelector,
} from 'views/utils/selectors'
import { Avatar } from 'views/components/etc/avatar'
import { CustomTag } from 'views/components/etc/custom-tag'
import { Popover } from 'views/components/etc/overlay'

const PoiMapReminderTag = styled(CustomTag)`
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

const MapRouteContainer = styled.div``

const MapInfoMsg = styled.div`
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MapRoutesSVG = styled.svg`
  background-color: ${(props) =>
    rgba(props.theme.BLUE5, props.theme.vibrant === 'dark' ? 0.75 : 0.25)};
`

const MaproutesBlink = keyframes`
  from {
    fill: #d50000;
  }

  50% {
    fill: #ff9800;
  }

  to {
    fill: #d50000;
  }
`
const Point = styled.rect`
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

const Line = styled.line`
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

const emptyObj = {}

const emptyMap = (
  <MapRouteContainer className="map-route-container">
    <MapRoutesSVG width="190" height="110" viewBox="0 0 190 110" className="maproutes" />
  </MapRouteContainer>
)

const MapRoutes = connect((state) => ({
  sortieMapId: get(state, 'sortie.sortieMapId'),
  spotHistory: get(state, 'sortie.spotHistory'),
  bossSpot: get(state, 'sortie.bossSpot'),
  allMaps: get(state, 'fcd.map'),
}))(({ sortieMapId, spotHistory, bossSpot, allMaps }) => {
  if (!sortieMapId || !allMaps) return emptyMap
  const mapspots = get(allMaps, `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.spots`, {})
  if (!mapspots || !Object.keys(mapspots).length) return emptyMap
  const maproutes = get(allMaps, `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.route`, {})
  const histLen = spotHistory.length
  const activeSpot = spotHistory[histLen - 1]
  const bossSpotLoc = mapspots[get(maproutes, `${bossSpot}.1`)] || [-100, -100]
  const locHistory = spotHistory.map((i) => mapspots[get(maproutes, `${i}.1`)] || [-1, -1])
  const lineHistory = histLen
    ? zip(locHistory.slice(0, histLen - 1), locHistory.slice(1))
    : [
        [-1, -1],
        [-1, -1],
      ]
  const SCALE = 1 / 6
  return (
    <MapRouteContainer className="map-route-container">
      <MapRoutesSVG width="190" height="110" viewBox="0 0 190 110" className="maproutes">
        {
          // Draw all lines
          map(maproutes, ([beg, end], i) => {
            if (!(mapspots[beg] && mapspots[end])) return null
            const [begX, begY] = mapspots[beg]
            const [endX, endY] = mapspots[end]
            return (
              <Line
                key={i}
                x1={parseInt(begX * SCALE)}
                y1={parseInt(begY * SCALE)}
                x2={parseInt(endX * SCALE)}
                y2={parseInt(endY * SCALE)}
              />
            )
          })
        }
        {
          // Draw passed lines
          lineHistory.map(([[begX, begY], [endX, endY]], i) =>
            begX > 0 && endX > 0 ? (
              <Line
                key={i}
                x1={parseInt(begX * SCALE)}
                y1={parseInt(begY * SCALE)}
                x2={parseInt(endX * SCALE)}
                y2={parseInt(endY * SCALE)}
                passed
              />
            ) : (
              <span />
            ),
          )
        }
        <Point
          x={parseInt(bossSpotLoc[0] * SCALE) - 4.5}
          y={parseInt(bossSpotLoc[1] * SCALE) - 4.5}
          width={9}
          height={9}
          boss
        />
        {
          // Draw all points
          map(mapspots, ([x, y], id) => (
            <Point
              key={id}
              x={parseInt(x * SCALE) - 3}
              y={parseInt(y * SCALE) - 3}
              width={6}
              height={6}
            />
          ))
        }
        {
          // Draw passed points again, highlighting the active one
          map(zip(spotHistory, locHistory), ([id, [x, y]]) =>
            x > 0 ? (
              <Point
                key={id}
                x={parseInt(x * SCALE) - 3}
                y={parseInt(y * SCALE) - 3}
                width={6}
                height={6}
                active={id == activeSpot}
                passed={id != activeSpot}
              />
            ) : (
              <span />
            ),
          )
        }
      </MapRoutesSVG>
    </MapRouteContainer>
  )
})

const ItemStat = withNamespaces(['others'])(
  connect((state) => ({
    itemHistoty: get(state, 'sortie.itemHistory'),
  }))(({ itemHistoty, t }) => {
    const stat = {}
    each(itemHistoty, (item = {}) => {
      each(Object.keys(item), (itemKey) => (stat[itemKey] = item[itemKey] + (stat[itemKey] || 0)))
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
  }),
)

// Map Reminder
@withNamespaces()
@connect(
  createSelector(
    [
      sortieMapDataSelector,
      sortieMapHpSelector,
      sortieMapEnemySelector,
      currentNodeSelector,
      fcdSelector,
      (state) => get(state.config, 'poi.misc.pinminimap'),
    ],
    (mapData, mapHp, nextEnemy, currentNode, fcd = {}, pinminimap) => ({
      mapId: get(mapData, '0.api_id'),
      rank: get(mapData, '0.api_eventmap.api_selected_rank'),
      nextEnemy,
      currentNode,
      mapData,
      mapHp,
      maps: fcd.map || emptyObj,
      pinminimap,
    }),
  ),
)
export class PoiMapReminder extends Component {
  state = {
    pin: false,
  }

  getMapText(mapData, mapRanks) {
    if (!mapData) return this.props.t('Not in sortie')
    const { rank } = this.props
    const { api_maparea_id, api_no } = mapData[1]

    const mapName = `${api_maparea_id}-${api_no}` + (rank == null ? '' : mapRanks[rank])
    return (
      <>
        {this.props.t('Sortie area')}: {mapName}
      </>
    )
  }

  render() {
    const { mapHp, mapData, nextEnemy = [], currentNode, mapId, maps, pinminimap, t } = this.props
    const alphaNode =
      get(maps, `${Math.floor(mapId / 10)}-${mapId % 10}.route.${currentNode}.1`) || '?'
    return (
      <PoiMapReminderTag tag="poi-map-reminder">
        <Popover
          position={Position.TOP_RIGHT}
          portalClassName={classNames('map-reminder-popover', {
            pinned: !!mapData && pinminimap,
          })}
          wrapperTagName="div"
          targetTagName="div"
          disabled={!mapData}
          modifiers={{
            offset: {
              options: {
                offset: [-5, 15],
              },
            },
          }}
          content={
            <PopoverContainer>
              {nextEnemy.reverse().map(({ api_ship_ids = [] }, index) => (
                <EnemyContainer key={index}>
                  {api_ship_ids.map((id, index) => (
                    <Avatar
                      key={`${id}-${index}`}
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
                      {t('Node')}: {alphaNode} ({currentNode})
                    </MapTooltipMsg>
                  )}
                  {!!mapHp && mapHp[1] > 0 && mapHp[0] !== 0 && (
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
                value={mapHp[0] / mapHp[1]}
              />
            )}
            <Alert>
              <span id="map-reminder-area">
                {this.getMapText(mapData, [
                  '',
                  this.props.t('丁'),
                  this.props.t('丙'),
                  this.props.t('乙'),
                  this.props.t('甲'),
                ])}
              </span>
            </Alert>
          </MapReminder>
        </Popover>
      </PoiMapReminderTag>
    )
  }
}
