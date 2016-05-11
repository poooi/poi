{ROOT, layout, _, $, $$, React, ReactBootstrap, useSVGIcon} = window
{$slotitems} = window
path = require 'path-extra'
fs = require 'fs-extra'

getClassName = (props, isSVG) ->
  className = if isSVG then 'svg' else 'png'
  if props.className
    className += ' ' + props.className
  className

SlotitemIcon = React.createClass
  name: 'SlotitemIcon'
  render: ->
    reallyUseSVG = useSVGIcon
    iconPath = null
    if useSVGIcon
      iconPath = "#{ROOT}/assets/svg/slotitem/#{@props.slotitemId}.svg"
      try
        fs.accessSync iconPath
      catch
        reallyUseSVG = false
    if reallyUseSVG
      <img src="file://#{iconPath}" className={getClassName @props, true} />
    else
      iconPath = "#{ROOT}/assets/img/slotitem/#{@props.slotitemId + 100}.png"
      try
        fs.accessSync iconPath
        <img src="file://#{iconPath}" className={getClassName @props, false} />
      catch
        # both png and svg not found
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
