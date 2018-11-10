/**
 * By default a tooltip will try to remain inside its scroll parent,
 * if the parent dimension is too small, the tooltip will cover the overflow target's, preventing the hover status
 * this wrapper component will change preventOverflow target element to window
 */

import React from 'react'
import { Tooltip as BPTooltip } from '@blueprintjs/core'
import { merge } from 'lodash'
import memoize from 'fast-memoize'

const memoizeMerge = memoize((...args) => merge(...args))

export const Tooltip = ({ modifiers, ...props }) => (
  <BPTooltip
    {...props}
    modifiers={memoizeMerge(modifiers, {
      preventOverflow: {
        boundariesElement: 'window',
      },
    })}
  />
)

Tooltip.displayName = 'PanelTooltip'
