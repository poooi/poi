import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 1200 1200" {...props}>
    <defs>
      <path id="10_svg__b" d="M600 1070L280 910l320-160 320 160z" />
      <filter
        x="-9.4%"
        y="-9.4%"
        width="118.8%"
        height="137.5%"
        filterUnits="objectBoundingBox"
        id="10_svg__a"
      >
        <feMorphology
          radius={5}
          operator="dilate"
          in="SourceAlpha"
          result="shadowSpreadOuter1"
        />
        <feOffset dy={30} in="shadowSpreadOuter1" result="shadowOffsetOuter1" />
        <feGaussianBlur
          stdDeviation={10}
          in="shadowOffsetOuter1"
          result="shadowBlurOuter1"
        />
        <feColorMatrix
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          in="shadowBlurOuter1"
        />
      </filter>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#10_svg__a)" xlinkHref="#10_svg__b" />
      <use fill="#E1B029" xlinkHref="#10_svg__b" />
      <path fill="#AF881F" d="M600 750L280 590l320-160z" />
      <path fill="#8D6D18" d="M600 750l320-160-320-160z" />
      <path fill="#AF881F" d="M600 750v320l320-160V590z" />
      <path fill="#CA9D23" d="M600 750v320L280 910V590z" />
      <g>
        <path fill="#AF881F" d="M600 490v100l320-160V330z" />
        <path fill="#CA9D23" d="M600 490v100L280 430V330z" />
        <path fill="#E1B029" d="M600 490L280 330l320-160 320 160z" />
      </g>
    </g>
  </svg>
)

export default Icon
