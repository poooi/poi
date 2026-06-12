import type { ReactNode, FC } from 'react'

import React from 'react'

interface CustomTagProps {
  tag?: keyof React.JSX.IntrinsicElements
  children?: ReactNode
  className?: string
}

export const CustomTag: FC = ({ tag = 'div', className, children, ...props }: CustomTagProps) => {
  // Custom elements take `class` instead of React's `className`
  return React.createElement<Record<string, unknown>>(tag, { ...props, class: className }, children)
}
