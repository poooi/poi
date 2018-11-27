import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <linearGradient
        x1="88.244%"
        y1="100%"
        x2="88.244%"
        y2="60.729%"
        id="34_svg__c"
      >
        <stop stopColor="#E9E9E9" offset="0%" />
        <stop stopColor="#F5F5F5" offset="100%" />
      </linearGradient>
      <path
        id="34_svg__b"
        d="M279.732 120L80 399.998v60.404L140 520h360l59.732-60v-60.002L359.732 120z"
      />
      <filter
        x="-3.1%"
        y="-3.8%"
        width="112.5%"
        height="115%"
        filterUnits="objectBoundingBox"
        id="34_svg__a"
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
      <path
        fill="#F3F3F3"
        d="M279.732 120L80 399.998v60.404L140 520h360l59.732-60v-60.002L359.732 120z"
      />
      <use fill="#000" filter="url(#34_svg__a)" xlinkHref="#34_svg__b" />
      <use fill="url(#34_svg__c)" xlinkHref="#34_svg__b" />
      <path fill="#494949" d="M260 380h120v140H260z" />
    </g>
  </svg>
)

export default Icon
