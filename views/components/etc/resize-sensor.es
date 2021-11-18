import React, { useEffect, useMemo, useState } from 'react'

export const ResizeSensor = ({ onResize, children }) => {
  const [ref, setRef] = useState()

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

  return React.cloneElement(React.Children.only(children), { ref: setRef })
}
