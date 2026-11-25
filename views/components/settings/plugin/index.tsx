import type { RootState } from 'views/redux/reducer-factory'

import {
  Callout,
  Intent,
  Button,
  ButtonGroup,
  Popover,
  Menu,
  Position,
  MenuItem,
} from '@blueprintjs/core'
import { shell } from 'electron'
import { join } from 'path'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { config, PLUGIN_PATH } from 'views/env'
import { toggleModal } from 'views/env-parts/modal'
import pluginManager, { type Plugin } from 'views/services/plugin-manager'
import { bundlePluginMetaToPlugin } from 'views/services/plugin-manager/utils'

import { Section } from '../components/section'
import { NameInput } from './name-input'
import { PluginItem } from './plugin-item'

const Control = styled.div`
  margin: 1em 0;
`

const AdvancePopover = styled(Popover)`
  flex: 1 1 auto;
`

const SettingButton = styled(Button)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const AdvanceButton = styled(SettingButton)`
  width: 100%;
`

const PluginList = styled.div`
  margin-top: 4em;
`

const MAX_DISPLAYED_ERROR_LENGTH = 240

const describeError = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const detail = raw.replace(/\s+/g, ' ').trim()
  return detail.length > MAX_DISPLAYED_ERROR_LENGTH
    ? `${detail.slice(0, MAX_DISPLAYED_ERROR_LENGTH - 3)}...`
    : detail
}

const summarizeFailures = (failures: Array<{ name: string; error: unknown }>): string =>
  failures
    .map(({ name, error }) => {
      const detail = describeError(error)
      if (!name) return detail
      return detail ? `${name}: ${detail}` : name
    })
    .filter(Boolean)
    .join('; ')

export const PluginConfig = (): React.ReactElement => {
  const { t } = useTranslation(['setting', 'others'])

  const plugins = useSelector((state: RootState) => state.plugins)
  const autoUpdate = useSelector(
    (state: RootState) => state?.config?.packageManager?.enableAutoUpdate ?? true,
  )

  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [npmWorking, setNpmWorking] = useState(false)
  const [installingAll, setInstallingAll] = useState(false)
  const [installingPluginNames, setInstallingPluginNames] = useState<string[]>([])
  const [updatingAll, setUpdatingAll] = useState(false)
  const [manuallyInstallStatus, setManuallyInstallStatus] = useState(0)

  const batchOperationRef = useRef(false)
  const prevManuallyInstallStatus = useRef(manuallyInstallStatus)
  useEffect(() => {
    if (
      prevManuallyInstallStatus.current > 1 &&
      prevManuallyInstallStatus.current === manuallyInstallStatus
    ) {
      setManuallyInstallStatus(0)
    }
    prevManuallyInstallStatus.current = manuallyInstallStatus
  }, [manuallyInstallStatus])

  const reportFailure = useCallback(
    (names: string[], error?: unknown) => {
      const detail = describeError(error)
      const label = names.length > 0 ? names.join(' / ') : t('plugin-install-failed-message')
      window.toast(detail ? `${label}: ${detail}` : label, {
        intent: 'danger',
        title: t('setting:Plugin error'),
      })
    },
    [t],
  )

  const updatePlugin = useCallback(async (plugin: Plugin) => {
    if (plugin.linkedPlugin || plugin.isExtra) return
    await pluginManager.installPlugin(plugin.packageName, plugin.latestVersion)
  }, [])

  const gracefulRepair = useCallback(async () => {
    setNpmWorking(true)
    batchOperationRef.current = true
    try {
      const result = await pluginManager.gracefulRepair()
      if (result.failed.length > 0) {
        const summary = summarizeFailures(
          result.failed.map((failed) => ({ name: failed.packageName, error: failed.error })),
        )
        reportFailure([summary])
      }
    } catch (error) {
      reportFailure([], error)
    } finally {
      batchOperationRef.current = false
      setNpmWorking(false)
    }
  }, [reportFailure])

  const handleGracefulRepair = useCallback(() => {
    toggleModal(t('Repair plugins'), t('repair-plugins-confirmation'), [
      { name: t('others:Confirm'), func: gracefulRepair, style: 'warning' },
    ])
  }, [t, gracefulRepair])

  const showGracefulRepairToast = useCallback(
    (packageName?: string, error?: unknown) => {
      if (batchOperationRef.current) return
      const detail = describeError(error)
      const label = packageName ? `${packageName}: ` : ''
      window.toast(`${label}${detail || t('plugin-install-failed-message')}`, {
        action: { onClick: handleGracefulRepair, text: t('Repair plugins') },
        intent: 'danger',
      })
    },
    [t, handleGracefulRepair],
  )

  const handleUpdate = useCallback(
    async (plugin: Plugin) => {
      setNpmWorking(true)
      try {
        await updatePlugin(plugin)
      } catch {
        // The plugin manager's 'installfailed' listener reports this once.
      } finally {
        setNpmWorking(false)
      }
    },
    [updatePlugin],
  )

  const handleInstall = useCallback(async (name: string) => {
    setInstallingPluginNames((prev) => [...prev, name])
    try {
      await pluginManager.installPlugin(name)
    } finally {
      setInstallingPluginNames((prev) => prev.filter((n) => n !== name))
    }
  }, [])

  useEffect(() => {
    const isNotif = config.get('packageManager.enablePluginCheck', true) && !autoUpdate

    const handleAutoUpdate = async () => {
      const failures: Array<{ name: string; error: unknown }> = []
      setCheckingUpdate(true)
      setNpmWorking(true)
      batchOperationRef.current = true
      try {
        await pluginManager.getOutdatedPlugins(isNotif)
        if (autoUpdate) {
          const installedPlugins = pluginManager.getInstalledPlugins()
          for (const plugin of installedPlugins) {
            if (!plugin.isOutdated) continue
            try {
              await updatePlugin(plugin)
            } catch (error) {
              failures.push({ name: plugin.packageName, error })
            }
          }
        }
      } catch (error) {
        failures.push({ name: '', error })
      } finally {
        batchOperationRef.current = false
        setCheckingUpdate(false)
        setNpmWorking(false)
      }
      if (failures.length > 0) {
        reportFailure([summarizeFailures(failures)])
      }
    }

    pluginManager.on('installfailed', showGracefulRepairToast)
    pluginManager.once('initialized', handleAutoUpdate)

    return () => {
      pluginManager.off('installfailed', showGracefulRepairToast)
      pluginManager.off('initialized', handleAutoUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkUpdate = async () => {
    setCheckingUpdate(true)
    setNpmWorking(true)
    try {
      await pluginManager.getOutdatedPlugins()
    } catch (error) {
      reportFailure([], error)
    } finally {
      setCheckingUpdate(false)
      setNpmWorking(false)
    }
  }

  const doInstallAll = async () => {
    setInstallingAll(true)
    setNpmWorking(true)
    const failures: Array<{ name: string; error: unknown }> = []
    batchOperationRef.current = true
    try {
      const settings = pluginManager.getUninstalledPluginSettings()
      for (const name of Object.keys(settings)) {
        try {
          await handleInstall(name)
        } catch (error) {
          failures.push({ name, error })
        }
      }
    } finally {
      batchOperationRef.current = false
      setInstallingAll(false)
      setNpmWorking(false)
    }
    if (failures.length > 0) {
      reportFailure([summarizeFailures(failures)])
    }
  }

  const handleInstallAll = () => {
    toggleModal(t('Install all'), t('install-all-confirmation'), [
      { name: t('others:Confirm'), func: doInstallAll, style: 'warning' },
    ])
  }

  const handleUpdateAll = async () => {
    setUpdatingAll(true)
    setNpmWorking(true)
    const failures: Array<{ name: string; error: unknown }> = []
    batchOperationRef.current = true
    try {
      const installedPlugins = pluginManager.getInstalledPlugins()
      for (const plugin of installedPlugins) {
        if (!plugin.isOutdated) continue
        try {
          await updatePlugin(plugin)
        } catch (error) {
          failures.push({ name: plugin.packageName, error })
        }
      }
    } finally {
      batchOperationRef.current = false
      setUpdatingAll(false)
      setNpmWorking(false)
    }
    if (failures.length > 0) {
      reportFailure([summarizeFailures(failures)])
    }
  }

  const handleInstallByName = async (name: string) => {
    setManuallyInstallStatus(1)
    setNpmWorking(true)
    try {
      await handleInstall(name)
      setManuallyInstallStatus(2)
    } catch {
      setManuallyInstallStatus(3)
      // The Callout and the plugin manager's 'installfailed' listener report this.
    } finally {
      setNpmWorking(false)
    }
  }

  const handleRemove = useCallback(
    async (plugin: Plugin) => {
      setNpmWorking(true)
      try {
        await pluginManager.uninstallPlugin(plugin)
      } catch (error) {
        reportFailure([plugin.packageName], error)
      } finally {
        setNpmWorking(false)
      }
    },
    [reportFailure],
  )

  const uninstalledPluginSettings = pluginManager.getUninstalledPluginSettings()

  const updateStatusFAname = updatingAll ? 'spinner' : 'cloud-download'
  const installStatusFAname = installingAll ? 'spinner' : 'download'

  let installStatusIntent: Intent
  let installStatusText: React.ReactNode
  switch (manuallyInstallStatus) {
    case 1:
      installStatusIntent = Intent.NONE
      installStatusText = <>{t('setting:Installing')}...</>
      break
    case 2:
      installStatusIntent = Intent.SUCCESS
      installStatusText = t('setting:Plugins are installed successfully')
      break
    case 3:
      installStatusIntent = Intent.DANGER
      installStatusText = t('setting:InstallFailedMsg')
      break
    default:
      installStatusIntent = Intent.WARNING
      installStatusText = ''
  }

  return (
    <>
      {window.isSafeMode && (
        <Callout intent={Intent.WARNING}>
          {t('setting:poi is running in safe mode, plugins are not enabled automatically')}
        </Callout>
      )}
      <Section>
        <Control className="plugin-manage-control">
          <ButtonGroup fill>
            <SettingButton onClick={checkUpdate} disabled={checkingUpdate}>
              <FontAwesome name="refresh" spin={checkingUpdate} />
              <span> {t('setting:Check Update')}</span>
            </SettingButton>
            <SettingButton
              onClick={handleUpdateAll}
              disabled={npmWorking || checkingUpdate || !pluginManager.getUpdateStatus()}
            >
              <FontAwesome name={updateStatusFAname} pulse={updatingAll} />
              <span> {t('setting:Update all')}</span>
            </SettingButton>
            <SettingButton
              onClick={handleInstallAll}
              disabled={npmWorking || Object.keys(uninstalledPluginSettings).length === 0}
            >
              <FontAwesome name={installStatusFAname} pulse={installingAll} />
              <span> {t('setting:Install all')}</span>
            </SettingButton>
            <AdvancePopover
              position={Position.BOTTOM}
              targetTagName="div"
              content={
                <Menu>
                  <MenuItem
                    text={t('setting:Open plugin folder')}
                    onClick={() => shell.openPath(join(PLUGIN_PATH, 'node_modules'))}
                  />
                  <MenuItem
                    text={t('setting:Search for plugins')}
                    onClick={(e) => {
                      shell.openExternal('https://www.npmjs.com/search?q=poi-plugin')
                      e.preventDefault()
                    }}
                  />
                  <MenuItem text={t('setting:Repair plugins')} onClick={handleGracefulRepair} />
                </Menu>
              }
            >
              <AdvanceButton>
                <FontAwesome name="gear" />
                <span> {t('setting:Advanced')}</span>
              </AdvanceButton>
            </AdvancePopover>
          </ButtonGroup>
        </Control>

        <Control className="install-plugin-by-name">
          {manuallyInstallStatus > 0 && (
            <Callout intent={installStatusIntent}>{installStatusText}</Callout>
          )}
          <NameInput
            onInstall={handleInstallByName}
            status={manuallyInstallStatus}
            npmWorking={npmWorking}
          />
        </Control>
      </Section>

      <PluginList className="plugin-list">
        {plugins.map((plugin) => (
          <PluginItem
            key={plugin.id}
            plugin={plugin}
            npmWorking={npmWorking}
            onUpdate={() => {
              void handleUpdate(plugin)
            }}
            onEnable={async () => {
              switch (pluginManager.getStatusOfPlugin(plugin)) {
                case pluginManager.DISABLED:
                  await pluginManager.enablePlugin(plugin)
                  break
                case pluginManager.VALID:
                  await pluginManager.disablePlugin(plugin)
                  break
              }
            }}
            onRemove={() => {
              void handleRemove(plugin)
            }}
            onReload={() => pluginManager.reloadPlugin(plugin)}
          />
        ))}
        {Object.keys(uninstalledPluginSettings).map((name) => {
          const bundlePlugin = uninstalledPluginSettings[name]
          const plugin = bundlePluginMetaToPlugin(bundlePlugin, name)
          return (
            <PluginItem
              installable
              key={name}
              plugin={plugin}
              npmWorking={npmWorking}
              installing={installingPluginNames.includes(name)}
              onInstall={() => {
                void handleInstallByName(name)
              }}
            />
          )
        })}
      </PluginList>
    </>
  )
}
