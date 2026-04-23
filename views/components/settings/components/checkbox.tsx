import { Checkbox } from '@blueprintjs/core'
import { get } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'

interface Props {
  configName: string
  defaultValue?: boolean
  label?: React.ReactNode
  undecided?: boolean
}

type ConfigState = { config: Record<string, unknown> }

export const CheckboxLabelConfig = ({
  configName,
  defaultValue = false,
  label,
  undecided,
}: Props) => {
  const storeValue = useSelector((state: ConfigState) =>
    get(state.config, configName, defaultValue),
  )
  const value = typeof storeValue === 'boolean' ? storeValue : defaultValue

  const handleChange = () => {
    config.set(configName, !value)
  }

  return (
    <div className={undecided ? 'undecided-checkbox-inside' : ''}>
      <Checkbox
        disabled={undecided}
        checked={undecided ? false : value}
        onChange={undecided ? undefined : handleChange}
      >
        {label}
      </Checkbox>
    </div>
  )
}
