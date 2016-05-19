{ROOT, React, useSVGIcon} = window
path = require 'path-extra'
fs = require 'fs-extra'
classnames = require 'classnames'

getClassName = (props, isSVG) ->
  type = if isSVG then 'svg' else 'png'
  classnames type, props.className

ICON_TYPES =
  UNAVAILABLE: 0
  PNG: 1
  SVG: 2
iconCache = []

SlotitemIcon = React.createClass
  name: 'SlotitemIcon'
  svgPath: ->
    "#{ROOT}/assets/svg/slotitem/#{@props.slotitemId}.svg"
  pngPath: ->
    "#{ROOT}/assets/img/slotitem/#{@props.slotitemId + 100}.png"
  determineIconType: ->
    if useSVGIcon
      try
        # accessSync can not read asar properly
        fs.statSync @svgPath()
        return ICON_TYPES.SVG
    try
      fs.statSync @pngPath()
      return ICON_TYPES.PNG
    ICON_TYPES.UNAVAILABLE
  render: ->
    switch iconCache[@props.slotitemId] ?= @determineIconType()
      when ICON_TYPES.PNG
        <img src="file://#{@pngPath()}" className={getClassName @props, false} />
      when ICON_TYPES.SVG
        <img src="file://#{@svgPath()}" className={getClassName @props, true} />
      else
        <img className={getClassName @props, useSVGIcon} style={visibility: 'hidden'} />



MaterialIcon = React.createClass
  name: 'MaterialIcon'
  render: ->
    src = null
    if useSVGIcon
      src = "file://#{ROOT}/assets/svg/material/#{@props.materialId}.svg"
    else
      src = "file://#{ROOT}/assets/img/material/0#{@props.materialId}.png"
    <img src={src} className={getClassName @props, useSVGIcon} />

module.exports =
  SlotitemIcon: SlotitemIcon
  MaterialIcon: MaterialIcon
