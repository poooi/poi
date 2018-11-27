import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        d="M100 320l220-220h120l60 60v120L280 500H160l-60-60V320zm20 20v80l60 60h80l60-60v-80l-60-60h-80l-60 60z"
        id="17_svg__b"
      />
      <filter
        x="-3.8%"
        y="-3.7%"
        width="115%"
        height="115%"
        filterUnits="objectBoundingBox"
        id="17_svg__a"
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
        x1="75.125%"
        y1="0%"
        x2="75.125%"
        y2="74.6%"
        id="17_svg__c"
      >
        <stop stopColor="#72B8C5" offset="0%" />
        <stop stopColor="#7ECCD8" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path
        fill="#7ECCD8"
        d="M340 500h40v40h-40zM420 420h40v40h-40zM500 340h40v40h-40z"
      />
      <use fill="#000" filter="url(#17_svg__a)" xlinkHref="#17_svg__b" />
      <use fill="#7ECCD8" xlinkHref="#17_svg__b" />
      <path fill="url(#17_svg__c)" d="M260 280l60 60 180-180-60-60z" />
    </g>
  </svg>
)

export default Icon
