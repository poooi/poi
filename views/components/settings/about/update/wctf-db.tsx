import { Button, Intent } from '@blueprintjs/core'
import Promise from 'bluebird'
import fs from 'fs-extra'
import glob from 'glob'
import _, { get } from 'lodash'
import path from 'path'
import React, { useState, useEffect, useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { createWctfDbUpdateAction } from 'views/redux/actions/app'
import { installPackage, getNpmConfig } from 'views/services/plugin-manager/utils'
import { wctfSelector } from 'views/utils/selectors'

declare const APPDATA_PATH: string

const PACKAGE_NAME = 'whocallsthefleet-database'
const DB_ROOT = path.join(APPDATA_PATH, 'wctf-db')
const DB_META_PATH = path.join(DB_ROOT, 'node_modules', PACKAGE_NAME, 'package.json')
const DB_FILE_PATH = path.join(DB_ROOT, 'node_modules', PACKAGE_NAME, 'db')

const DB_KEY: Record<string, string> = {
  arsenal_all: 'id',
  arsenal_weekday: 'weekday',
  item_type_collections: 'id',
  item_types: 'id',
  items: 'id',
  ship_classes: 'id',
  ship_type_collections: 'id',
  ship_types: 'id',
  ships: 'id',
  ship_namesuffix: 'id',
}

const fetchHeader = new Headers()
fetchHeader.set('Cache-Control', 'max-age=0')
const defaultFetchOption = {
  method: 'GET' as const,
  cache: 'default' as const,
  headers: fetchHeader,
}

export const WctfDB = () => {
  const dispatch = useDispatch()
  const version = String(get(useSelector(wctfSelector), 'version', '0.0.0'))
  const [updating, setUpdating] = useState(false)

  const parseData = useCallback(async () => {
    const data: Record<string, unknown> = {}
    try {
      await Promise.map(glob.sync(`${DB_FILE_PATH}/*.nedb`), async (dbPath) => {
        const dbName = path.basename(dbPath, '.nedb')
        if (!(dbName in DB_KEY)) return
        const buf = await fs.readFile(dbPath)
        const entryLines = buf.toString().split('\n').filter(Boolean)
        data[dbName] = _(entryLines)
          .map((content) => JSON.parse(content) as unknown)
          .keyBy(DB_KEY[dbName])
          .value()
      })
    } catch (e) {
      console.error(e instanceof Error ? e.stack : String(e))
      return undefined
    }
    return data
  }, [])

  const loadDB = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const meta = (await fs.readJSON(DB_META_PATH)) as { version: string }
      const data = await parseData()
      if (data) {
        dispatch(
          createWctfDbUpdateAction({
            version: meta.version,
            lastModified: +new Date(),
            ...data,
          }),
        )
      }
    } catch (e) {
      console.error(e instanceof Error ? e.stack : String(e))
    }
  }, [dispatch, parseData])

  const updateDB = useCallback(
    async (force = false) => {
      setUpdating(true)
      let updateFlag = false
      let meta: { version?: string } | undefined

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        meta = (await fs.readJSON(DB_META_PATH)) as { version: string }
      } catch (_) {
        updateFlag = true
      }

      if (get(meta, 'version') !== version) updateFlag = true

      const npmConfig = getNpmConfig(DB_ROOT)
      const data = await fetch(`${npmConfig.registry}${PACKAGE_NAME}/latest`, defaultFetchOption)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        .then((res) => (res.ok ? (res.json() as Promise<{ version?: string }>) : undefined))
        .catch(() => undefined)

      if (!data?.version) {
        console.warn("Can't find update info for wctf-db")
      }

      updateFlag = updateFlag || get(data, 'version', version) !== version

      if (updateFlag) {
        try {
          await installPackage(PACKAGE_NAME, data?.version, npmConfig)
          void loadDB()
          // eslint-disable-next-line no-console
          console.log(`wctf-db updated to ${data?.version}`)
        } catch (e) {
          console.error(e)
        }
      } else {
        if (force) void loadDB()
        // eslint-disable-next-line no-console
        console.log(`No update for wctf-db, current: ${version}, remote: ${get(data, 'version')}`)
      }

      setUpdating(false)
    },
    [loadDB, version],
  )

  useEffect(() => {
    const init = async () => {
      await fs.ensureDir(DB_ROOT)
      await fs.ensureDir(path.join(DB_ROOT, 'node_modules'))
      void updateDB()
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {version}{' '}
      <Button
        minimal
        onClick={() => void updateDB(true)}
        disabled={updating}
        intent={Intent.PRIMARY}
      >
        <Trans>setting:Update</Trans>
      </Button>
    </>
  )
}
