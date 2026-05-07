import type { Plugin } from 'views/services/plugin-manager'

type SwitchPluginPath = string | { path: string; valid?: () => boolean }

import { useCallback, useEffect, useRef } from 'react'
import { config } from 'views/env'

interface UseAutoSwitchOptions {
  plugins: Plugin[]
  selectTab: (key: string, autoSwitch?: boolean) => void
}

/**
 * Returns a handler for `game.response` events that auto-switches
 * to the relevant tab based on the API path.
 */
export const useAutoSwitch = ({ plugins, selectTab }: UseAutoSwitchOptions) => {
  const handleResponseImpl = useCallback(
    (e: Event): void => {
      if (!(e instanceof CustomEvent)) return
      const detail: { path: string } = e.detail
      if (!config.get('poi.autoswitch.enabled', true)) return

      let toSwitch: string | undefined

      if (config.get('poi.autoswitch.main', true)) {
        if (
          [
            '/kcsapi/api_port/port',
            '/kcsapi/api_get_member/ndock',
            '/kcsapi/api_get_member/kdock',
            '/kcsapi/api_get_member/questlist',
          ].includes(detail.path)
        ) {
          toSwitch = 'main-view'
        }
        if (['/kcsapi/api_get_member/preset_deck'].includes(detail.path)) {
          toSwitch = 'ship-view'
        }
      }

      for (const plugin of plugins) {
        if (!plugin.enabled) continue
        for (const switchPath of (plugin.switchPluginPath ?? []) as SwitchPluginPath[]) {
          const pathMatches =
            switchPath === detail.path ||
            (typeof switchPath === 'object' &&
              switchPath.path === detail.path &&
              switchPath.valid?.())
          if (config.get(`poi.autoswitch.${plugin.id}`, true) && pathMatches) {
            toSwitch = plugin.id
          }
        }
      }

      selectTab(toSwitch ?? '', true)
    },
    [plugins, selectTab],
  )

  // Keep a ref so the stable `handleResponse` below always calls the latest
  // implementation even though the parent effect registers it only once.
  const handleResponseRef = useRef(handleResponseImpl)
  useEffect(() => {
    handleResponseRef.current = handleResponseImpl
  }, [handleResponseImpl])

  const handleResponse = useCallback((e: Event) => {
    handleResponseRef.current(e)
  }, [])

  return { handleResponse }
}
