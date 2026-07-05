import type { ReactNode } from 'react'
import type { ButtonData } from 'views/components/etc/modal'

import {
  isTranslatedNonArm64Build,
  shouldShowArchitectureMismatchDialog,
} from '../arm64-translation-warning-utils'

type ToggleModal = (title: ReactNode, content: ReactNode, footer: ButtonData[]) => void

interface LoadServiceOptions {
  runningUnderARM64Translation?: unknown
  dismissedVersion?: string
}

const loadService = async (options: LoadServiceOptions = {}) => {
  jest.resetModules()
  jest.useFakeTimers()

  const { dismissedVersion = '' } = options
  const runningUnderARM64Translation =
    'runningUnderARM64Translation' in options ? options.runningUnderARM64Translation : true
  const config = {
    get: jest.fn((_path: string, fallback: string) => dismissedVersion || fallback),
    set: jest.fn((_path: string, _value: string) => undefined),
  }
  const openExternal = jest.fn((_url: string) => Promise.resolve())
  const toggleModal = jest.fn((_title: ReactNode, _content: ReactNode, _footer: ButtonData[]) => {
    // noop
  }) satisfies jest.MockedFunction<ToggleModal>
  const t = jest.fn((key: string, options?: { arch?: string }) =>
    options?.arch ? `${key} ${options.arch}` : key,
  )

  jest.doMock('@electron/remote', () => ({
    app: { runningUnderARM64Translation },
  }))
  jest.doMock('electron', () => ({
    shell: { openExternal },
  }))
  jest.doMock('views/env', () => ({
    config,
    POI_VERSION: '11.1.0',
  }))
  jest.doMock('views/env-parts/i18next', () => ({
    __esModule: true,
    default: { t },
  }))
  jest.doMock('views/env-parts/modal', () => ({
    toggleModal,
  }))

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceModule: unknown = require('../arm64-translation-warning')
  const showArchitectureMismatchDialog = Object.getOwnPropertyDescriptor(
    serviceModule,
    'showArchitectureMismatchDialog',
  )?.value
  if (typeof showArchitectureMismatchDialog !== 'function') {
    throw new Error('Expected showArchitectureMismatchDialog export')
  }
  return { config, openExternal, showArchitectureMismatchDialog, toggleModal }
}

describe('ARM64 translation warning', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.dontMock('@electron/remote')
    jest.dontMock('electron')
    jest.dontMock('views/env')
    jest.dontMock('views/env-parts/i18next')
    jest.dontMock('views/env-parts/modal')
  })

  it('detects non-arm64 builds running under ARM64 translation', () => {
    expect(isTranslatedNonArm64Build('x64', true)).toBe(true)
    expect(isTranslatedNonArm64Build('ia32', true)).toBe(true)
  })

  it('does not warn native ARM64 builds or untranslated builds', () => {
    expect(isTranslatedNonArm64Build('arm64', true)).toBe(false)
    expect(isTranslatedNonArm64Build('x64', false)).toBe(false)
    expect(isTranslatedNonArm64Build('arm64', false)).toBe(false)
  })

  it('shows again when the current version differs from the dismissed version', () => {
    expect(shouldShowArchitectureMismatchDialog('x64', true, '', '11.1.0')).toBe(true)
    expect(shouldShowArchitectureMismatchDialog('x64', true, '11.0.0', '11.1.0')).toBe(true)
    expect(shouldShowArchitectureMismatchDialog('x64', true, '11.1.0', '11.1.0')).toBe(false)
  })

  it('shows the modal when a translated non-arm64 version has not been dismissed', async () => {
    const { showArchitectureMismatchDialog, toggleModal } = await loadService()

    showArchitectureMismatchDialog()

    expect(toggleModal).toHaveBeenCalledTimes(1)
  })

  it('does not show the modal when the Electron translation flag is falsey', async () => {
    const { showArchitectureMismatchDialog, toggleModal } = await loadService({
      runningUnderARM64Translation: undefined,
    })

    showArchitectureMismatchDialog()

    expect(toggleModal).not.toHaveBeenCalled()
  })

  it('does not show the modal after dismissal for the current version', async () => {
    const { showArchitectureMismatchDialog, toggleModal } = await loadService({
      dismissedVersion: '11.1.0',
    })

    showArchitectureMismatchDialog()

    expect(toggleModal).not.toHaveBeenCalled()
  })

  it('opens download and dismisses the current version from modal actions', async () => {
    const { config, openExternal, showArchitectureMismatchDialog, toggleModal } =
      await loadService()

    showArchitectureMismatchDialog()

    const footer = toggleModal.mock.calls[0]?.[2]
    if (!footer) {
      throw new Error('Expected ARM64 warning modal footer')
    }
    const [downloadButton, dismissButton] = footer
    if (!downloadButton || !dismissButton) {
      throw new Error('Expected download and dismissal buttons')
    }

    expect(downloadButton.name).toBe('Download ARM64 version')
    expect(dismissButton.name).toBe("Don't show again for this version")

    Reflect.apply(downloadButton.func, undefined, [])
    Reflect.apply(dismissButton.func, undefined, [])

    expect(openExternal).toHaveBeenCalledWith('https://poi.moe/download')
    expect(config.set).toHaveBeenCalledWith(
      'poi.misc.arm64TranslationWarningDismissedVersion',
      '11.1.0',
    )
  })
})
