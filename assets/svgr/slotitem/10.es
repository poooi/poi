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
        id="10_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="10_svg__d">
        <stop stopColor="#B6EFBF" offset="0%" />
        <stop stopColor="#A2D3AA" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-36.62 163.64v108.02h108.68V318.64H443v-19.8h62.26v-14.3H443v-17.16h-16.06v51.26h-43.56zm93.28 95.04h-77.88V394.1h77.88v19.58zm-77.88-32.34v-17.82h77.88v17.82h-77.88zm0-30.36v-19.14h77.88v19.14h-77.88zm18.92 77.22c-13.64 11.44-30.14 21.56-49.94 30.36l9.02 11.88c20.24-9.46 37.4-20.46 51.48-33l-10.56-9.24zm41.58 0l-9.68 9.24c20.68 11.88 36.74 22.88 48.62 33.22l10.34-10.56c-13.2-10.56-29.7-21.34-49.28-31.9zm-122.1-81.18v123.42h15.84V324.8c9.9-15.62 18.04-32.34 24.42-49.94l-14.74-6.82c-11.22 33.66-29.26 63.58-54.34 89.54l4.62 15.84c8.58-8.36 16.72-17.16 24.2-26.4z"
        id="10_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="10_svg__b"
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
      <g filter="url(#10_svg__a)" transform="translate(20 45)" fill="#A2D3AA">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#10_svg__b)" xlinkHref="#10_svg__c" />
      <use fill="url(#10_svg__d)" xlinkHref="#10_svg__c" />
    </g>
  </svg>
)

export default Icon
