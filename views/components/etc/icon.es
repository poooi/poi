import fs from 'fs-extra'
import classnames from 'classnames'
import React from 'react'

const getClassName = (props, isSVG) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props.className)
}

const ICON_TYPES = {
  UNAVAILABLE: 0,
  PNG: 1,
  SVG: 2,
}

const {config, ROOT} = window

const iconCache = []

class SlotitemIcon extends React.Component {
  name = 'SlotitemIcon'
  static propTypes = {
    slotitemId: React.PropTypes.number,
  }
  svgPath = () =>
    `${ROOT}/assets/svg/slotitem/${this.props.slotitemId}.svg`
  pngPath = () =>
    `${ROOT}/assets/img/slotitem/${this.props.slotitemId + 100}.png`
  determineIconType = () => {
    if (config.get('poi.useSVGIcon', false)) {
      try {
        // accessSync can not read asar properly
        fs.statSync(this.svgPath())
        return ICON_TYPES.SVG
      } catch (e) {
        console.warn(`Icon file ${this.svgPath()} not found.`)
      }
    }
    try {
      fs.statSync(this.pngPath())
      return ICON_TYPES.PNG
    } catch (e) {
      console.warn(`Icon file ${this.pngPath()} not found.`)
    }
    return ICON_TYPES.UNAVAILABLE
  }
  render() {
    switch (iconCache[this.props.slotitemId] ? iconCache[this.props.slotitemId] : iconCache[this.props.slotitemId] = this.determineIconType()) {
    case ICON_TYPES.PNG:
      return <img src={`file://${this.pngPath()}`} className={getClassName(this.props, false)} />
    case ICON_TYPES.SVG:
      return <img src={`file://${this.svgPath()}`} className={getClassName(this.props, true)} />
    default:
      return <img className={getClassName(this.props, config.get('poi.useSVGIcon', false))} style={{visibility: 'hidden'}} />
    }
  }
}

class MaterialIcon extends React.Component {
  name: 'MaterialIcon'
  static propTypes = {
    materialId: React.PropTypes.number,
  }
  render() {
    let src = null
    if (config.get('poi.useSVGIcon', false)) {
      src = `file://${ROOT}/assets/svg/material/${this.props.materialId}.svg`
    } else {
      src = `file://${ROOT}/assets/img/material/0${this.props.materialId}.png`
    }
    return <img src={src} className={getClassName(this.props, config.get('poi.useSVGIcon', false))} />
  }
}

export {SlotitemIcon, MaterialIcon}
