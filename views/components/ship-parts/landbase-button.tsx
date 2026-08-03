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

import { fleetSwitchButtonStyle } from './styled-components'

const AirbaseLabel = styled(Tag)`
  flex: none;
  margin: 2px;
`

const SquadInfo = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  padding-left: 8px;
`

const LandbaseButtonContainer = styled(ButtonGroup)<{ isMini?: boolean }>`
  display: flex;
  ${({ isMini }) =>
    isMini
      ? css`
          padding: 5px 5px 1px;

          .bp6-button {
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

          .bp6-button {
            flex: 1;
            overflow: hidden;
          }
        `}

  ${fleetSwitchButtonStyle}
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
    const squadInfo = _(airbase)
      .filter((a) => !!mapareas[a.api_area_id ?? ''])
      .map((base) => {
        const planes = _(base.api_plane_info ?? []).compact()
        // api_cond is 0 on some responses; only 2+ means the squadron is fatigued.
        const squardCond = planes.map((plane) => plane.api_cond || 1).max() ?? 1
        const squardState = planes.map('api_state').max() ?? 0
        const needSupply = planes.some((plane) => plane.api_count !== plane.api_max_count)
        const noAction = ![1, 2].includes(base.api_action_kind ?? -1)
        const fatigued = squardCond > 1
        const empty = squardState < 1
        const relocating = squardState > 1
        return {
          areaId: String(base.api_area_id),
          squadId: base.api_rid ?? 0,
          fatigued,
          empty,
          relocating,
          needSupply,
          noAction,
          squardState,
          squardCond,
          ready: !fatigued && !empty && !relocating && !needSupply && !noAction,
          allEmpty: planes.every((plane) => plane.api_state === 0),
        }
      })

    const activeSquads = squadInfo.filter((squad) => !squad.allEmpty)
    const needSupply = activeSquads.some((squad) => squad.needSupply)
    const squardState = activeSquads.map('squardState').max() ?? 1
    const squardCond = activeSquads.map('squardCond').max() ?? 1
    const noAction = activeSquads.some((squad) => squad.noAction)

    const airbaseProps = squadInfo.groupBy('areaId').value()
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
      {map(airbaseProps, (squads, areaId) => (
        <div key={areaId}>
          <div>
            [{areaId}] {mapareas[areaId] ? t(`resources:${mapareas[areaId].api_name}`) : ''}
          </div>
          {map(squads, (squad) => {
            const { squadId, fatigued, empty, relocating, needSupply, noAction, ready } = squad
            return (
              <SquadInfo key={squadId}>
                <AirbaseLabel className="airbase-squad-label">{squadId}</AirbaseLabel>
                {fatigued && fatiguedLabel}
                {empty && emptyLabel}
                {relocating && relocateLabel}
                {needSupply && resupplyLabel}
                {noAction && noActionLabel}
                {ready && readyLabel}
              </SquadInfo>
            )
          })}
        </div>
      ))}
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
