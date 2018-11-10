/**
 * Generate tooltip for buttons that supports context menu user interaction
 */
import React from 'react'
import { translate } from 'react-i18next'
import {
  InfoTooltip,
  InfoTooltipEntry,
  InfoTooltipItem,
} from 'views/components/etc/styled-components'

export const ContextButtonTooltip = translate(['setting'])(({ left, right, t, ...props }) => (
  <InfoTooltip className="info-tooltip">
    <InfoTooltipEntry className="info-tooltip-entry">
      <InfoTooltipItem className="info-tooltip-item">{t('Left click')}</InfoTooltipItem>
      <span>{left}</span>
    </InfoTooltipEntry>
    <InfoTooltipEntry className="info-tooltip-entry">
      <InfoTooltipItem className="info-tooltip-item">{t('Right click')}</InfoTooltipItem>
      <span>{right}</span>
    </InfoTooltipEntry>
  </InfoTooltip>
))
