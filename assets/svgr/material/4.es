import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 1200 1200" {...props}>
    <defs>
      <path id="4_svg__b" d="M600 1150L200 950l400-200 400 200z" />
      <filter
        x="-7.5%"
        y="-7.5%"
        width="115%"
        height="130%"
        filterUnits="objectBoundingBox"
        id="4_svg__a"
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
      <use fill="#000" filter="url(#4_svg__a)" xlinkHref="#4_svg__b" />
      <use fill="#B18154" xlinkHref="#4_svg__b" />
      <path fill="#745636" d="M400 350v500l200 100 200-100V350L600 450z" />
      <path fill="#B18154" d="M400 350l200-100 200 100-200 100z" />
      <g>
        <path fill="#B18154" d="M200 150L400 50l200 100-200 100z" />
        <path fill="#745636" d="M200 150v800l200 100 200-100V150L400 250z" />
        <path fill="#B18154" d="M200 150v800l200 100V250z" />
      </g>
      <g>
        <path fill="#B18154" d="M600 650l200-100 200 100-200 100z" />
        <path fill="#745636" d="M600 650v300l200 100 200-100V650L800 750z" />
        <path fill="#B18154" d="M600 650v300l200 100V750z" />
      </g>
    </g>
  </svg>
)

export default Icon
