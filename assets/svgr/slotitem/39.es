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
        id="39_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="39_svg__d">
        <stop stopColor="#58DCB0" offset="0%" />
        <stop stopColor="#48B38F" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-78.64 220.18v44.44h63.36v27.5c0 5.5-2.2 8.36-6.6 8.36-7.7 0-15.84-.44-24.2-1.1l3.3 14.74h26.18c11.22 0 16.94-6.16 16.94-18.26v-31.24h60.06v-44.44H341.36zM465 407.08H356.76v-19.36H465v19.36zM337.62 274.64v62.7h58.74c2.42 3.96 4.84 8.14 7.04 12.76h-90.2v13.2h193.6v-13.2h-86.9c-1.76-4.4-3.52-8.8-5.5-12.76h68.2v-62.7H337.62zM467.2 324.8H353.02v-13.2H467.2v13.2zm-114.18-24.86v-12.76H467.2v12.76H353.02zm95.48 127.6l-6.6 12.54c21.56 6.6 42.24 15.62 62.26 27.28l5.5-14.52c-19.58-11-40.04-19.58-61.16-25.3zm-83.16-1.1c-12.76 11-31.02 20.24-55 27.94l8.8 12.98c22.88-7.92 41.58-18.26 56.1-30.8l-9.9-10.12z"
        id="39_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="39_svg__b"
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
      <g filter="url(#39_svg__a)" transform="translate(20 45)" fill="#48B38F">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#39_svg__b)" xlinkHref="#39_svg__c" />
      <use fill="url(#39_svg__d)" xlinkHref="#39_svg__c" />
    </g>
  </svg>
)

export default Icon
