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
        id="45_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="33.194%" y2="82.768%" id="45_svg__d">
        <stop stopColor="#7F819B" offset="0%" />
        <stop stopColor="#39B74E" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zM317.4 267.825v48.15h43.425v-48.15H317.4zm30.6 36h-17.775V279.75H348v24.075zm26.325-36v48.15h43.2v-48.15h-43.2zm30.375 36h-17.55V279.75h17.55v24.075zM321.675 327.9v76.05h38.7v16.65H313.35v13.95h47.025v31.95h14.4v-31.95h45.45V420.6h-45.45v-16.65h38.475V327.9h-91.575zm76.95 62.775h-23.85v-18.9h23.85v18.9zm-38.25 0h-24.3v-18.9h24.3v18.9zm-24.3-31.5v-18h24.3v18h-24.3zm38.7-18h23.85v18h-23.85v-18zM511.8 309.45l-52.2 12.15c-.9-17.55-1.35-38.025-1.35-60.975h-16.425c0 23.85.45 45.45 1.8 64.8l-24.3 5.625 2.475 15.525 22.95-5.4c1.35 14.85 3.15 28.125 5.4 39.825 2.025 10.8 4.275 20.7 6.975 29.7-12.6 14.85-27 26.55-42.975 35.1l9.9 13.05c13.725-6.75 26.775-17.1 39.15-30.6a137.094 137.094 0 0 0 6.75 14.175c8.1 13.5 15.525 20.25 22.725 20.25 11.025 0 19.575-15.75 25.425-46.8l-13.725-7.425c-4.5 23.85-9.225 35.775-14.4 35.775-2.925 0-6.75-5.4-11.7-15.975-1.8-3.6-3.375-7.875-4.725-12.825 12.6-17.1 24.525-38.25 35.325-63.9l-12.825-8.775c-8.1 20.25-17.325 37.8-27.675 53.1-1.35-5.85-2.7-12.375-3.825-19.575-1.8-10.35-3.15-23.4-4.05-38.7l53.775-12.375-2.475-15.75zm-30.825-44.1l-12.375 7.875c8.775 10.8 15.75 20.925 20.925 29.925l12.825-9c-4.95-8.325-12.15-18-21.375-28.8z"
        id="45_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="45_svg__b"
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
      <g filter="url(#45_svg__a)" transform="translate(20 45)" fill="#7F819B">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#45_svg__b)" xlinkHref="#45_svg__c" />
      <use fill="url(#45_svg__d)" xlinkHref="#45_svg__c" />
    </g>
  </svg>
)

export default Icon
