import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="16_svg__b"
        d="M160 450v-60l100-120-120-120 20-20 120.736 121.445h124.342L500 350v100l-60 60H220z"
      />
      <filter
        x="-4.2%"
        y="-3.9%"
        width="116.7%"
        height="115.8%"
        filterUnits="objectBoundingBox"
        id="16_svg__a"
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
      <linearGradient
        x1="66.749%"
        y1="-21.125%"
        x2="100%"
        y2="100%"
        id="16_svg__c"
      >
        <stop stopColor="#6C7" offset="0%" />
        <stop stopColor="#5AB469" offset="81.509%" />
        <stop stopColor="#57AE65" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#16_svg__a)" xlinkHref="#16_svg__b" />
      <use fill="#6C7" xlinkHref="#16_svg__b" />
      <path fill="url(#16_svg__c)" d="M200 350h300v100H200z" />
    </g>
  </svg>
)

export default Icon
