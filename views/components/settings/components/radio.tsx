import { Radio, RadioGroup } from '@blueprintjs/core'
import { get, map } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'

interface RadioOption {
  value: string
  name: string
}

interface Props {
  configName: string
  defaultValue?: string
  availableVal?: RadioOption[]
}

type ConfigState = { config: Record<string, unknown> }

export const RadioConfig = ({ configName, defaultValue = '', availableVal = [] }: Props) => {
  const storeValue = useSelector((state: ConfigState) =>
    get(state.config, configName, defaultValue),
  )
  const value = typeof storeValue === 'string' ? storeValue : defaultValue

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    config.set(configName, e.currentTarget.value)
  }

  return (
    <RadioGroup inline selectedValue={value} onChange={handleChange}>
      {map(availableVal, (item) => (
        <Radio key={item.value} value={item.value}>
          {item.name}
        </Radio>
      ))}
    </RadioGroup>
  )
}
