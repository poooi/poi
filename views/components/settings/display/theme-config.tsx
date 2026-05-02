import {
  HTMLSelect,
  Button,
  ControlGroup,
  FormGroup,
  Intent,
  Position,
  Tooltip,
  Label,
} from '@blueprintjs/core'
import themes from 'assets/data/theme.json'
import { shell } from 'electron'
import fs from 'fs-extra'
import { get, map } from 'lodash-es'
import { join } from 'path'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { FolderPickerConfig } from 'views/components/settings/components/folder-picker'
import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { EXROOT } from 'views/env'
import { toggleModal } from 'views/env-parts/modal'
import { fileUrl } from 'views/utils/tools'

const { openPath } = shell

const PreviewImage = styled.img`
  max-width: 30em;
  max-height: 15em;
`

const WrappedLabel = styled(Label)`
  margin-bottom: 0;
  margin-right: 10px;
`

const SWITCHES = [
  { label: 'Use SVG Icon', configName: 'poi.appearance.svgicon', defaultValue: false },
  { label: 'Enable Smooth Transition', configName: 'poi.transition.enable', defaultValue: true },
  { label: 'Use Gridded Plugin Menu', configName: 'poi.tabarea.grid', defaultValue: true },
  {
    label: 'Display detailed fleet info in main panel',
    configName: 'poi.appearance.enableOverviewFleetDetail',
    defaultValue: false,
  },
  { label: 'Show shipgirl avatar', configName: 'poi.appearance.avatar', defaultValue: false },
]

const avatarType = [
  { name: 'setting:none', value: 'none' },
  { name: 'setting:Type', value: 'shiptype' },
  { name: 'data:Range', value: 'range' },
  { name: 'main:Ship tag', value: 'tag' },
  { name: 'data:Speed', value: 'speed' },
]

type ConfigState = { config: Record<string, unknown> }

export const ThemeConfig = () => {
  const { t } = useTranslation('setting')
  const theme = String(
    useSelector((state: ConfigState) => get(state.config, 'poi.appearance.theme', 'dark')),
  )
  const vibrant = Number(
    useSelector((state: ConfigState) => get(state.config, 'poi.appearance.vibrant', 0)),
  )
  const rawBackground = useSelector((state: ConfigState) =>
    get(state.config, 'poi.appearance.background'),
  )
  const background = typeof rawBackground === 'string' ? rawBackground : undefined
  const enableAvatar = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.appearance.avatar')),
  )
  const rawAvatarType = useSelector((state: ConfigState) =>
    get(state.config, 'poi.appearance.avatarType'),
  )
  const selectedAvatarType = typeof rawAvatarType === 'string' ? rawAvatarType : undefined

  const handleSetTheme = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value
    if (theme !== selectedTheme) {
      window.applyTheme(selectedTheme)
    }
  }

  const handleOpenCustomCss = () => {
    try {
      const d = join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync(d)
      void openPath(d)
    } catch (_) {
      setTimeout(() => toggleModal(t('Edit custom CSS'), t('NoPermission'), []), 1500)
    }
  }

  const handleSetVibrancy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    config.set('poi.appearance.vibrant', parseInt(e.target.value))
  }

  const handleSetAvatarType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    config.set('poi.appearance.avatarType', e.target.value)
  }

  return (
    <Section title={t('Themes')}>
      <Wrapper>
        <FormGroup inline>
          <Wrapper>
            <ControlGroup>
              <HTMLSelect value={theme} onChange={handleSetTheme}>
                {themes.map((t, index) => (
                  <option key={index} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </HTMLSelect>
              <HTMLSelect value={vibrant} onChange={handleSetVibrancy}>
                <option key={0} value={0}>
                  {t('Default')}
                </option>
                {['darwin', 'win32'].includes(process.platform) && (
                  <option key={1} value={1}>
                    {t('Vibrance')}
                  </option>
                )}
                <option key={2} value={2}>
                  {t('Custom background')}
                </option>
              </HTMLSelect>
            </ControlGroup>
            <Button minimal intent={Intent.PRIMARY} onClick={handleOpenCustomCss}>
              {t('Edit custom CSS')}
            </Button>
          </Wrapper>
        </FormGroup>

        {vibrant === 2 && (
          <FillAvailable>
            <FormGroup inline label={t('Background')}>
              <FolderPickerConfig
                label={t('Custom background')}
                configName="poi.appearance.background"
                defaultValue={''}
                isFolder={false}
                placeholder={t('No background image selected')}
                extraControl={
                  <Tooltip
                    disabled={!background}
                    position={Position.BOTTOM_RIGHT}
                    content={<PreviewImage src={encodeURI(fileUrl(background ?? ''))} alt="" />}
                  >
                    <Button intent={Intent.PRIMARY} minimal>
                      {t('Preview')}
                    </Button>
                  </Tooltip>
                }
              />
            </FormGroup>
          </FillAvailable>
        )}

        {map(SWITCHES, ({ label, configName, defaultValue }) => (
          <FillAvailable key={configName}>
            <FormGroup inline>
              <SwitchConfig label={t(label)} configName={configName} defaultValue={defaultValue} />
            </FormGroup>
          </FillAvailable>
        ))}

        {enableAvatar && (
          <>
            <WrappedLabel>{t('AvatarBackground')}</WrappedLabel>
            <HTMLSelect value={selectedAvatarType} onChange={handleSetAvatarType}>
              {avatarType.map(({ name, value }, index) => (
                <option key={index} value={value}>
                  {t(name)}
                </option>
              ))}
            </HTMLSelect>
          </>
        )}
      </Wrapper>
    </Section>
  )
}
