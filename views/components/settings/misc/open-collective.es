import React from 'react'
import { createSelector } from 'reselect'
import { connect } from 'react-redux'
import { range } from 'lodash'

import {
  layoutSelector,
  configLayoutSelector,
  configZoomLevelSelector,
  configDoubleTabbedSelector,
} from 'views/utils/selectors'

const ceil = x => Math.ceil(x / 50) * 50

const openCollectiveWidthWidthSelector = createSelector(
  [
    layoutSelector,
    configLayoutSelector,
    configDoubleTabbedSelector,
    configZoomLevelSelector,
  ], ({ webview, window }, layout, doubleTabbed, zoomLevel) => {
    if (layout === 'horizontal') {
      if (doubleTabbed) {
        return ceil(((window.width - webview.width) / zoomLevel) - 40)
      }
      return ceil(((window.width - webview.width) / zoomLevel) - 40)
    }
    if (doubleTabbed) {
      return ceil(((window.width / 2) / zoomLevel) - 40)
    }
    return ceil((window.width / zoomLevel) -40)
  }
)

export const OpenCollective = connect(state => ({
  width: openCollectiveWidthWidthSelector(state),
}))(({ width }) => (
  <>
    <div>
      {
        range(10).map(i => (
          <a
            href={`https://opencollective.com/poi/sponsor/${i}/website`}
            key={i}
          >
            <img src={`https://opencollective.com/poi/sponsor/${i}/avatar.svg`} />
          </a>
        ))
      }
    </div>
    <div>
      <a href="https://opencollective.com/poi#backers">
        <img src={`https://opencollective.com/poi/backers.svg?width=${width}`} />
      </a>
    </div>
  </>
))
