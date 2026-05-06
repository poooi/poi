import type { ConfigPath, ConfigValue } from 'lib/config'
import type { RootState } from 'views/redux/reducer-factory'

import { Tag, Button, Intent, Dialog, Callout } from '@blueprintjs/core'
import cls from 'classnames'
import { ipcRenderer } from 'electron'
import { get } from 'lodash'
import mousetrap from 'mousetrap'
import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'

const BorderlessDialog = styled(Dialog)`
  padding: 0;
`

type KeyListener = (character: string, modifiers: string[], e: Event) => void

let keyListener: KeyListener | null = null

config.on('config.set', (path: string) => {
  if (path === 'poi.shortcut.bosskey') {
    ipcRenderer.send('refresh-shortcut')
  }
})

interface Props<P extends ConfigPath> {
  configName: P
  defaultValue?: ConfigValue<P>
  disabled?: boolean
  label?: React.ReactNode
  className?: string
}

export const ShortcutConfig = <P extends ConfigPath>({
  configName,
  defaultValue,
  disabled,
  label,
  className,
  ...props
}: Props<P>) => {
  const { t } = useTranslation('setting')
  const value = String(
    useSelector((state: RootState) => get(state.config, configName, defaultValue ?? '')),
  )
  const [recording, setRecording] = useState(false)
  const valueRef = useRef(value)
  // eslint-disable-next-line react-hooks/refs
  valueRef.current = value

  const keyShouldIgnore = (character: string) => {
    if (character.length === 0) return true
    if (character.charCodeAt(0) < 32) return true
    return false
  }

  const abortRecording = () => setRecording(false)

  const transformKeyStr = (character: string, modifiers: string[]) => {
    const mapping: Record<string, string> = {
      shift: 'Shift',
      alt: 'Alt',
      ctrl: 'Ctrl',
      meta: 'ctrl' in modifiers ? 'Cmd' : 'CmdOrCtrl',
      Del: 'Delete',
      Ins: 'Insert',
    }
    const strModifiers = modifiers.map((m) => mapping[m] ?? m)
    const char = character[0].toUpperCase() + character.slice(1)
    return [...strModifiers, mapping[char] ?? char].join('+')
  }

  const setKey = (character: string, modifiers: string[]) => {
    const key = transformKeyStr(character, modifiers)
    setRecording(false)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set(configName, key as ConfigValue<P>)
  }

  const handleClickRecord = () => {
    keyListener = (character, modifiers) => {
      if (keyShouldIgnore(character)) return
      keyListener = null
      if (character === 'esc' && modifiers.length === 0) {
        abortRecording()
      } else {
        setKey(character, modifiers)
      }
    }
    setRecording(true)
  }

  const handleDisable = () => {
    setRecording(false)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set(configName, '' as ConfigValue<P>)
  }

  return (
    <div className={cls('shortcut-config', className)} {...props}>
      <Tag minimal intent={disabled || !value ? Intent.NONE : Intent.SUCCESS}>
        {value || t('Key not set')}
      </Tag>

      <BorderlessDialog autoFocus isOpen={recording} onClose={abortRecording}>
        <Callout intent={Intent.SUCCESS}>{t('Press the key, or Esc to cancel')}</Callout>
      </BorderlessDialog>

      <Button disabled={disabled} minimal intent={Intent.PRIMARY} onClick={handleClickRecord}>
        {value ? t('Change') : t('Set')}
      </Button>

      {!disabled && value && !recording && (
        <Button minimal intent={Intent.WARNING} onClick={handleDisable}>
          {t('Remove')}
        </Button>
      )}
    </div>
  )
}

mousetrap.prototype.handleKey = (character: string, modifiers: string[], e: Event) => {
  if (e.type !== 'keydown' || ['shift', 'alt', 'ctrl', 'meta'].includes(character)) {
    return
  }
  const fn = keyListener
  if (typeof fn === 'function') {
    fn(character, modifiers, e)
  }
}
