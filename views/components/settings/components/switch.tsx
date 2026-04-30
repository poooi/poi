import type { ConfigPath } from 'views/env'

import { Switch } from '@blueprintjs/core'
import { get } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'

const SwitchWithMargin = styled(Switch)`
  margin-right: 8px;
`

interface Props {
  configName: string
  defaultValue?: boolean
  label: React.ReactNode
  disabled?: boolean
}

type ConfigState = { config: Record<string, unknown> }

export const SwitchConfig = ({ configName, defaultValue = false, label, disabled }: Props) => {
  const storeValue = useSelector((state: ConfigState) =>
    get(state.config, configName, defaultValue),
  )
  const value = typeof storeValue === 'boolean' ? storeValue : defaultValue

  const handleChange = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set(configName as ConfigPath, !value as never)
  }

  return (
    <SwitchWithMargin checked={value} onChange={handleChange} disabled={disabled}>
      {label}
    </SwitchWithMargin>
  )
}
