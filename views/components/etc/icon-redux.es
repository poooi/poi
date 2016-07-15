import fs from 'fs-extra'
import classnames from 'classnames'
import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'

const getClassName = (props, isSVG) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props)
}

const confGet = (target, path, value) =>
  ((typeof get(target, path) === "undefined") ? value : get(target, path))

const {ROOT} = window

const svgAvailableList = {}
const pngAvailableList = {}

export const SlotitemIcon = connect((state, props) => ({
  useSVGIcon: confGet(state, 'config.poi.useSVGIcon', false),
  slotitemId: props.slotitemId,
  className: props.className,
}))(class slotitemIcon extends React.Component {
  static propTypes = {
    useSVGIcon: React.PropTypes.bool,
    slotitemId: React.PropTypes.number,
    className: React.PropTypes.string,
  }
  name = 'SlotitemIcon'
  svgPath = () =>
    `${ROOT}/assets/svg/slotitem/${this.props.slotitemId}.svg`
  pngPath = () =>
    `${ROOT}/assets/img/slotitem/${this.props.slotitemId + 100}.png`
  getAvailable = () => {
    try {
      fs.statSync(this.props.useSVGIcon ? this.svgPath() : this.pngPath())
      return true
    } catch (e) {
      return false
    }
  }
  render() {
    if (this.props.useSVGIcon) {
      if (typeof svgAvailableList[this.props.slotitemId] === 'undefined') {
        svgAvailableList[this.props.slotitemId] = this.getAvailable()
      }
    } else {
      if (typeof pngAvailableList[this.props.slotitemId] === 'undefined') {
        pngAvailableList[this.props.slotitemId] = this.getAvailable()
      }
    }
    if (this.props.useSVGIcon && svgAvailableList[this.props.slotitemId]) {
      return <img src={`file://${this.svgPath()}`} className={getClassName(this.props.className, true)} />
    } else if (pngAvailableList[this.props.slotitemId]) {
      return <img src={`file://${this.pngPath()}`} className={getClassName(this.props.className, false)} />
    } else {
      return <img className={getClassName(this.props.className, this.props.useSVGIcon)} style={{visibility: 'hidden'}} />
    }
  }
})

export const MaterialIcon = connect((state, props) => ({
  useSVGIcon: confGet(state, 'config.poi.useSVGIcon', false),
  materialId: props.materialId,
  className: props.className,
}))(class materialIcon extends React.Component {
  static propTypes = {
    useSVGIcon: React.PropTypes.bool,
    materialId: React.PropTypes.number,
    className: React.PropTypes.string,
  }
  name = 'MaterialIcon'
  render() {
    let src = null
    if (this.props.useSVGIcon) {
      src = `file://${ROOT}/assets/svg/material/${this.props.materialId}.svg`
    } else {
      src = `file://${ROOT}/assets/img/material/0${this.props.materialId}.png`
    }
    return <img src={src} className={getClassName(this.props.className, this.props.useSVGIcon)} />
  }
})
