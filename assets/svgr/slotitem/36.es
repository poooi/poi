import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-2.8%"
        y="-5.4%"
        width="111.1%"
        height="121.4%"
        filterUnits="objectBoundingBox"
        id="36_svg__a"
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
          result="shadowMatrixOuter1"
        />
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient x1="0%" y1="0%" x2="34.567%" y2="100%" id="36_svg__b">
        <stop stopColor="#747D45" offset="0%" />
        <stop stopColor="#9AA55D" offset="100%" />
      </linearGradient>
      <linearGradient x1="0%" y1="0%" x2="25.414%" y2="59.814%" id="36_svg__c">
        <stop stopColor="#747D45" offset="0%" />
        <stop stopColor="#7F894C" offset="45.062%" />
        <stop stopColor="#9AA55D" offset="100%" />
      </linearGradient>
      <linearGradient
        x1="73.951%"
        y1="-43.132%"
        x2="79.533%"
        y2="184.492%"
        id="36_svg__d"
      >
        <stop stopColor="#9AA55D" offset="0%" />
        <stop stopColor="#757E46" offset="100%" />
      </linearGradient>
    </defs>
    <g
      filter="url(#36_svg__a)"
      transform="translate(50 180)"
      fill="none"
      fillRule="evenodd"
    >
      <path
        fill="#9AA55D"
        d="M540 100v80l-140 60v20l-20 20H60l-20-20v-20L0 180V80h60V20h60v60h40V0h100v100z"
      />
      <path fill="#9AA55D" d="M240 40h200v20H240z" />
      <path fill="url(#36_svg__b)" d="M60 20h60v60H60z" />
      <path fill="url(#36_svg__c)" d="M160 0h100v100H160z" />
      <path fill="url(#36_svg__d)" d="M0 180l40 60h360l140-60z" />
    </g>
  </svg>
)

export default Icon
