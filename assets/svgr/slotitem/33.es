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
        id="33_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="33_svg__d">
        <stop stopColor="#9DE4A9" offset="0%" />
        <stop stopColor="#8FCC99" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zM309.02 363.96v14.08h12.1v.44c-.22 32.56-4.4 59.62-12.54 80.74l11.44 10.34c9.68-23.32 14.52-53.68 14.74-91.52h32.34v69.3c0 5.5-2.64 8.36-7.7 8.36-3.96 0-8.36-.22-12.76-.66l3.52 13.2h13.64c11.44 0 17.16-5.5 17.16-16.28v-160.6h-25.08c2.64-6.6 4.62-13.64 6.16-21.12l-15.84-2.2c-1.1 7.92-3.08 15.84-5.72 23.32h-19.36v72.6h-12.1zm58.08 0h-32.34V305h32.34v58.96zm-16.94-47.3l-10.12 3.08c4.18 10.12 7.7 20.46 10.34 31.46l10.56-2.64c-3.08-12.1-6.82-22.66-10.78-31.9zm-.66 74.14l-10.78 3.3c4.18 12.32 7.7 25.3 10.56 38.5l11.44-2.86c-3.3-14.52-7.04-27.5-11.22-38.94zm117.7-92.4v45.98h-24.86v14.96h24.86v51.7h-22.22v15.18h59.62v-15.18h-22.44v-51.7h26.4v-14.96h-26.4v-48.84c9.46-2.64 18.04-6.16 25.74-10.78L500.42 272c-16.28 9.68-36.96 14.52-61.6 14.52l4.62 13.42c8.36 0 16.28-.66 23.76-1.54zm-80.3-15.62v14.3h28.16c-6.6 18.04-13.86 34.76-22 49.94v11.44h27.28c-.88 20.46-3.52 38.5-8.36 53.9-3.52-8.58-6.82-18.92-9.68-31.02l-12.32 4.62c4.18 17.38 9.24 31.68 15.4 43.12-5.72 11.88-13.2 21.78-22.44 29.48l7.26 12.54c9.24-7.7 17.16-17.16 23.76-28.6 2.86 3.52 6.16 6.82 9.68 9.46 13.42 9.68 35.42 14.52 66 14.52H509l2.86-15.18c-9.9.44-19.58.88-29.04.88-23.32 0-40.48-3.96-51.48-11.44-3.96-2.86-7.48-6.82-10.78-11.88 8.14-20.24 12.54-45.1 13.2-74.8v-9.02H410c6.6-13.2 13.42-29.92 20.46-49.72v-12.54H386.9z"
        id="33_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="33_svg__b"
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
      <g filter="url(#33_svg__a)" transform="translate(20 45)" fill="#8FCC99">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#33_svg__b)" xlinkHref="#33_svg__c" />
      <use fill="url(#33_svg__d)" xlinkHref="#33_svg__c" />
    </g>
  </svg>
)

export default Icon
