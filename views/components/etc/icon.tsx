import type * as KcsResource from 'lib/kcs-resource'

import * as remote from '@electron/remote'
import classnames from 'classnames'
import { nativeImage } from 'electron'
import fs from 'fs-extra'
import { memoize } from 'lodash'
import React, { memo, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getStore, store } from 'views/create-store'
import { ROOT } from 'views/env'

const { readKcsResource }: typeof KcsResource = remote.require('./lib/kcs-resource')

const SLOTITEM_ICON_ATLAS_CONFIG = '/kcs2/img/common/common_icon_weapon.json'
const SLOTITEM_ICON_ATLAS_IMAGE = '/kcs2/img/common/common_icon_weapon.png'
const SLOTITEM_ICON_FRAME = /^common_icon_weapon_id_(\d+)$/

interface SlotitemIconFrame {
  frame: { x: number; y: number; w: number; h: number }
  rotated?: boolean
}

interface SlotitemIconAtlas {
  frames: Record<string, SlotitemIconFrame>
}

let slotitemIconMap = new Map<number, string>()
let slotitemIconInitPromise: Promise<boolean> | undefined
let slotitemIconMapReady = false
let slotitemIconRevision = 0
const slotitemIconListeners = new Set<() => void>()

const subscribeSlotitemIconMap = (listener: () => void) => {
  slotitemIconListeners.add(listener)
  return () => slotitemIconListeners.delete(listener)
}

const getSlotitemIconRevision = () => slotitemIconRevision

const initSlotitemIconMap = (serverIp: string): Promise<boolean> => {
  if (slotitemIconMapReady) {
    return Promise.resolve(true)
  }
  if (slotitemIconInitPromise) {
    return slotitemIconInitPromise
  }

  slotitemIconInitPromise = Promise.all([
    readKcsResource(SLOTITEM_ICON_ATLAS_CONFIG, serverIp),
    readKcsResource(SLOTITEM_ICON_ATLAS_IMAGE, serverIp),
  ])
    .then(([metadataBuffer, imageBuffer]) => {
      if (!metadataBuffer || !imageBuffer) {
        return false
      }

      const metadata: SlotitemIconAtlas = JSON.parse(metadataBuffer.toString('utf8'))
      const atlas = nativeImage.createFromBuffer(imageBuffer)
      const nextMap = new Map<number, string>()

      for (const [name, sprite] of Object.entries(metadata.frames)) {
        const match = SLOTITEM_ICON_FRAME.exec(name)
        if (!match || sprite.rotated) {
          continue
        }
        const { x, y, w: width, h: height } = sprite.frame
        const icon = atlas.crop({ x, y, width, height })
        if (!icon.isEmpty()) {
          nextMap.set(Number(match[1]), icon.toDataURL())
        }
      }

      if (!nextMap.size) {
        return false
      }

      slotitemIconMap = nextMap
      slotitemIconMapReady = true
      slotitemIconRevision++
      slotitemIconListeners.forEach((listener) => listener())
      return true
    })
    .catch((e: unknown) => {
      console.warn('slotitem-icon: failed to initialize original atlas', e)
      return false
    })
    .finally(() => {
      slotitemIconInitPromise = undefined
    })

  return slotitemIconInitPromise
}

const getClassName = (props: string | undefined, isSVG: boolean) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props)
}

class IconConf {
  private callbacks = new Map<number, (val: boolean) => void>()
  private unassignedKey = 1

  setConf = (val: boolean) => this.callbacks.forEach((f) => f(val))

  reg = (func: (val: boolean) => void): number => {
    const key = this.unassignedKey
    ++this.unassignedKey
    this.callbacks.set(key, func)
    return key
  }

  unreg = (key: number) => this.callbacks.delete(key)
}

const iconConfSetter = new IconConf()

const setIcon = (path: string, val: unknown) => {
  if (path === 'poi.appearance.svgicon' && typeof val === 'boolean') {
    iconConfSetter.setConf(val)
  }
}

config.addListener('config.set', setIcon)

window.addEventListener('unload', () => {
  config.removeListener('config.set', setIcon)
})

const getAvailableSlotitemIconPath = memoize((slotitemId: number) =>
  memoize((useSVGIcon: boolean) => {
    try {
      const iconPath = useSVGIcon
        ? `${ROOT}/assets/svg/slotitem/${slotitemId}.svg`
        : `${ROOT}/assets/img/slotitem/${slotitemId + 100}.png`
      fs.statSync(iconPath)
      return iconPath
    } catch (_e) {
      return null
    }
  }),
)

interface SlotitemIconProps {
  slotitemId?: number
  className?: string
  alt?: string
}

export const SlotitemIcon = memo(({ alt, slotitemId = 0, className }: SlotitemIconProps) => {
  const [useSVGIcon, setUseSVGIcon] = useState(() => config.get('poi.appearance.svgicon', false))
  const keyRef = useRef(0)
  const serverIp = useSyncExternalStore(
    store.subscribe,
    () => getStore('info.server.ip'),
    () => getStore('info.server.ip'),
  )

  useSyncExternalStore(subscribeSlotitemIconMap, getSlotitemIconRevision, getSlotitemIconRevision)

  useEffect(() => {
    keyRef.current = iconConfSetter.reg(setUseSVGIcon)
    return () => {
      iconConfSetter.unreg(keyRef.current)
    }
  }, [])

  useEffect(() => {
    if (!useSVGIcon && serverIp) {
      void initSlotitemIconMap(serverIp)
    }
  }, [serverIp, useSVGIcon])

  const maybeIconPath = getAvailableSlotitemIconPath(slotitemId)(useSVGIcon)
  const iconPath =
    maybeIconPath ??
    (useSVGIcon ? `${ROOT}/assets/svg/slotitem/-1.svg` : `${ROOT}/assets/img/slotitem/-1.png`)

  const src = useSVGIcon
    ? `file://${iconPath}`
    : (slotitemIconMap.get(slotitemId) ?? `file://${iconPath}`)

  return <img alt={alt} src={src} className={getClassName(className, useSVGIcon)} />
})
SlotitemIcon.displayName = 'SlotitemIcon'

interface MaterialIconProps {
  materialId?: number
  className?: string
  alt?: string
}

export const MaterialIcon = memo(({ className, alt, materialId = 0 }: MaterialIconProps) => {
  const [useSVGIcon, setUseSVGIcon] = useState(() => config.get('poi.appearance.svgicon', false))
  const keyRef = useRef(0)

  useEffect(() => {
    keyRef.current = iconConfSetter.reg(setUseSVGIcon)
    return () => {
      iconConfSetter.unreg(keyRef.current)
    }
  }, [])

  return (
    <img
      alt={alt}
      src={
        useSVGIcon
          ? `file://${ROOT}/assets/svg/material/${materialId}.svg`
          : `file://${ROOT}/assets/img/material/0${materialId}.png`
      }
      className={getClassName(className, useSVGIcon)}
    />
  )
})
MaterialIcon.displayName = 'MaterialIcon'
