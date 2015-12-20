{ROOT, layout, _, $, $$, React, ReactBootstrap, useSVGIcon} = window
{$slotitems} = window
path = require 'path-extra'

SlotitemIcon = React.createClass
  name: 'SlotitemIcon'
  render: ->
    if useSVGIcon
      <img src="file://#{ROOT}/assets/svg/slotitem/#{@props.slotitemId}.svg" className="#{@props.className} svg" />
    else
      <img src="file://#{ROOT}/assets/img/slotitem/#{@props.slotitemId + 100}.png" className="#{@props.className} png" />

MaterialIcon = React.createClass
  name: 'MaterialIcon'
  render: ->
    if useSVGIcon
      <img src="file://#{ROOT}/assets/svg/material/#{@props.materialId}.svg" className="#{@props.className} svg" />
    else
      <img src="file://#{ROOT}/assets/img/material/0#{@props.materialId}.png" className="#{@props.className} png" />

module.exports =
  SlotitemIcon: SlotitemIcon
  MaterialIcon: MaterialIcon
