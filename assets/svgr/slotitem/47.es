import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-2.8%"
        y="-5.8%"
        width="111.1%"
        height="123.1%"
        filterUnits="objectBoundingBox"
        id="47_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="36.022%" y2="86.282%" id="47_svg__d">
        <stop stopColor="#9DA0BF" offset="0%" />
        <stop stopColor="#5F6CC8" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm31.68 118.48v58.74h-42.46v62.7c-.44 28.16-7.26 51.48-20.68 69.96l11.66 10.56c15.4-20.9 23.1-48.18 23.54-81.62v-12.54c8.36.66 16.94 1.76 25.3 3.08 9.9 1.32 19.8 3.3 29.7 5.5l5.5-12.54c-11.44-2.2-20.46-3.74-27.5-4.62-7.92-1.32-18.92-2.64-33-4.18v-22.44h70.4v57.2c-21.34 4.4-43.78 7.92-67.1 10.34l3.52 14.74c22.44-3.08 43.56-7.04 63.58-11.44v34.54c0 5.72-2.86 8.8-8.14 8.8-7.04 0-14.52-.22-22.66-.66l3.74 14.52h23.76c12.1 0 18.26-5.94 18.26-17.38V332.22h-42.02v-58.74h-15.4zm-39.38 6.16l-12.98 6.38c7.48 11 14.74 23.32 21.56 37.18l12.32-6.16c-6.6-13.42-13.64-25.96-20.9-37.4zm93.28-1.32c-5.28 12.98-12.54 26.18-21.56 39.38l12.1 6.38c9.24-12.76 16.72-25.96 22.44-39.6l-12.98-6.16zm-116.16 17.6h-61.6v159.72h15.62v-17.16h45.98V295.92zm-45.98 127.6V310.66h30.58v112.86h-30.58z"
        id="47_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="47_svg__b"
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
      <g filter="url(#47_svg__a)" transform="translate(20 45)" fill="#5F6CC8">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#47_svg__b)" xlinkHref="#47_svg__c" />
      <use fill="url(#47_svg__d)" xlinkHref="#47_svg__c" />
    </g>
  </svg>
)

export default Icon
