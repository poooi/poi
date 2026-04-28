import classnames from 'classnames'
import fs from 'fs-extra'
import { memoize } from 'lodash'
import React, { memo, useEffect, useRef, useState } from 'react'

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

  useEffect(() => {
    keyRef.current = iconConfSetter.reg(setUseSVGIcon)
    return () => {
      iconConfSetter.unreg(keyRef.current)
    }
  }, [])

  const maybeIconPath = getAvailableSlotitemIconPath(slotitemId)(useSVGIcon)
  const iconPath =
    maybeIconPath ??
    (useSVGIcon ? `${ROOT}/assets/svg/slotitem/-1.svg` : `${ROOT}/assets/img/slotitem/-1.png`)

  return (
    <img alt={alt} src={`file://${iconPath}`} className={getClassName(className, useSVGIcon)} />
  )
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
