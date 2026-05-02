import type { ConfigValue, ConfigPath } from 'lib/config'
import type { RootState } from 'views/redux/reducer-factory'

import { Radio, RadioGroup } from '@blueprintjs/core'
import { get, map } from 'lodash-es'
import React from 'react'
import { useSelector } from 'react-redux'

interface RadioOption {
  value: string
  name: string
}

interface Props<P extends ConfigPath> {
  configName: P
  defaultValue?: string
  availableVal?: RadioOption[]
}

export const RadioConfig = <P extends ConfigPath>({
  configName,
  defaultValue = '',
  availableVal = [],
}: Props<P>) => {
  const storeValue = useSelector((state: RootState) => get(state.config, configName, defaultValue))
  const value = typeof storeValue === 'string' ? storeValue : defaultValue

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set(configName, e.currentTarget.value as ConfigValue<P>)
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
