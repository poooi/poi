import type { AirBase } from 'views/redux/info/airbase'
import type { RootState } from 'views/redux/reducer-factory'

import { Button, ButtonGroup, Intent, Position, Tag, Tooltip } from '@blueprintjs/core'
import _, { map } from 'lodash'
import memoizeOne from 'memoize-one'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'

const AirbaseLabel = styled(Tag)`
  margin: 2px;
`

const LandbaseButtonContainer = styled(ButtonGroup)<{ isMini?: boolean }>`
  display: flex;
  ${({ isMini }) =>
    isMini
      ? css`
          padding: 5px 5px 1px;

          .bp5-button {
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

          .bp5-button {
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

type MapareaInfo = { api_name: string }

const getAirbaseData = memoizeOne(
  (airbase: AirBase[], mapareas: Record<string | number, MapareaInfo>, sortieStatus: boolean[]) => {
    const baseInfo = _(airbase)
      .filter((a) => !!mapareas[a.api_area_id ?? ''])
      .groupBy('api_area_id')
      .mapValues((bases, areaId) => {
        const planes = _(bases).flatMap('api_plane_info')
        return {
          areaId,
          needSupply: planes.some((plane) => plane.api_count !== plane.api_max_count),
          squardState: planes.map('api_state').max(),
          squardCond: planes.map((plane) => plane.api_cond ?? 1).max(),
          noAction: bases.some((base) => ![1, 2].includes(base.api_action_kind ?? -1)),
          allEmpty: planes.every((plane) => plane.api_state === 0),
        }
      })

    const needSupply = baseInfo.some((base) => !base.allEmpty && base.needSupply)
    const squardState =
      baseInfo
        .filter((base) => !base.allEmpty)
        .map('squardState')
        .max() ?? 1
    const squardCond =
      baseInfo
        .filter((base) => !base.allEmpty)
        .map('squardCond')
        .max() ?? 1
    const noAction = baseInfo.some((base) => !base.allEmpty && base.noAction)

    const airbaseProps = baseInfo.value()
    const sortie = sortieStatus.some((s) => s)

    let intent: Intent
    if (sortie || noAction) {
      intent = Intent.NONE
    } else if (squardCond > 1) {
      intent = Intent.DANGER
    } else if (squardState !== 1 || needSupply) {
      intent = Intent.WARNING
    } else {
      intent = Intent.SUCCESS
    }

    return { airbaseProps, intent }
  },
)

interface LandbaseButtonProps {
  fleetId: number
  activeFleetId: number
  onClick: () => void
  disabled?: boolean
  isMini?: boolean
}

export const LandbaseButton = ({
  fleetId,
  activeFleetId,
  onClick,
  disabled,
  isMini,
}: LandbaseButtonProps) => {
  const { t } = useTranslation('resources')
  const sortieStatus = useSelector(
    (state: RootState) => (state.sortie.sortieStatus as boolean[]) ?? [],
  )
  const airbase = useSelector((state: RootState) => state.info?.airbase ?? [])
  const mapareas = useSelector((state: RootState) => state.const?.$mapareas ?? {})

  const { airbaseProps, intent } = getAirbaseData(airbase, mapareas, sortieStatus)

  const tooltipContent = (
    <div>
      {map(airbaseProps, (base) => {
        const { areaId, needSupply, squardState, squardCond, noAction } = base
        return (
          <div key={areaId}>
            <div>
              [{areaId}] {mapareas[areaId] ? t(`resources:${mapareas[areaId].api_name}`) : ''}
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
    <Tooltip
      content={tooltipContent}
      disabled={disabled}
      position={Position.BOTTOM}
      targetTagName="div"
    >
      <LandbaseButtonContainer isMini={isMini}>
        <Button
          intent={intent}
          onClick={onClick}
          disabled={disabled}
          active={fleetId === activeFleetId}
          icon={<FontAwesome name="plane-departure" />}
        />
      </LandbaseButtonContainer>
    </Tooltip>
  )
}
