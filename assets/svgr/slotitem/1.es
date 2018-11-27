import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="1_svg__b"
        d="M390 180L230 300l-20 80-100 80 20 20 100-80 20 20-100 80 20 20 100-80h100l160-120v-40L430 180z"
      />
      <filter
        x="-3.6%"
        y="-4.4%"
        width="114.3%"
        height="117.6%"
        filterUnits="objectBoundingBox"
        id="1_svg__a"
      >
        <feOffset
          dx={20}
          dy={20}
          in="SourceAlpha"
          result="shadowOffsetOuter1"
        />
        <feGaussianBlur
          stdDeviation={5}
          in="shadowOffsetOuter1"
          result="shadowBlurOuter1"
        />
        <feColorMatrix
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          in="shadowBlurOuter1"
        />
      </filter>
      <linearGradient x1="22.256%" y1="0%" x2="100%" y2="0%" id="1_svg__c">
        <stop stopColor="#D15B5B" offset="0%" />
        <stop stopColor="#941818" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#1_svg__a)" xlinkHref="#1_svg__b" />
      <use fill="#D15B5B" xlinkHref="#1_svg__b" />
      <path fill="url(#1_svg__c)" d="M370 440v-40l160-120v40z" />
    </g>
  </svg>
)

export default Icon
