import type { ConfigPath } from 'views/env'

import { NumericInput } from '@blueprintjs/core'
import { debounce, get } from 'lodash-es'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

type ConfigState = { config: Record<string, unknown> }

type Props = {
  configName: string
  defaultValue?: number
} & Omit<React.ComponentPropsWithoutRef<typeof NumericInput>, 'value' | 'onValueChange'>

export const IntegerConfig = ({ configName, defaultValue = 0, ...rest }: Props) => {
  const storeValue = useSelector((state: ConfigState) =>
    get(state.config, configName, defaultValue),
  )
  const value = typeof storeValue === 'number' ? storeValue : defaultValue

  const handleChange = useMemo(
    () =>
      debounce((v: number) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        config.set(configName as ConfigPath, Math.round(v) as never)
      }, 200),
    [configName],
  )

  return <NumericInput {...rest} value={value} onValueChange={handleChange} />
}
