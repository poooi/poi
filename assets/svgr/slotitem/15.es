import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="15_svg__b"
        d="M380 220l-80 80L80 140l-20 20 220 160v20l-40 40v40l60 60v20h200v-20l60-40V340l20-20v-40l-80-60z"
      />
      <filter
        x="-2.9%"
        y="-4.2%"
        width="111.5%"
        height="116.7%"
        filterUnits="objectBoundingBox"
        id="15_svg__a"
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
      <linearGradient x1="100%" y1="100%" x2="0%" y2="100%" id="15_svg__c">
        <stop stopColor="#6C7" offset="1.16%" />
        <stop stopColor="#5EB76D" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#15_svg__a)" xlinkHref="#15_svg__b" />
      <use fill="#6C7" xlinkHref="#15_svg__b" />
      <path
        fill="url(#15_svg__c)"
        d="M240 380h220v40H240zM280 320h220v20H280zM300 480h140v20H300z"
      />
    </g>
  </svg>
)

export default Icon
