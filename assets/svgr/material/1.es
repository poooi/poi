import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 1200 1200" {...props}>
    <defs>
      <path id="1_svg__b" d="M600 1150L200 950l400-200 400 200z" />
      <filter
        x="-7.5%"
        y="-7.5%"
        width="115%"
        height="130%"
        filterUnits="objectBoundingBox"
        id="1_svg__a"
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
      <use fill="#000" filter="url(#1_svg__a)" xlinkHref="#1_svg__b" />
      <use fill="#5B8D40" xlinkHref="#1_svg__b" />
      <path fill="#5B8D40" d="M200 550l200-100 200 100-200 100z" />
      <path fill="#497432" d="M200 550v400l200 100 200-100V550L400 650z" />
      <path fill="#5B8D40" d="M200 550v400l200 100V650z" />
      <g>
        <path fill="#5B8D40" d="M600 550l200-100 200 100-200 100z" />
        <path fill="#497432" d="M600 550v400l200 100 200-100V550L800 650z" />
        <path fill="#5B8D40" d="M600 550v400l200 100V650z" />
      </g>
      <g>
        <path fill="#497432" d="M400 150v400l200 100 200-100V150L600 250z" />
        <path fill="#5B8D40" d="M400 150v400l200 100V250z" />
        <path fill="#5B8D40" d="M400 150L600 50l200 100-200 100z" />
      </g>
    </g>
  </svg>
)

export default Icon
