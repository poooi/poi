import { connect } from 'react-redux'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import _, { get, map } from 'lodash'
import { withNamespaces, Trans } from 'react-i18next'
import { Button, ButtonGroup, Tag, Intent, Position, Tooltip } from '@blueprintjs/core'
import styled, { css } from 'styled-components'
import memoizeOne from 'memoize-one'

const AirbaseLabel = styled(Tag)`
  margin: 2px;
`

const LandbaseButtonContainer = styled(ButtonGroup)`
  display: flex;
  ${({ isMini }) =>
    isMini
      ? css`
          padding: 5px 5px 1px 5px;
          .bp3-button {
            flex: 1;
            border-width: 0 0 1px;
            height: 18px;
            min-height: 18px;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
        `
      : css`
          padding-left: 5px;
          padding-right: 5px;
          padding-top: 5px;
          width: 100%;
          .bp3-button {
            flex: 1;
            overflow: hidden;
          }
        `}
`

const fatiguedLabel = (
  <AirbaseLabel intent={Intent.DANGER} className="airbase-state-label">
    <Trans>main:Fatigued</Trans>
  </AirbaseLabel>
)
const emptyLabel = (
  <AirbaseLabel intent={Intent.WARNING} className="airbase-state-label">
    <Trans>main:Empty Slot</Trans>
  </AirbaseLabel>
)
const relocateLabel = (
  <AirbaseLabel intent={Intent.WARNING} className="airbase-state-label">
    <Trans>main:Relocating</Trans>
  </AirbaseLabel>
)
const resupplyLabel = (
  <AirbaseLabel intent={Intent.WARNING} className="airbase-state-label">
    <Trans>main:Resupply Needed</Trans>
  </AirbaseLabel>
)
const noActionLabel = (
  <AirbaseLabel intent={Intent.WARNING} className="airbase-state-label">
    <Trans>main:No Action</Trans>
  </AirbaseLabel>
)
const readyLabel = (
  <AirbaseLabel intent={Intent.SUCCESS} className="airbase-state-label">
    <Trans>main:Ready</Trans>
  </AirbaseLabel>
)

const getAirbaseData = memoizeOne((airbase, mapareas, sortieStatus) => {
  const baseInfo = _(airbase)
    .filter((a) => mapareas[a.api_area_id])
    .groupBy('api_area_id')
    .mapValues((bases, areaId) => {
      const planes = _(bases).flatMap('api_plane_info')
      return {
        areaId,
        needSupply: planes.some((plane) => plane.api_count !== plane.api_max_count),
        squardState: planes.map('api_state').max(), // 0: 未配属あり, 1: 配属済み, >1: 配置転換中あり
        squardCond: planes.map((plane) => plane.api_cond || 1).max(), // 1: 通常, >1: 黄疲労・赤疲労あり
        noAction: bases.some((base) => ![1, 2].includes(base.api_action_kind)),
        allEmpty: planes.every((plane) => plane.api_state === 0),
      }
    })

  const needSupply = baseInfo.some((base) => !base.allEmpty && base.needSupply)
  const squardState =
    baseInfo
      .filter((base) => !base.allEmpty)
      .map('squardState')
      .max() || 1
  const squardCond =
    baseInfo
      .filter((base) => !base.allEmpty)
      .map('squardCond')
      .max() || 1
  const noAction = baseInfo.some((base) => !base.allEmpty && base.noAction)

  const airbaseProps = baseInfo.value()

  const sortie = sortieStatus.filter((a) => !a.allEmpty).reduce((a, b) => a || b, false)
  const intent = do {
    if (sortie || noAction) {
      Intent.NONE
    } else if (squardCond > 1) {
      Intent.DANGER
    } else if (squardState !== 1 || needSupply) {
      Intent.WARNING
    } else {
      Intent.SUCCESS
    }
  }

  return {
    airbaseProps,
    intent,
  }
})

export const LandbaseButton = withNamespaces(['resources'])(
  connect((state) => ({
    sortieStatus: get(state, 'sortie.sortieStatus', []),
    airbase: get(state, 'info.airbase', []),
    mapareas: get(state, 'const.$mapareas', {}),
  }))(
    ({ fleetId, activeFleetId, onClick, disabled, airbase, sortieStatus, mapareas, isMini, t }) => {
      const { airbaseProps, intent } = getAirbaseData(airbase, mapareas, sortieStatus)

      const tooltipContent = (
        <div>
          {map(airbaseProps, (airbase) => {
            const { areaId, needSupply, squardState, squardCond, noAction } = airbase
            return (
              <div key={areaId}>
                <div>
                  [{areaId}] {mapareas[areaId] && t(`resources:${mapareas[areaId].api_name}`)}
                </div>
                {squardCond > 1 && fatiguedLabel}
                {squardState < 1 && emptyLabel}
                {squardState > 1 && relocateLabel}
                {needSupply && resupplyLabel}
                {noAction && noActionLabel}
                {squardCond === 1 && squardState === 1 && !needSupply && !noAction && readyLabel}
              </div>
            )
          })}
        </div>
      )
      return (
        <Tooltip content={tooltipContent} position={Position.BOTTOM} targetTagName="div">
          <LandbaseButtonContainer isMini={isMini}>
            <Button
              intent={intent}
              onClick={onClick}
              disabled={disabled}
              active={fleetId == activeFleetId}
              icon={<FontAwesome name="plane-departure" />}
            />
          </LandbaseButtonContainer>
        </Tooltip>
      )
    },
  ),
)
