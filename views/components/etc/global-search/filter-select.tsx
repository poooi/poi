import { Button, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import React from 'react'
import { styled } from 'styled-components'
import { SlotitemIcon } from 'views/components/etc/icon'

/** One choice in a filter dropdown. */
export interface FilterOption<T> {
  value: T
  label: string
  /** Equipment icon id (`api_type[3]`); omitted for text-only choices. */
  icon?: number
}

const OptionIcon = styled(SlotitemIcon)`
  width: 20px;
  height: 20px;
  margin-right: 6px;
  vertical-align: middle;
  object-fit: contain;
`

const TriggerButton = styled(Button)`
  && {
    justify-content: flex-start;
    white-space: nowrap;
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
      <TriggerButton
        small
        disabled={disabled}
        title={title}
        endIcon="caret-down"
        style={{ width }}
        text={
          <>
            {active?.icon != null && <OptionIcon slotitemId={active.icon} alt="" />}
            {active?.label ?? ''}
          </>
        }
      />
    </Select>
  )
}
