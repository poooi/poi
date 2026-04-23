import { InputGroup } from '@blueprintjs/core'
import { debounce, get } from 'lodash'
import React, { useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

type ConfigState = { config: Record<string, unknown> }

type Props = {
  configName: string
  defaultValue?: string
} & Omit<React.ComponentPropsWithoutRef<typeof InputGroup>, 'value' | 'onChange'>

export const TextConfig = ({ configName, defaultValue = '', ...rest }: Props) => {
  const storeValue = useSelector((state: ConfigState) =>
    get(state.config, configName, defaultValue),
  )
  const sv = typeof storeValue === 'string' ? storeValue : defaultValue

  const [value, setValue] = useState(sv)
  const prevSv = useRef(sv)
  // Replicate getDerivedStateFromProps: sync local state when store value changes externally
  if (sv !== prevSv.current) {
    prevSv.current = sv
    setValue(sv)
  }

  const applyConfig = useMemo(
    () =>
      debounce((v: string) => {
        config.set(configName, v)
      }, 200),
    [configName],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
    applyConfig(e.currentTarget.value)
  }

  return <InputGroup {...rest} value={value} onChange={handleChange} />
}
