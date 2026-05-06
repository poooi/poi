import React, { useEffect, useMemo, useState } from 'react'

interface ResizeSensorProps {
  onResize: ResizeObserverCallback
  children: React.ReactElement
}

export const ResizeSensor: React.FC<ResizeSensorProps> = ({ onResize, children }) => {
  const [ref, setRef] = useState<HTMLElement | null>(null)

  const observer = useMemo(() => new ResizeObserver(onResize), [onResize])

  useEffect(() => {
    if (ref) {
      observer.observe(ref)
    }
    return () => {
      if (ref) {
        observer.unobserve(ref)
      }
    }
  }, [ref, observer])

  return React.cloneElement(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    React.Children.only(children) as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>,
    { ref: setRef },
  )
}
