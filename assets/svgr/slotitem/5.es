import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="5_svg__b"
        d="M180 210v80L20 350v40l20 20h20v20l20 20h19.858l.142 20 20 20h40l160-80 40 20h60l140-120 20-40 40-20v-22.516L520 170l-40 20-120-40z"
      />
      <filter
        x="-2.5%"
        y="-4.4%"
        width="110%"
        height="117.6%"
        filterUnits="objectBoundingBox"
        id="5_svg__a"
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
      <linearGradient x1="63.911%" y1="33.306%" x2="0%" y2="0%" id="5_svg__c">
        <stop stopColor="#5785A9" offset="0%" />
        <stop stopColor="#3A5A74" offset="100%" />
      </linearGradient>
      <linearGradient
        x1="31.93%"
        y1="22.957%"
        x2="29.698%"
        y2="39.586%"
        id="5_svg__d"
      >
        <stop stopColor="#436783" offset="0%" />
        <stop stopColor="#5785A9" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#5_svg__a)" xlinkHref="#5_svg__b" />
      <use fill="#5785A9" xlinkHref="#5_svg__b" />
      <path fill="url(#5_svg__c)" d="M180 210v80l180 140V330z" />
      <path fill="url(#5_svg__d)" d="M360 150l140 80 80 20-100-60z" />
    </g>
  </svg>
)

export default Icon
