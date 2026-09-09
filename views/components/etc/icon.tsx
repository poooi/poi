import type { IconSet } from 'lib/icon-set'

import classnames from 'classnames'
import fs from 'fs-extra'
import { memoize } from 'lodash'
import React, { memo, useSyncExternalStore } from 'react'
import { pathToFileURL } from 'url'
import { getStore, store } from 'views/create-store'
import { ROOT } from 'views/env'
import {
  getSlotitemIcon,
  getSlotitemIconRevision,
  initSlotitemIconMap,
  subscribeSlotitemIconMap,
} from 'views/utils/slotitem-icon'

let slotitemIconServerIp: string | undefined

const initializeSlotitemIcons = () => {
  // Only the game equipment set needs a server atlas fetch and crop. Resource
  // preferences do not trigger equipment work.
  if (config.get('poi.appearance.equipmentIcons') !== 'game') {
    return
  }

  const serverIp = getStore('info.server.ip')
  if (!serverIp || serverIp === slotitemIconServerIp) {
    return
  }

  slotitemIconServerIp = serverIp
  void initSlotitemIconMap(serverIp)
}

store.subscribe(initializeSlotitemIcons)
initializeSlotitemIcons()

const getClassName = (props: string | undefined, isSVG: boolean) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props)
}

type IconSetting = 'poi.appearance.equipmentIcons' | 'poi.appearance.resourceIcons'

const subscribeIcons = (onChange: () => void) => {
  const listener = (path: string) => {
    if (path === 'poi.appearance.equipmentIcons') initializeSlotitemIcons()
    if (path === 'poi.appearance.equipmentIcons' || path === 'poi.appearance.resourceIcons')
      onChange()
  }
  config.addListener('config.set', listener)
  config.addListener('config.delete', listener)
  return () => {
    config.removeListener('config.set', listener)
    config.removeListener('config.delete', listener)
  }
}

const useIconSet = (setting: IconSetting) =>
  useSyncExternalStore(
    subscribeIcons,
    () => config.get(setting),
    () => config.get(setting),
  )

const availableFile = memoize((iconPath: string) => fs.existsSync(iconPath))

const getSVGPath = (category: 'slotitem' | 'material', id: number, iconSet: IconSet) => {
  if (iconSet === 'game') return undefined
  const classic = `${ROOT}/assets/svg/${category}/${id}.svg`
  const reconstructed = `${ROOT}/assets/svg/reconstructed/${category}/${id}.svg`
  if (iconSet === 'reconstructed' && availableFile(reconstructed)) return reconstructed
  return availableFile(classic) ? classic : undefined
}

interface SlotitemIconProps {
  slotitemId?: number
  className?: string
  alt?: string
}

export const SlotitemIcon = memo(({ alt, slotitemId = 0, className }: SlotitemIconProps) => {
  const iconSet = useIconSet('poi.appearance.equipmentIcons')
  useSyncExternalStore(subscribeSlotitemIconMap, getSlotitemIconRevision, getSlotitemIconRevision)
  const svgPath = getSVGPath('slotitem', slotitemId, iconSet)
  const src = svgPath
    ? pathToFileURL(svgPath).href
    : (getSlotitemIcon(slotitemId)?.src ?? pathToFileURL(`${ROOT}/assets/img/slotitem/-1.png`).href)
  return (
    <img
      alt={alt}
      src={src}
      className={classnames(getClassName(className, Boolean(svgPath)), {
        reconstructed: svgPath?.includes('/reconstructed/'),
      })}
    />
  )
})
SlotitemIcon.displayName = 'SlotitemIcon'

interface MaterialIconProps {
  materialId?: number
  className?: string
  alt?: string
}

export const MaterialIcon = memo(({ className, alt, materialId = 0 }: MaterialIconProps) => {
  const iconSet = useIconSet('poi.appearance.resourceIcons')
  const svgPath = getSVGPath('material', materialId, iconSet)
  return (
    <img
      alt={alt}
      src={pathToFileURL(svgPath ?? `${ROOT}/assets/img/material/0${materialId}.png`).href}
      className={getClassName(className, Boolean(svgPath))}
    />
  )
})
MaterialIcon.displayName = 'MaterialIcon'
