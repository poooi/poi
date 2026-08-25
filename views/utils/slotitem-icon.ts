import type * as KcsResource from 'lib/kcs-resource'

import * as remote from '@electron/remote'
import { nativeImage } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import { pathToFileURL } from 'url'
import { ROOT } from 'views/env'

const { readKcsResource, readKcsResourceOverride }: typeof KcsResource =
  remote.require('./lib/kcs-resource')

const ATLAS_CONFIG = '/kcs2/img/common/common_icon_weapon.json'
const ATLAS_IMAGE = '/kcs2/img/common/common_icon_weapon.png'
const ATLAS_FRAME = /^common_icon_weapon_id_(\d+)$/
const BUNDLED_ICON_FILE = /^(\d+)\.png$/
const BUNDLED_ICON_OFFSET = 100
const BYTES_PER_PIXEL = 4

interface SlotitemIconFrame {
  frame: { x: number; y: number; w: number; h: number }
  rotated?: boolean
}

interface SlotitemIconAtlas {
  frames: Record<string, SlotitemIconFrame>
}

export interface SlotitemIconPNG {
  readonly src: string
}

const createSlotitemIconPNG = (src: string): SlotitemIconPNG => Object.freeze({ src })

const readBundledSlotitemIcons = (): ReadonlyMap<number, SlotitemIconPNG> => {
  const iconDir = path.join(ROOT, 'assets', 'img', 'slotitem')
  const icons = new Map<number, SlotitemIconPNG>()

  try {
    for (const fileName of fs.readdirSync(iconDir)) {
      const match = BUNDLED_ICON_FILE.exec(fileName)
      if (!match) {
        continue
      }
      const iconId = Number(match[1]) - BUNDLED_ICON_OFFSET
      if (iconId >= 0) {
        icons.set(iconId, createSlotitemIconPNG(pathToFileURL(path.join(iconDir, fileName)).href))
      }
    }
  } catch (e) {
    console.warn('slotitem-icon: failed to read bundled icons', e)
  }

  return icons
}

const bundledSlotitemIcons = readBundledSlotitemIcons()
let slotitemIconMap: ReadonlyMap<number, SlotitemIconPNG> = new Map(bundledSlotitemIcons)
let initPromise: Promise<boolean> | undefined
let tmpServerIp: string | undefined
let nowServerIp: string | undefined
let revision = 0
const listeners = new Set<() => void>()

// Since 260825 there are no rotated atlas crop in game package
const restoreRotatedFrame = (image: Electron.NativeImage): Electron.NativeImage => {
  const { width, height } = image.getSize()
  const bitmap = image.toBitmap()
  const restored = Buffer.alloc(bitmap.length)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceOffset = (y * width + x) * BYTES_PER_PIXEL
      const targetX = y
      const targetY = width - x - 1
      const targetOffset = (targetY * height + targetX) * BYTES_PER_PIXEL
      bitmap.copy(restored, targetOffset, sourceOffset, sourceOffset + BYTES_PER_PIXEL)
    }
  }

  return nativeImage.createFromBitmap(restored, { width: height, height: width })
}

const parseSlotitemIconAtlas = (
  metadataBuffer: Buffer | undefined,
  imageBuffer: Buffer | undefined,
  source: string,
): ReadonlyMap<number, SlotitemIconPNG> => {
  const icons = new Map<number, SlotitemIconPNG>()
  if (!metadataBuffer || !imageBuffer) {
    return icons
  }

  try {
    const metadata: SlotitemIconAtlas = JSON.parse(metadataBuffer.toString('utf8'))
    const atlas = nativeImage.createFromBuffer(imageBuffer)

    for (const [name, sprite] of Object.entries(metadata.frames)) {
      const match = ATLAS_FRAME.exec(name)
      if (!match) {
        continue
      }

      try {
        const { x, y, w: width, h: height } = sprite.frame
        const cropped = atlas.crop({ x, y, width, height })
        const icon = sprite.rotated ? restoreRotatedFrame(cropped) : cropped
        if (!icon.isEmpty()) {
          icons.set(Number(match[1]), createSlotitemIconPNG(icon.toDataURL()))
        }
      } catch (e) {
        console.warn(`slotitem-icon: failed to parse ${source} frame ${name}`, e)
      }
    }
  } catch (e) {
    console.warn(`slotitem-icon: failed to parse ${source} atlas`, e)
  }

  return icons
}

export const getSlotitemIcon = (iconId: number): SlotitemIconPNG | undefined =>
  slotitemIconMap.get(iconId)

export const getSlotitemIconRevision = (): number => revision

export const subscribeSlotitemIconMap = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const initSlotitemIconMap = (serverIp: string): Promise<boolean> => {
  if (nowServerIp === serverIp) {
    return Promise.resolve(true)
  }
  if (initPromise) {
    if (tmpServerIp === serverIp) {
      return initPromise
    }
    return initPromise.then(() => initSlotitemIconMap(serverIp))
  }

  tmpServerIp = serverIp
  initPromise = Promise.all([
    readKcsResource(ATLAS_CONFIG, serverIp),
    readKcsResource(ATLAS_IMAGE, serverIp),
    readKcsResourceOverride(ATLAS_CONFIG),
    readKcsResourceOverride(ATLAS_IMAGE),
  ])
    .then(([metadataBuffer, imageBuffer, overrideMetadataBuffer, overrideImageBuffer]) => {
      const originalIcons = parseSlotitemIconAtlas(metadataBuffer, imageBuffer, 'original')
      const hasOverride = Boolean(overrideMetadataBuffer || overrideImageBuffer)
      const overrideIcons = hasOverride
        ? parseSlotitemIconAtlas(
            overrideMetadataBuffer ?? metadataBuffer,
            overrideImageBuffer ?? imageBuffer,
            'override',
          )
        : new Map<number, SlotitemIconPNG>()

      if (!originalIcons.size && !overrideIcons.size) {
        return false
      }

      const nextMap = new Map(bundledSlotitemIcons)
      originalIcons.forEach((icon, iconId) => nextMap.set(iconId, icon))
      overrideIcons.forEach((icon, iconId) => nextMap.set(iconId, icon))
      slotitemIconMap = nextMap
      revision++
      listeners.forEach((listener) => listener())
      nowServerIp = serverIp
      return true
    })
    .catch((e: unknown) => {
      console.warn('slotitem-icon: failed to initialize original atlas', e)
      return false
    })
    .finally(() => {
      initPromise = undefined
      tmpServerIp = undefined
    })

  return initPromise
}
