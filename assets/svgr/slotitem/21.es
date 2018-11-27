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
        id="21_svg__a"
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
      <linearGradient x1="2.376%" y1="50%" x2="50%" y2="100%" id="21_svg__d">
        <stop stopColor="#6CD37D" offset="0%" />
        <stop stopColor="#57A965" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-1.64 135.92l-84.48 81.62v-81.62h-18.04V448h18.04v-55l24.42-23.1 69.3 78.1h24.2l-80.96-89.76 71.06-67.32h-23.54zm96.58 40.26c-13.64 0-24.42 2.64-32.78 7.92-9.24 5.72-15.18 14.74-17.6 26.62l17.38 1.32c1.76-7.26 5.5-12.76 11.44-16.28 5.28-3.52 12.1-5.06 20.46-5.06 19.8 0 29.7 9.46 29.7 28.6v5.94l-27.28.44c-17.16.22-30.36 3.52-39.6 9.68-10.56 6.6-15.62 16.28-15.62 29.26 0 9.24 3.52 16.94 10.56 22.88 6.82 5.72 15.84 8.58 27.28 8.58 10.56 0 20.02-2.42 28.38-7.04 7.04-3.96 12.98-9.02 17.38-15.18V448h16.5v-73.04c0-13.2-3.52-23.54-10.12-31.02-7.92-8.58-19.8-12.76-36.08-12.76zm28.6 62.26v9.68c0 8.8-4.18 16.72-12.32 23.54-8.36 7.04-17.82 10.56-28.6 10.56-7.04 0-12.76-1.76-17.16-5.06-4.4-3.52-6.38-7.7-6.38-12.98 0-16.5 12.76-24.86 38.28-25.3l26.18-.44z"
        id="21_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="21_svg__b"
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
      <g filter="url(#21_svg__a)" transform="translate(20 45)" fill="#57A965">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#21_svg__b)" xlinkHref="#21_svg__c" />
      <use fill="url(#21_svg__d)" xlinkHref="#21_svg__c" />
    </g>
  </svg>
)

export default Icon
