import { Button, MenuItem, Position, Tooltip } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import React from 'react'
import { styled } from 'styled-components'

import { OptionIcon } from './styles'

/** One choice in a filter dropdown. */
export interface FilterOption<T> {
  value: T
  label: string
  /** Equipment icon id (`api_type[3]`); omitted for text-only choices. */
  icon?: number
}

/**
 * The label is clipped, never wrapped: these buttons carry a fixed width and a
 * caret pinned to the far edge, and a second line would push both out of the
 * row they share with the search box.
 */
const TriggerLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TriggerButton = styled(Button)`
  && {
    white-space: nowrap;
  }

  .bp6-button-text {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }
`

/**
 * A dropdown filter built on Blueprint's `Select`, so the choices render as a
 * real menu — which a native `<select>` cannot do — and can carry the game's
 * own equipment icon alongside each label.
 */
export const FilterSelect = <T,>({
  options,
  value,
  onSelect,
  disabled,
  title,
  width = '11em',
}: {
  options: FilterOption<T>[]
  value: T
  onSelect: (value: T) => void
  disabled?: boolean
  title?: string
  width?: string
}) => {
  const active = options.find((option) => option.value === value)

  const trigger = (
    <TriggerButton
      disabled={disabled}
      endIcon="caret-down"
      // Pins the label to the left and pushes the caret to the far edge,
      // rather than letting it trail the text mid-button.
      alignText="start"
      style={{ width }}
      text={
        <>
          {active?.icon != null && <OptionIcon slotitemId={active.icon} alt="" />}
          <TriggerLabel>{active?.label ?? ''}</TriggerLabel>
        </>
      }
    />
  )

  return (
    <Select<FilterOption<T>>
      items={options}
      filterable={false}
      disabled={disabled}
      activeItem={active ?? null}
      onItemSelect={(option) => onSelect(option.value)}
      popoverProps={{ minimal: true, matchTargetWidth: false }}
      itemRenderer={(option, { handleClick, modifiers }) =>
        modifiers.matchesPredicate ? (
          <MenuItem
            key={String(option.value)}
            active={modifiers.active}
            selected={option.value === value}
            onClick={handleClick}
            roleStructure="listoption"
            text={
              <>
                {option.icon != null && <OptionIcon slotitemId={option.icon} alt="" />}
                {option.label}
              </>
            }
          />
        ) : null
      }
    >
      {/* A disabled Blueprint button swallows pointer events, so the hint has
          to hang off a wrapper rather than the button itself. */}
      {title ? (
        <Tooltip content={title} position={Position.TOP}>
          <span>{trigger}</span>
        </Tooltip>
      ) : (
        trigger
      )}
    </Select>
  )
}
