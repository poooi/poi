import { FormGroup, ControlGroup, InputGroup, Button, Intent } from '@blueprintjs/core'
import { trim, last } from 'lodash'
import npa from 'npm-package-arg'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const validate = (packageName: string): boolean => {
  if (!packageName) return false
  try {
    const resolved = npa(packageName)
    if (
      !resolved.registry ||
      !/^poi-plugin-.+$/.test(last(resolved.name?.split('/') ?? []) ?? '')
    ) {
      return false
    }
  } catch (_) {
    return false
  }
  return true
}

interface Props {
  onInstall: (name: string) => void
  status: number
  npmWorking: boolean
}

export const NameInput = ({ onInstall, status, npmWorking }: Props): React.ReactElement => {
  const { t } = useTranslation('setting')
  const [packageName, setPackageName] = useState('')

  const validPackageName = validate(packageName)

  return (
    <FormGroup label={t('Install directly from npm')}>
      <ControlGroup fill>
        <InputGroup
          type="text"
          value={packageName}
          onChange={(e) => setPackageName(trim(e.target.value))}
          disabled={status === 1 || npmWorking}
          placeholder={t('Input plugin package name') + '...'}
        />
        <Button
          intent={Intent.PRIMARY}
          disabled={status === 1 || npmWorking || !validPackageName}
          onClick={() => onInstall(packageName)}
        >
          {t('Install')}
        </Button>
      </ControlGroup>
    </FormGroup>
  )
}
