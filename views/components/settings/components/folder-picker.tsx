import type { FileFilter } from 'electron'

import { Position, Button, Intent, Classes, OverflowList, Tooltip } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import fs from 'fs-extra'
import { get, split, map, size } from 'lodash'
import path from 'path'
/* global config */
import React, { useState, useEffect, useCallback } from 'react'
import FA from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { connect, useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { isSubdirectory } from 'views/utils/tools'

const { dialog } = remote.require('electron')

const PickerBox = styled.div`
  display: flex;
  width: 100%;

  .bp5-overflow-list {
    flex: 1;
  }

  button {
    margin-left: 1em;
  }

  .bp5-breadcrumb {
    font-size: 12px;
  }
`

const EllipsisIcon = styled.span`
  color: white;
  background: ${(props) => props.theme.DARK_GRAY1};
  border-radius: 3px;
  padding: 0 4px;
`

interface FolderPickerConfigOwnProps {
  label?: string
  configName: string
  isFolder?: boolean
  placeholder?: string | React.ReactNode
  exclude?: string[]
  defaultValue?: string
  extraControl?: React.ReactNode
  filters?: FileFilter[]
}

type FolderPickerConfigProps = FolderPickerConfigOwnProps

export const FolderPickerConfig: React.FC<FolderPickerConfigProps> = ({
  label,
  configName,
  isFolder = true,
  placeholder,
  exclude = [],
  defaultValue,
  extraControl,
  filters,
}) => {
  const [locked, setLocked] = useState(false)

  const { t } = useTranslation('setting')
  const value = useSelector((state: any) => get(state.config, configName, defaultValue))

  const emitErrorMessage = useCallback(() => {
    window.toast(t('setting:DirectoryNotAvailable', { path: label }), {
      type: 'warning',
      title: t('setting:Error'),
    })
  }, [label, t])

  const setPath = useCallback(
    (val: string) => {
      if (exclude.length && exclude.some((parent) => isSubdirectory(parent, val))) {
        emitErrorMessage()
        return
      }
      config.set(configName, val)
    },
    [exclude, configName, emitErrorMessage],
  )

  useEffect(() => {
    if (exclude.length && exclude.some((parent) => isSubdirectory(parent, value))) {
      emitErrorMessage()
      config.set(configName, defaultValue)
    }
  }, []) // Only run on mount

  const handleOnDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleOnDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFiles = e.dataTransfer.files
      if (fs.statSync(droppedFiles[0].path).isDirectory() || !isFolder) {
        setPath(droppedFiles[0].path)
      }
    },
    [isFolder, setPath],
  )

  const handleOnClick = useCallback(async () => {
    if (locked) {
      return
    }
    setLocked(true)

    let defaultPath: string | undefined
    try {
      if (isFolder) {
        fs.ensureDirSync(value)
        defaultPath = value
      }
    } catch (e) {
      defaultPath = remote.app.getPath('desktop')
    }

    const selection = await dialog.showOpenDialog({
      title: label,
      defaultPath,
      properties: isFolder ? ['openDirectory', 'createDirectory'] : ['openFile'],
      filters,
    })

    if (!selection.canceled && size(selection.filePaths)) {
      setPath(selection.filePaths[0])
    }

    setLocked(false)
  }, [locked, isFolder, value, label, setPath, filters])

  const parseBreadcrumb = useCallback(
    (value: string) =>
      map(split(value, path.sep), (p) => ({
        text: p,
      })),
    [],
  )

  const renderBreadcrumb = useCallback((item: { text: string }, index: number) => {
    return (
      <li className={Classes.BREADCRUMB} key={index}>
        {item.text}
      </li>
    )
  }, [])

  const renderOverflow = useCallback((items: Array<{ text: string }>) => {
    return (
      <li>
        <Tooltip position={Position.BOTTOM_LEFT} content={map(items, 'text').join(path.sep)}>
          <EllipsisIcon>
            <FA name="ellipsis-h" />
          </EllipsisIcon>
        </Tooltip>
      </li>
    )
  }, [])

  return (
    <PickerBox
      className="folder-picker"
      onDrop={handleOnDrop}
      onDragEnter={handleOnDrag}
      onDragOver={handleOnDrag}
      onDragLeave={handleOnDrag}
    >
      {value ? (
        <OverflowList
          className={Classes.BREADCRUMBS}
          items={parseBreadcrumb(value)}
          overflowRenderer={renderOverflow}
          visibleItemRenderer={renderBreadcrumb}
        />
      ) : (
        placeholder
      )}
      <Button disabled={locked} onClick={handleOnClick} minimal intent={Intent.PRIMARY}>
        {t(value ? 'Change' : 'Select')}
      </Button>
      {extraControl}
    </PickerBox>
  )
}
