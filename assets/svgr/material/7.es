import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 1200 1200" {...props}>
    <defs>
      <path id="7_svg__b" d="M600 1150L200 950l400-200 400 200z" />
      <filter
        x="-7.5%"
        y="-7.5%"
        width="115%"
        height="130%"
        filterUnits="objectBoundingBox"
        id="7_svg__a"
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
      <use fill="#000" filter="url(#7_svg__a)" xlinkHref="#7_svg__b" />
      <use fill="#58887E" xlinkHref="#7_svg__b" />
      <path fill="#465E55" d="M600 1050L400 950l200-100 200 100z" />
      <path fill="#465E55" d="M400 650v200l200 100 200-100V650L600 750z" />
      <path fill="#58887E" d="M400 650l200-100 200 100-200 100z" />
      <path fill="#58887E" d="M400 650v200l200 100V750z" />
      <g>
        <path fill="#465E55" d="M200 250v200l400 200 400-200V250L600 450z" />
        <path fill="#465E55" d="M400 250l200-100 200 100-200 100z" />
        <path
          d="M200 250L600 50l400 200-400 200-400-200zm200 0l200 100 200-100-200-100-200 100z"
          fill="#58887E"
        />
        <path
          fill="#58887E"
          d="M200 250v200l400 200V450zM600 150v200l200-100z"
        />
      </g>
    </g>
  </svg>
)

export default Icon
