import React from 'react'

export function CustomTag({ tag = 'div', className, children, ...props }) {
  props.class = className
  return React.createElement(tag, props, children)
}
