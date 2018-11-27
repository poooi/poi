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
        id="37_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="37_svg__d">
        <stop stopColor="#4EA915" offset="0%" />
        <stop stopColor="#267009" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-24.3 143.62v11h44.88v27.06h-50.6v11h113.3v-11h-51.26v-27.06h44.44v-11h-44.44v-28.6h-11.44v28.6H395.7zm1.32 109.56v11h43.78v33.22h-53.68v11.22h120.12V452.4h-55v-33.22H498v-11h-45.76v-33.22H440.8v33.22h-43.78zm69.52-56.32l-7.48 7.26c16.72 12.32 29.92 24.2 39.82 35.42l7.7-7.7c-10.78-11.66-24.2-23.32-40.04-34.98zm-40.7.66c-10.56 13.2-23.54 24.64-38.94 34.76l6.6 8.58c15.84-10.56 29.26-22.66 40.26-36.3l-7.92-7.04zm-105.16-72.6v190.3h11.44V291.36h38.94c-5.72 18.92-13.64 40.26-24.2 63.58 14.96 18.26 22.44 34.76 22.44 49.72 0 5.94-1.54 10.12-4.4 12.76-3.08 2.42-8.8 3.96-17.38 4.62-1.76 0-3.96-.22-6.6-.66l4.18 12.1c14.08-.22 23.98-2.86 29.48-8.14 4.18-4.4 6.38-11.22 6.6-20.68-1.1-15.84-8.58-33-22.22-51.26 9.24-22 17.38-43.34 23.98-63.8v-9.68h-62.26z"
        id="37_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="37_svg__b"
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
      <g filter="url(#37_svg__a)" transform="translate(20 45)" fill="#267009">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#37_svg__b)" xlinkHref="#37_svg__c" />
      <use fill="url(#37_svg__d)" xlinkHref="#37_svg__c" />
    </g>
  </svg>
)

export default Icon
