import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="2_svg__b"
        d="M310 140l-.496 40L189.25 280v100.187L50 500l20 20 140-120 20 20L90 540l20 20 140-120 120 20 220.04-180v-60L390 80z"
      />
      <filter
        x="-2.8%"
        y="-3.1%"
        width="111.1%"
        height="112.5%"
        filterUnits="objectBoundingBox"
        id="2_svg__a"
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
      <linearGradient x1="0%" y1="0%" x2="61.803%" y2="47.942%" id="2_svg__c">
        <stop stopColor="#6D2020" offset="0%" />
        <stop stopColor="#CC3D3D" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#2_svg__a)" xlinkHref="#2_svg__b" />
      <use fill="#CC3D3D" xlinkHref="#2_svg__b" />
      <path fill="url(#2_svg__c)" d="M310 140l200 140v40L310 180z" />
    </g>
  </svg>
)

export default Icon
