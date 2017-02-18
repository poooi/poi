import fs from 'fs-extra'
import classnames from 'classnames'
import React from 'react'

const getClassName = (props, isSVG) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props)
}

const {ROOT, config} = window

const svgAvailableList = {}
const pngAvailableList = {}

class iconConf {
  constructor() {
    this.callbacks = new Map()
  }
  setConf = (val) => {
    this.callbacks.forEach((f) => f(val))
  }
  reg = (key, func) => {
    this.callbacks.set(key, func)
  }
  unreg = (key) => {
    this.callbacks.delete(key)
  }
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

export class SlotitemIcon extends React.Component {
  static propTypes = {
    slotitemId: React.PropTypes.number,
    className: React.PropTypes.string,
  }
  state = {
    useSVGIcon: config.get('poi.useSVGIcon', false),
  }
  name = 'SlotitemIcon'
  shouldComponentUpdate = (nextProps, nextState) => (
    !(nextProps.slotitemId === this.props.slotitemId &&
      nextProps.className === this.props.className &&
      nextState.useSVGIcon === this.state.useSVGIcon)
  )
  svgPath = () =>
    `${ROOT}/assets/svg/slotitem/${this.props.slotitemId}.svg`
  pngPath = () =>
    `${ROOT}/assets/img/slotitem/${this.props.slotitemId + 100}.png`
  getAvailable = () => {
    try {
      fs.statSync(this.state.useSVGIcon ? this.svgPath() : this.pngPath())
      return true
    } catch (e) {
      return false
    }
  }
  setUseSvg = (val) => {
    this.setState({
      useSVGIcon: val,
    })
  }
  componentDidMount = () => {
    this.key = `${process.hrtime()[0]}${process.hrtime()[1]}`
    iconConfSetter.reg(this.key, this.setUseSvg)
  }
  componentWillUnmount = () => {
    iconConfSetter.unreg(this.key)
  }
  render() {
    if (this.state.useSVGIcon) {
      if (typeof svgAvailableList[this.props.slotitemId] === 'undefined') {
        svgAvailableList[this.props.slotitemId] = this.getAvailable()
      }
    } else {
      if (typeof pngAvailableList[this.props.slotitemId] === 'undefined') {
        pngAvailableList[this.props.slotitemId] = this.getAvailable()
      }
    }
    if (this.state.useSVGIcon) {
      return svgAvailableList[this.props.slotitemId]
      ? <img src={`file://${this.svgPath()}`} className={getClassName(this.props.className, true)} />
      : <img src={`file://${ROOT}/assets/svg/slotitem/-1.svg`} className={getClassName(this.props.className, true)} />
    } else if (pngAvailableList[this.props.slotitemId]) {
      return <img src={`file://${this.pngPath()}`} className={getClassName(this.props.className, false)} />
    } else {
      return <img src={`file://${ROOT}/assets/img/slotitem/-1.png`} className={getClassName(this.props.className, false)} />
    }
  }
}

export class MaterialIcon extends React.Component {
  static propTypes = {
    materialId: React.PropTypes.number,
    className: React.PropTypes.string,
  }
  state = {
    useSVGIcon: config.get('poi.useSVGIcon', false),
  }
  name = 'MaterialIcon'
  shouldComponentUpdate = (nextProps, nextState) => (
    !(nextProps.materialId === this.props.materialId &&
      nextProps.className === this.props.className &&
      nextState.useSVGIcon === this.state.useSVGIcon)
  )
  setUseSvg = (val) => {
    this.setState({
      useSVGIcon: val,
    })
  }
  componentDidMount = () => {
    this.key = `${process.hrtime()[0]}${process.hrtime()[1]}`
    iconConfSetter.reg(this.key, this.setUseSvg)
  }
  componentWillUnmount = () => {
    iconConfSetter.unreg(this.key)
  }
  render() {
    let src = null
    if (this.state.useSVGIcon) {
      src = `file://${ROOT}/assets/svg/material/${this.props.materialId}.svg`
    } else {
      src = `file://${ROOT}/assets/img/material/0${this.props.materialId}.png`
    }
    return <img src={src} className={getClassName(this.props.className, this.state.useSVGIcon)} />
  }
}
