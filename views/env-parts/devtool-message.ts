import * as remote from '@electron/remote'
import { getStore } from 'views/create-store'

import { isMain } from './const'

if (isMain) {
  remote.getCurrentWebContents().addListener('devtools-opened', () => {
    const PLUGINS = getStore('plugins') || []
    const FCD = getStore('fcd.version') || {}

    const pluginMessage = PLUGINS.filter((plugin) => plugin.enabled)
      .map((plugin) => `${plugin.id}@${plugin.version}`)
      .join(', ')

    const fcdMessage = Object.keys(FCD)
      .map((key) => `${key}@${FCD[key]}`)
      .join(', ')

    // eslint-disable-next-line no-console
    console.log(
      `%cThis is poi@${window.POI_VERSION} on ${process.platform} ${process.arch} with Electron@${process.versions.electron},
        PLUGINS: ${pluginMessage},
        FCD: ${fcdMessage}`,
      'font-size: 120%',
    )
  })
}
