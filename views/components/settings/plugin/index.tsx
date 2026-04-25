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
import pluginManager from 'views/services/plugin-manager'
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

  const handleUpdate = useCallback(async (index: number) => {
    setNpmWorking(true)
    const installedPlugins = pluginManager.getInstalledPlugins()
    const plugin = installedPlugins[index]
    if (!plugin || plugin.linkedPlugin || plugin.isExtra) {
      setNpmWorking(false)
      return
    }
    try {
      await pluginManager.installPlugin(plugin.packageName, plugin.latestVersion)
    } catch (error) {
      console.error(error)
    } finally {
      setNpmWorking(false)
    }
  }, [])

  const handleInstall = useCallback(async (name: string) => {
    setInstallingPluginNames((prev) => [...prev, name])
    setNpmWorking(true)
    try {
      await pluginManager.installPlugin(name)
      setInstallingPluginNames((prev) => prev.filter((n) => n !== name))
      setNpmWorking(false)
    } catch (error) {
      setNpmWorking(false)
      throw error
    }
  }, [])

  const showGracefulRepairToast = useCallback(() => {
    window.toast(t('plugin-install-failed-message'), {
      // @ts-expect-error toast options type mismatch with action
      action: { onClick: handleGracefulRepair, text: t('Repair plugins') },
      intent: 'danger',
    })
  }, [t]) // eslint-disable-line react-hooks/exhaustive-deps

  const gracefulRepair = useCallback(async () => {
    setNpmWorking(true)
    try {
      await pluginManager.gracefulRepair()
    } catch (e) {
      console.error(e)
    } finally {
      setNpmWorking(false)
    }
  }, [])

  const handleGracefulRepair = useCallback(() => {
    window.toggleModal(t('Repair plugins'), t('repair-plugins-confirmation'), [
      { name: t('others:Confirm'), func: gracefulRepair, style: 'warning' },
    ])
  }, [t, gracefulRepair])

  useEffect(() => {
    setCheckingUpdate(true)
    setNpmWorking(true)

    const isNotif = config.get('packageManager.enablePluginCheck', true) && !autoUpdate

    const handleAutoUpdate = async () => {
      await pluginManager.getOutdatedPlugins(isNotif)
      if (autoUpdate) {
        const installedPlugins = pluginManager.getInstalledPlugins()
        for (let i = 0; i < installedPlugins.length; i++) {
          if (installedPlugins[i].isOutdated) {
            try {
              await handleUpdate(i)
            } catch (error) {
              console.error(error)
            }
          }
        }
      }
    }

    pluginManager.once('installfailed', showGracefulRepairToast)
    pluginManager.once('initialized', handleAutoUpdate)

    setCheckingUpdate(false)
    setNpmWorking(false)

    return () => {
      pluginManager.off('installfailed', showGracefulRepairToast)
      pluginManager.off('initialized', handleAutoUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkUpdate = async () => {
    setCheckingUpdate(true)
    setNpmWorking(true)
    await pluginManager.getOutdatedPlugins()
    setCheckingUpdate(false)
    setNpmWorking(false)
  }

  const doInstallAll = async () => {
    setInstallingAll(true)
    setNpmWorking(true)
    const settings = pluginManager.getUninstalledPluginSettings()
    for (const name of Object.keys(settings)) {
      try {
        await handleInstall(name)
      } catch (e) {
        console.error(e)
      }
    }
    setInstallingAll(false)
    setNpmWorking(false)
  }

  const handleInstallAll = () => {
    window.toggleModal(t('Install all'), t('install-all-confirmation'), [
      { name: t('others:Confirm'), func: doInstallAll, style: 'warning' },
    ])
  }

  const handleUpdateAll = async () => {
    setUpdatingAll(true)
    setNpmWorking(true)
    const installedPlugins = pluginManager.getInstalledPlugins()
    for (let i = 0; i < installedPlugins.length; i++) {
      if (installedPlugins[i].isOutdated) {
        try {
          await handleUpdate(i)
        } catch (error) {
          console.error(error)
        }
      }
    }
    setUpdatingAll(false)
    setNpmWorking(false)
  }

  const handleInstallByName = async (name: string) => {
    setManuallyInstallStatus(1)
    try {
      await handleInstall(name)
      setManuallyInstallStatus(2)
    } catch (_) {
      setManuallyInstallStatus(3)
    }
  }

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
        {plugins.map((plugin, index) => (
          <PluginItem
            key={plugin.id}
            plugin={plugin}
            onUpdate={() => handleUpdate(index)}
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
            onRemove={async () => {
              setNpmWorking(true)
              try {
                const installedPlugins = pluginManager.getInstalledPlugins()
                const p = installedPlugins[index]
                await pluginManager.uninstallPlugin(p)
              } catch (error) {
                console.error(error)
              } finally {
                setNpmWorking(false)
              }
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
              onInstall={() => handleInstall(name)}
            />
          )
        })}
      </PluginList>
    </>
  )
}
