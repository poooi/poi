import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="3_svg__b"
        d="M180 360L40 480l20 19.615L200 380l20 20L80 520l20 20 140.463-119.813L260 440 120 560l20 20 140-120h100l220-200v-60L400 60l-60 40v40L200 260l-20 60z"
      />
      <filter
        x="-2.7%"
        y="-2.9%"
        width="110.7%"
        height="111.5%"
        filterUnits="objectBoundingBox"
        id="3_svg__a"
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
      <linearGradient x1="0%" y1="0%" x2="61.803%" y2="47.942%" id="3_svg__c">
        <stop stopColor="#772424" offset="0%" />
        <stop stopColor="#C22222" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#3_svg__a)" xlinkHref="#3_svg__b" />
      <use fill="#C22222" xlinkHref="#3_svg__b" />
      <path fill="url(#3_svg__c)" d="M340 100l200 140v40L340 140z" />
    </g>
  </svg>
)

export default Icon
