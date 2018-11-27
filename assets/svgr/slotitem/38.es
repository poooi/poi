import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-2.8%"
        y="-5.8%"
        width="111.1%"
        height="123.5%"
        filterUnits="objectBoundingBox"
        id="38_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="38_svg__d">
        <stop stopColor="#4EA915" offset="0%" />
        <stop stopColor="#267009" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-46.52 230.08v53.46h75.02v-53.46h-75.02zm64.24 43.12h-53.24v-32.78h53.24v32.78zm36.96-138.38v27.72H350.16v-27.72h124.52zm-124.52 38.94h136.18v-50.38H338.28v84.7c-.22 39.6-9.46 71.94-27.72 97.02l9.24 8.14c20.02-29.26 30.14-64.24 30.36-105.16v-1.1h135.52c-.44 47.08-1.32 75.46-2.86 85.36-1.32 7.04-5.94 10.78-14.08 10.78-8.8 0-19.14-.22-31.02-.66l2.64 10.12c14.08.44 23.98.66 29.7.66 14.3 0 22.22-5.94 23.76-17.38 2.2-12.76 3.3-46.2 3.3-99.88H350.16v-22.22z"
        id="38_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="38_svg__b"
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
      <g filter="url(#38_svg__a)" transform="translate(20 45)" fill="#267009">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#38_svg__b)" xlinkHref="#38_svg__c" />
      <use fill="url(#38_svg__d)" xlinkHref="#38_svg__c" />
    </g>
  </svg>
)

export default Icon
