import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 1200 1200" {...props}>
    <defs>
      <path id="6_svg__b" d="M600 1150L200 950l400-200 400 200z" />
      <filter
        x="-7.5%"
        y="-7.5%"
        width="115%"
        height="130%"
        filterUnits="objectBoundingBox"
        id="6_svg__a"
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
      <use fill="#000" filter="url(#6_svg__a)" xlinkHref="#6_svg__b" />
      <use fill="#5FB4C4" xlinkHref="#6_svg__b" />
      <path fill="#4C8A95" d="M600 1150l400-200V250L600 450z" />
      <path fill="#5FB4C4" d="M200 250L600 50l400 200-400 200z" />
      <path fill="#5FB4C4" d="M200 250v700l400 200V450z" />
      <path fill="#4C8A95" d="M400 260l200-100v200z" />
    </g>
  </svg>
)

export default Icon
