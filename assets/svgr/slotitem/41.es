import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        d="M403.636 148.636L240 185l-20-20-34.286 8.571L100 105H40l-20 20 110.526 78.947L120 225l-40 20-20 40-20 20h40l180-20 191.612-104.515L540 205l20-20-81.095-19.403L480 165l40-120-40 20-51.429 68.571L400 105h-40l43.636 43.636z"
        id="41_svg__b"
      />
      <filter
        x="-2.8%"
        y="-5.8%"
        width="111.1%"
        height="123.1%"
        filterUnits="objectBoundingBox"
        id="41_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="41_svg__e">
        <stop stopColor="#5FBC7F" offset="0%" />
        <stop stopColor="#428358" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-2.08 115.9c-28.6 8.14-64.68 12.32-107.8 12.32l4.62 14.08c46.2 0 82.94-4.4 110.66-13.2l-7.48-13.2zm-9.68 28.38c-4.84 18.04-10.12 32.78-16.28 44.44l12.76 4.62c6.82-13.2 12.32-28.38 16.72-45.76l-13.2-3.3zm76.78-32.78c-14.74 19.8-33.44 35.86-56.1 47.74l6.82 14.52c23.76-13.42 43.78-30.14 59.84-50.38l-10.56-11.88zm9.68 59.84c-16.28 21.12-36.96 38.28-62.26 51.26l7.04 14.52c26.18-14.3 47.96-32.34 65.56-54.12l-10.34-11.66zm6.38 60.28c-19.58 28.16-44.44 50.6-74.8 67.54l7.26 14.96c31.24-18.7 57.42-42.24 78.32-70.62l-10.78-11.88zm-184.14-18.04v15.4h44.44c-12.54 22-29.92 41.14-51.92 57.42l9.46 13.64c17.6-14.08 32.78-31.9 45.98-53.24v67.98h15.84v-57.64c9.02 6.6 20.02 15.4 32.78 26.84l9.24-14.08a500.782 500.782 0 0 0-42.02-27.28v-13.64h43.56v-15.4h-43.56V346.8H364.9v21.78h-47.96zm51.26-66l-13.42 3.74c5.06 10.78 9.46 21.78 12.98 33.22l13.42-4.84c-3.08-9.68-7.48-20.46-12.98-32.12zm-39.6 4.18l-12.54 4.18c6.6 11.88 12.1 24.64 16.5 37.84l12.98-3.3c-4.84-14.52-10.56-27.5-16.94-38.72z"
        id="41_svg__d"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="41_svg__c"
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
      <use fill="#000" filter="url(#41_svg__a)" xlinkHref="#41_svg__b" />
      <use fill="#428358" xlinkHref="#41_svg__b" />
      <g>
        <use fill="#000" filter="url(#41_svg__c)" xlinkHref="#41_svg__d" />
        <use fill="url(#41_svg__e)" xlinkHref="#41_svg__d" />
      </g>
    </g>
  </svg>
)

export default Icon
