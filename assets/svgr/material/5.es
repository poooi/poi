import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 1200 1200" {...props}>
    <defs>
      <path id="5_svg__b" d="M600 1140L200 940l400-200 400 200z" />
      <filter
        x="-7.5%"
        y="-7.5%"
        width="115%"
        height="130%"
        filterUnits="objectBoundingBox"
        id="5_svg__a"
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
      <use fill="#000" filter="url(#5_svg__a)" xlinkHref="#5_svg__b" />
      <use fill="#FFA64A" xlinkHref="#5_svg__b" />
      <g>
        <path fill="#CA7225" d="M600 1140l400-200V360L600 560z" />
        <path fill="#FFA64A" d="M200 360v580l400 200V560z" />
        <path fill="#FFA64A" d="M200 360l400-200 400 200-400 200z" />
        <path fill="#CA7225" d="M800 160v200L600 460V260z" />
        <path
          fill="#FFA64A"
          d="M400 160v200l200 100V260zM400 160L600 60l200 100-200 100z"
        />
      </g>
    </g>
  </svg>
)

export default Icon
