import fs from 'fs-extra'
import classnames from 'classnames'
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { memoize } from 'lodash'

const getClassName = (props, isSVG) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props)
}

const {ROOT, config} = window

class iconConf {
  constructor() {
    this.callbacks = new Map()
    this.unassignedKey = 1
  }

  setConf = val =>
    this.callbacks.forEach(f => f(val))

  reg = func => {
    const key = this.unassignedKey
    ++this.unassignedKey
    this.callbacks.set(key, func)
    return key
  }

  unreg = key =>
    this.callbacks.delete(key)
}

const iconConfSetter = new iconConf()

const setIcon = (path, val) => {
  if (path === 'poi.useSVGIcon') {
    iconConfSetter.setConf(val)
  }
}

config.addListener('config.set', setIcon)

window.addEventListener('unload', (e) => {
  config.removeListener('config.set', setIcon)
})

/*
   getAvailableSlotitemIconPath(slotitemId : int)(useSVGIcon : bool) : string | null

   check availability of a slotitem path, return the path if it's available, or null if not.
 */
const getAvailableSlotitemIconPath = memoize(slotitemId =>
  memoize(useSVGIcon => {
    try {
      const path =
        useSVGIcon ?
          /* SVG path */
          `${ROOT}/assets/svg/slotitem/${slotitemId}.svg` :
          /* PNG path */
          `${ROOT}/assets/img/slotitem/${slotitemId + 100}.png`

      fs.statSync(path)
      return path
    } catch (_e) {
      return null
    }
  })
)

export class SlotitemIcon extends PureComponent {
  static propTypes = {
    slotitemId: PropTypes.number,
    className: PropTypes.string,
    alt: PropTypes.string,
  }

  state = {
    useSVGIcon: config.get('poi.useSVGIcon', false),
  }

  name = 'SlotitemIcon'

  setUseSvg = useSVGIcon =>
    this.setState({useSVGIcon})

  componentDidMount = () => {
    this.key = iconConfSetter.reg(this.setUseSvg)
  }

  componentWillUnmount = () =>
    iconConfSetter.unreg(this.key)

  render() {
    const { alt, slotitemId, className } = this.props
    const { useSVGIcon } = this.state
    const maybeIconPath = getAvailableSlotitemIconPath(slotitemId)(useSVGIcon)
    const path = maybeIconPath || (
      /* icon path not available, using fallback img */
      useSVGIcon ?
        `${ROOT}/assets/svg/slotitem/-1.svg` :
        `${ROOT}/assets/img/slotitem/-1.png`
    )

    return (
      <img
        alt={alt}
        src={`file://${path}`}
        className={getClassName(className, useSVGIcon)}
      />
    )
  }
}

export class MaterialIcon extends PureComponent {
  static propTypes = {
    materialId: PropTypes.number,
    className: PropTypes.string,
    alt: PropTypes.string,
  }

  state = {
    useSVGIcon: config.get('poi.useSVGIcon', false),
  }

  name = 'MaterialIcon'

  setUseSvg = useSVGIcon =>
    this.setState({useSVGIcon})

  componentDidMount = () => {
    this.key = iconConfSetter.reg(this.setUseSvg)
  }

  componentWillUnmount = () =>
    iconConfSetter.unreg(this.key)

  render() {
    const { className, alt } = this.props
    const { useSVGIcon } = this.state
    return (
      <img
        alt={alt}
        src={(
          useSVGIcon ?
            /* SVG URI */ `file://${ROOT}/assets/svg/material/${this.props.materialId}.svg` :
            /* PNG URI */ `file://${ROOT}/assets/img/material/0${this.props.materialId}.png`
        )}
        className={getClassName(className, useSVGIcon)}
      />
    )
  }
}
