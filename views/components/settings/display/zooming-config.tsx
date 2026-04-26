import { Slider } from '@blueprintjs/core'
import { get } from 'lodash'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Section } from 'views/components/settings/components/section'

type ConfigState = { config: Record<string, unknown> }

export const ZoomingConfig = () => {
  const { t } = useTranslation('setting')
  const storedZoom = Number(
    useSelector((state: ConfigState) => get(state.config, 'poi.appearance.zoom', 1)),
  )
  const [zoomLevel, setZoomLevel] = useState(storedZoom)

  const handleChangeZoomLevel = (value: number) => {
    setZoomLevel(Math.round(value * 100) / 100)
  }

  const handleSaveZoomLevel = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set('poi.appearance.zoom' as never, zoomLevel as never)
  }

  return (
    <Section title={t('Zoom')}>
      <Slider
        onChange={handleChangeZoomLevel}
        onRelease={handleSaveZoomLevel}
        min={0.5}
        max={4.0}
        stepSize={0.05}
        labelRenderer={(value) => `${Math.round(value * 100)}%`}
        value={zoomLevel}
      />
    </Section>
  )
}
