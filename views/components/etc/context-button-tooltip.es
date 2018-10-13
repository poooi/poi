/**
 * Generate tooltip for buttons that supports context menu user interaction
 */
import React from 'react'
import { translate } from 'react-i18next'

export const ContextButtonTooltip = translate(['setting'])(({ left, right, t, ...props}) => (
  <div className="info-tooltip">
    <div className="info-tooltip-entry">
      <span className="info-tooltip-item">{t('Left click')}</span>
      <span>{left}</span>
    </div>
    <div className="info-tooltip-entry">
      <span className="info-tooltip-item">{t('Right click')}</span>
      <span>{right}</span>
    </div>
  </div>
))
