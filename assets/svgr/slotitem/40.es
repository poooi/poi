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
        id="40_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="40_svg__d">
        <stop stopColor="#58DCB0" offset="0%" />
        <stop stopColor="#48B38F" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-66.32 210.94c4.84 7.92 10.78 18.26 17.6 31.02l8.58-13.2c-8.8-12.76-17.6-23.98-26.18-34.1v-23.1h20.9v-15.18h-20.9v-42.46h-14.52v42.46H312.1v15.18h26.4c-5.72 28.6-15.4 53.9-28.82 76.34l6.82 17.16c9.24-16.94 16.72-35.64 22.66-56.32v105.6h14.52v-103.4zM484.36 468.9c11.44 0 17.16-5.94 17.16-17.82v-87.56H385.36v106.04h14.52V377.6h87.34V448c0 5.28-2.42 7.92-7.26 7.92l-14.74-.66 3.74 13.64h15.4zm-67.32-56.76v40.48h53.68v-40.48h-53.68zm42.02 29.48H428.7v-18.26h30.36v18.26zm-38.94-152.68l-8.58 8.36c6.6 4.4 12.76 8.58 18.04 12.76h-48.62v12.32h46.2c-13.2 9.9-33 18.26-59.4 24.86l7.26 11.66c30.8-9.68 53.02-22 67.1-36.52h3.52v16.94c0 3.96-2.42 5.94-7.26 5.94-3.74 0-7.7-.44-11.66-1.1l2.86 12.32h13.2c11 0 16.72-4.84 16.72-14.08v-20.02h29.92c-3.96 7.26-8.8 13.86-14.74 20.02l13.86 3.96c7.04-9.24 12.76-18.48 17.16-27.94v-8.36h-42.02c10.12-7.04 19.14-14.52 27.5-22.88v-11.66H391.3v12.98h80.52c-8.58 7.92-17.38 14.74-26.18 20.46-7.04-6.6-15.4-13.42-25.52-20.02zM455.54 382l-6.16 9.24c10.12 5.06 20.24 12.1 30.14 21.12l6.6-9.9c-9.24-7.92-19.58-14.74-30.58-20.46zm-24.2.44c-8.14 8.58-18.04 16.06-29.7 22.44l7.04 9.02c12.32-6.6 22.88-14.52 31.46-23.54l-8.8-7.92z"
        id="40_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="40_svg__b"
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
      <g filter="url(#40_svg__a)" transform="translate(20 45)" fill="#48B38F">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#40_svg__b)" xlinkHref="#40_svg__c" />
      <use fill="url(#40_svg__d)" xlinkHref="#40_svg__c" />
    </g>
  </svg>
)

export default Icon
