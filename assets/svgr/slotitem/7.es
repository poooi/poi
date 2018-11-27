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
        id="7_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="7_svg__d">
        <stop stopColor="#FF7A7A" offset="0%" />
        <stop stopColor="#ED6B6B" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zM315.18 310.28c-.44 21.12-2.64 41.14-6.16 60.06l12.32 3.52c3.96-19.8 6.16-40.7 6.6-62.7l-12.76-.88zm24.86-40.26v79.86c-.44 50.6-10.12 87.12-29.48 110L322 470c12.98-15.4 22-36.52 27.28-63.14 5.72 9.02 12.76 21.12 20.68 36.3l8.8-13.2c-9.24-14.3-18.04-27.28-26.84-38.72 1.54-12.76 2.42-26.4 2.64-41.36v-5.28c11.44-10.56 20.9-21.34 28.38-32.56l-8.8-11c-5.28 9.24-11.88 18.04-19.58 26.4v-57.42h-14.52zm52.58 4.62v57.86h22.22v13.2H384.7v11.88h30.14v14.08h-38.72v12.32h36.08c-8.14 9.02-20.46 16.5-36.74 22.66l7.7 12.76c6.6-3.08 12.54-6.6 18.26-10.34 7.04 5.28 12.76 10.56 17.16 15.4l8.58-8.58c-4.4-4.62-9.9-9.24-16.28-14.08 6.16-5.28 11.44-11.22 15.4-17.82h36.52c3.08 5.28 7.04 10.78 12.32 16.28-4.84 5.28-10.34 10.12-16.5 14.3l7.04 9.46c7.04-4.62 13.2-9.68 18.7-15.4 5.28 4.4 11.44 9.02 18.48 13.42l9.02-11.44c-16.28-7.92-27.94-16.94-35.42-26.62H509v-12.32h-33.66v-14.08h29.7V345.7h-29.7v-13.2h22.22v-57.86H392.62zm36.3 97.02v-14.08h32.56v14.08h-32.56zm32.56-25.96h-32.56v-13.2h32.56v13.2zm22-23.98h-77v-12.54h77v12.54zm-77-22.88v-12.76h77v12.76h-77zm29.7 170.94c10.34 0 15.62-5.28 15.62-15.62v-62.48h-14.96v58.96c0 4.4-1.98 6.6-5.5 6.6-4.84 0-9.68-.44-14.96-1.1l3.08 13.64h16.72zm-11.44-42.02c-12.76 7.04-27.94 13.2-45.54 18.04l5.94 13.64c17.16-5.72 31.46-12.54 42.9-20.02l-3.3-11.66zm39.82 1.54l-7.26 10.78c13.86 5.72 27.5 13.64 40.7 23.98l8.14-12.76c-12.54-8.58-26.4-15.84-41.58-22z"
        id="7_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="7_svg__b"
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
      <g filter="url(#7_svg__a)" transform="translate(20 45)" fill="#ED6B6B">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#7_svg__b)" xlinkHref="#7_svg__c" />
      <use fill="url(#7_svg__d)" xlinkHref="#7_svg__c" />
    </g>
  </svg>
)

export default Icon
