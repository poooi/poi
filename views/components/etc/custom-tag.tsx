import React, { ReactNode, HTMLProps } from 'react'

interface CustomTagProps extends HTMLProps<HTMLElement> {
  tag?: keyof JSX.IntrinsicElements
  children?: ReactNode
}

export function CustomTag({ tag = 'div', className, children, ...props }: CustomTagProps) {
  // @ts-expect-error wrong type definition
  props.class = className
  return React.createElement(tag, props, children)
}
