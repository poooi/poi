import type { ReactNode, FC } from 'react'

import React from 'react'

interface CustomTagProps {
  tag?: keyof JSX.IntrinsicElements
  children?: ReactNode
  className?: string
}

export const CustomTag: FC = ({ tag = 'div', className, children, ...props }: CustomTagProps) => {
  // @ts-expect-error wrong type definition
  props.class = className
  return React.createElement(tag, props, children)
}
