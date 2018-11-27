import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        d="M180 100h100l80 80v80l180 180v60l-40 40h-60L260 360h-80l-80-80V180l20-20 100 100h40v-40L160 120l20-20zm240 320v60h60v-60h-60zM300 300v40h40v-40h-40z"
        id="29_svg__b"
      />
      <filter
        x="-5.7%"
        y="-3.4%"
        width="111.4%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="29_svg__a"
      >
        <feOffset dy={20} in="SourceAlpha" result="shadowOffsetOuter1" />
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
        x1="52.347%"
        y1="0%"
        x2="52.347%"
        y2="100%"
        id="29_svg__c"
      >
        <stop stopColor="#EFE1CE" offset="0%" />
        <stop stopColor="#CDB89D" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#29_svg__a)" xlinkHref="#29_svg__b" />
      <use fill="#E3D0B7" xlinkHref="#29_svg__b" />
      <path
        d="M420 420v60h60l40 40-20 20h-60L260 360h-80l-80-80V180l20-20 100 100h40l160 160zM300 300v40h40l-40-40z"
        fill="url(#29_svg__c)"
      />
    </g>
  </svg>
)

export default Icon
