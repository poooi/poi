import { Button, Intent, Tooltip } from '@blueprintjs/core'
import { sync as globSync } from 'glob'
import { get, entries, map, max, values } from 'lodash'
import fetch from 'node-fetch'
import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  InfoTooltip,
  InfoTooltipEntry,
  InfoTooltipItem,
} from 'views/components/etc/styled-components'

const serverList = [
  'https://update.poi.moe/fcd/',
  'https://raw.githubusercontent.com/poooi/poi/master/assets/data/fcd/',
  'https://fastly.poi.moe/fcd/',
  'https://cdn.jsdelivr.net/gh/poooi/poi@master/assets/data/fcd/',
]

const defaultFetchOption = {
  method: 'GET' as const,
  cache: 'default' as const,
  headers: {
    'Cache-Control': 'max-age=0',
  },
}

interface FcdVersion {
  [key: string]: string
}

type RootState = { fcd: { version?: FcdVersion } }

export const FCD = () => {
  const { t } = useTranslation('setting')
  const dispatch = useDispatch()
  const version: FcdVersion = useSelector((state: RootState) => state.fcd.version ?? {})
  const [updating, setUpdating] = useState(false)

  const updateData = useCallback(
    (cacheMode = 'default') =>
      async () => {
        setUpdating(true)

        const localFileList = globSync(`${ROOT}/assets/data/fcd/*`)
        for (const file of localFileList) {
          if (!file.includes('meta.json')) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const data = require(file) as { meta?: { version?: string; name?: string } }
            const dataVersion = get(data, 'meta.version')
            const name = get(data, 'meta.name')
            if (name && dataVersion) {
              const localVersion = get(version, name, '1970/01/01/01')
              if (dataVersion > localVersion) {
                dispatch({ type: '@@updateFCD', value: data })
              }
            }
          }
        }

        let flag = false
        for (const server of serverList) {
          flag = true
          const fileList = await fetch(`${server}meta.json`, defaultFetchOption)
            .then((res) =>
              res.ok
                ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                  (res.json() as Promise<Array<{ name: string; version: string }>>)
                : undefined,
            )
            .catch(() => undefined)

          if (fileList) {
            for (const file of fileList) {
              const localVersion = get(version, file.name, '1970/01/01/01')
              if (file.version > localVersion) {
                console.log(
                  `Updating ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`,
                )
                const data = await fetch(`${server}${file.name}.json`, defaultFetchOption)
                  .then((res) => (res.ok ? res.json() : undefined))
                  .catch(() => undefined)
                if (data) {
                  dispatch({ type: '@@updateFCD', value: data })
                } else {
                  flag = false
                }
              } else {
                console.log(
                  `No newer version of ${file.name}: current ${localVersion}, remote ${file.version}, mode ${cacheMode}`,
                )
              }
            }
          } else {
            flag = false
          }

          if (flag) {
            console.log(`Update fcd from ${server} successfully in mode ${cacheMode}.`)
            break
          } else {
            console.warn(`Update fcd from ${server} failed in mode ${cacheMode}.`)
          }
        }

        setUpdating(false)
      },
    [dispatch, version],
  )

  useEffect(() => {
    void updateData()()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Tooltip
        content={
          <InfoTooltip className="info-tooltip">
            {map(entries(version), ([name, ver]) => (
              <InfoTooltipEntry key={name} className="info-tooltip-entry">
                <InfoTooltipItem className="info-tooltip-item">{name}</InfoTooltipItem>
                <span>{ver}</span>
              </InfoTooltipEntry>
            ))}
          </InfoTooltip>
        }
      >
        {max(values(version)) ?? t('Unknown')}
      </Tooltip>{' '}
      <Button
        minimal
        onClick={() => void updateData('reload')()}
        disabled={updating}
        intent={Intent.PRIMARY}
      >
        {t('Update')}
      </Button>
    </>
  )
}
