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
        id="46_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="34.97%" y2="84.253%" id="46_svg__d">
        <stop stopColor="#9DA0BF" offset="0%" />
        <stop stopColor="#5FAFEB" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-66.325 141.975v112.5c-11.475 3.15-23.175 5.625-34.875 7.875l3.825 16.425c29.7-6.75 57.375-15.3 83.025-25.65v-16.2c-11.7 4.95-23.85 9.225-36 13.05v-108h34.65v-15.75h-83.475v15.75h32.85zm77.85 12.15h52.425c-1.35 32.85-9.9 61.2-26.1 85.275-14.85-18.45-26.775-38.7-35.775-60.75a279.28 279.28 0 0 0 9.45-24.525zm67.5 0H518.6V293.6h-82.575c2.7-10.35 4.95-21.15 6.975-32.4l-15.75-2.7c-6.75 42.075-19.575 75.6-38.7 100.575l10.35 12.375c4.95-6.3 9.9-13.275 14.4-20.925 9 20.25 20.475 39.15 34.65 56.7-15.75 18-36.675 32.85-63 44.55l8.775 14.175c26.325-12.6 47.7-28.35 64.35-47.025 15.525 17.1 33.975 32.625 55.35 46.8l10.8-12.375c-21.375-13.95-40.05-29.475-56.025-47.025 19.125-26.775 29.475-59.175 30.825-97.2z"
        id="46_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="46_svg__b"
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
      <g filter="url(#46_svg__a)" transform="translate(20 45)" fill="#7F819B">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#46_svg__b)" xlinkHref="#46_svg__c" />
      <use fill="url(#46_svg__d)" xlinkHref="#46_svg__c" />
    </g>
  </svg>
)

export default Icon
