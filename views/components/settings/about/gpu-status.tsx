import { Button, Intent } from '@blueprintjs/core'
import { join } from 'path'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Section } from 'views/components/settings/components/section'
import { fileUrl } from 'views/utils/tools'

export const GPUStatus = () => {
  const { t } = useTranslation('setting')

  const handleClick = () => {
    const gpuWindow = open(fileUrl(join(ROOT, 'index-plugin.html')), 'plugin[gpuinfo]')
    gpuWindow?.addEventListener('DOMContentLoaded', () => {
      if (!gpuWindow) return
      const div = gpuWindow.document.createElement('div')
      const color = window.isDarkTheme ? '#3d3d3d' : 'white'
      div.style.height = '100%'
      div.innerHTML =
        '<webview src="chrome://gpu" style="width: 100%; height: 100%" webpreferences="transparent=yes" />'
      gpuWindow.document.body.style.height = '100vh'
      gpuWindow.document.body.style.margin = '0'
      gpuWindow.document.body.style.backgroundColor = color
      gpuWindow.document.body.appendChild(div)
    })
  }

  return (
    <Section title={t('GPU')}>
      <Button minimal intent={Intent.PRIMARY} onClick={handleClick}>
        {t('GPU Status')}
      </Button>
    </Section>
  )
}
