import type { ButtonData } from 'views/components/etc/modal'

import * as remote from '@electron/remote'
import { shell } from 'electron'
import React from 'react'
import { config, POI_VERSION } from 'views/env'
import i18next from 'views/env-parts/i18next'
import { toggleModal } from 'views/env-parts/modal'

import {
  DOWNLOAD_URL,
  shouldShowArchitectureMismatchDialog,
} from './arm64-translation-warning-utils'

const DISMISSED_VERSION_CONFIG = 'poi.misc.arm64TranslationWarningDismissedVersion'

const openDownloadPage = () => {
  void shell.openExternal(DOWNLOAD_URL)
}

const dismissCurrentVersion = () => {
  config.set(DISMISSED_VERSION_CONFIG, POI_VERSION)
}

export const showArchitectureMismatchDialog = () => {
  const dismissedVersion = config.get(DISMISSED_VERSION_CONFIG, '')

  if (
    !shouldShowArchitectureMismatchDialog(
      process.arch,
      remote.app.runningUnderARM64Translation,
      dismissedVersion,
      POI_VERSION,
    )
  ) {
    return
  }

  const footer: ButtonData[] = [
    {
      name: String(i18next.t('Download ARM64 version')),
      func: openDownloadPage,
      style: 'primary',
    },
    {
      name: String(i18next.t("Don't show again for this version")),
      func: dismissCurrentVersion,
      style: 'success',
    },
  ]

  toggleModal(
    i18next.t('Architecture mismatch detected'),
    <div>
      <p>{i18next.t('Running under ARM64 translation')}</p>
      <p>{i18next.t('ARM64TranslationWarningDetail', { arch: process.arch })}</p>
    </div>,
    footer,
  )
}

setTimeout(showArchitectureMismatchDialog, 5000)
