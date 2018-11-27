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
        id="8_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="8_svg__d">
        <stop stopColor="#8BBDFF" offset="0%" />
        <stop stopColor="#5FAFEB" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-75.34 150.22v110c-11.22 3.08-22.66 5.5-34.1 7.7l3.74 16.06c29.04-6.6 56.1-14.96 81.18-25.08v-15.84c-11.44 4.84-23.32 9.02-35.2 12.76v-105.6h33.88v-15.4h-81.62v15.4h32.12zm76.12 11.88h51.26c-1.32 32.12-9.68 59.84-25.52 83.38-14.52-18.04-26.18-37.84-34.98-59.4 3.3-7.48 6.38-15.4 9.24-23.98zm66 0h19.14v-15.18h-80.74c2.64-10.12 4.84-20.68 6.82-31.68l-15.4-2.64c-6.6 41.14-19.14 73.92-37.84 98.34l10.12 12.1c4.84-6.16 9.68-12.98 14.08-20.46 8.8 19.8 20.02 38.28 33.88 55.44-15.4 17.6-35.86 32.12-61.6 43.56l8.58 13.86c25.74-12.32 46.64-27.72 62.92-45.98 15.18 16.72 33.22 31.9 54.12 45.76l10.56-12.1c-20.9-13.64-39.16-28.82-54.78-45.98 18.7-26.18 28.82-57.86 30.14-95.04z"
        id="8_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="8_svg__b"
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
      <g filter="url(#8_svg__a)" transform="translate(20 45)" fill="#5FAFEB">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#8_svg__b)" xlinkHref="#8_svg__c" />
      <use fill="url(#8_svg__d)" xlinkHref="#8_svg__c" />
    </g>
  </svg>
)

export default Icon
