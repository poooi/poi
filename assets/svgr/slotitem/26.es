import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <linearGradient
        x1="40.343%"
        y1="40.925%"
        x2="60.051%"
        y2="49.886%"
        id="26_svg__c"
      >
        <stop stopColor="#A9926D" offset="0%" />
        <stop stopColor="#A4885C" offset="100%" />
      </linearGradient>
      <path
        d="M200 360v-60h-40v60h40zm0 60h-40v60h40v-60zm0-180v-60h-40v60h40zm240 240v60H120V140h40v-40h360v200h-40l-.594-140H460L240 400v80h200zm-40-320H240v180l160-180z"
        id="26_svg__b"
      />
      <filter
        x="-3.8%"
        y="-3.4%"
        width="115%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="26_svg__a"
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
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#26_svg__a)" xlinkHref="#26_svg__b" />
      <use fill="url(#26_svg__c)" xlinkHref="#26_svg__b" />
    </g>
  </svg>
)

export default Icon
