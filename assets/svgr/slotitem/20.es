import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="20_svg__b"
        d="M50 260v60l180 120h280l60-40v-40h-20v-20h20l20-40v-20h-60v20h-80V200H350v100L90 260z"
      />
      <filter
        x="-2.8%"
        y="-6.2%"
        width="111.1%"
        height="125%"
        filterUnits="objectBoundingBox"
        id="20_svg__a"
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
      <linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="20_svg__c">
        <stop stopColor="#6C7442" offset="0%" />
        <stop stopColor="#9AA55D" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#20_svg__a)" xlinkHref="#20_svg__b" />
      <use fill="#9AA55D" xlinkHref="#20_svg__b" />
      <path fill="url(#20_svg__c)" d="M350 200h60v100h-60z" />
    </g>
  </svg>
)

export default Icon
