import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        d="M403.636 148.636L240 185l-20-20-34.286 8.571L100 105H40l-20 20 110.526 78.947L120 225l-40 20-20 40-20 20h40l180-20 191.612-104.515L540 205l20-20-81.095-19.403L480 165l40-120-40 20-51.429 68.571L400 105h-40l43.636 43.636z"
        id="43_svg__b"
      />
      <filter
        x="-2.8%"
        y="-5.8%"
        width="111.1%"
        height="123.1%"
        filterUnits="objectBoundingBox"
        id="43_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="43_svg__e">
        <stop stopColor="#B6EFBF" offset="0%" />
        <stop stopColor="#A2D3AA" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zM314.08 275.74v47.08h42.46v-47.08h-42.46zm29.92 35.2h-17.38V287.4H344v23.54zm25.74-35.2v47.08h42.24v-47.08h-42.24zm29.7 35.2h-17.16V287.4h17.16v23.54zm-81.18 23.54v74.36h37.84v16.28h-45.98v13.64h45.98V470h14.08v-31.24h44.44v-13.64h-44.44v-16.28h37.62v-74.36h-89.54zm75.24 61.38h-23.32v-18.48h23.32v18.48zm-37.4 0h-23.76v-18.48h23.76v18.48zm-23.76-30.8v-17.6h23.76v17.6h-23.76zm37.84-17.6h23.32v17.6h-23.32v-17.6zm133.98-31.02l-51.04 11.88c-.88-17.16-1.32-37.18-1.32-59.62h-16.06c0 23.32.44 44.44 1.76 63.36l-23.76 5.5 2.42 15.18 22.44-5.28c1.32 14.52 3.08 27.5 5.28 38.94 1.98 10.56 4.18 20.24 6.82 29.04-12.32 14.52-26.4 25.96-42.02 34.32l9.68 12.76c13.42-6.6 26.18-16.72 38.28-29.92 1.98 4.84 4.18 9.46 6.6 13.86 7.92 13.2 15.18 19.8 22.22 19.8 10.78 0 19.14-15.4 24.86-45.76l-13.42-7.26c-4.4 23.32-9.02 34.98-14.08 34.98-2.86 0-6.6-5.28-11.44-15.62-1.76-3.52-3.3-7.7-4.62-12.54 12.32-16.72 23.98-37.4 34.54-62.48L488.76 349c-7.92 19.8-16.94 36.96-27.06 51.92-1.32-5.72-2.64-12.1-3.74-19.14-1.76-10.12-3.08-22.88-3.96-37.84l52.58-12.1-2.42-15.4zm-30.14-43.12l-12.1 7.7c8.58 10.56 15.4 20.46 20.46 29.26l12.54-8.8c-4.84-8.14-11.88-17.6-20.9-28.16z"
        id="43_svg__d"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="43_svg__c"
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
      <use fill="#000" filter="url(#43_svg__a)" xlinkHref="#43_svg__b" />
      <use fill="#A2D3AA" xlinkHref="#43_svg__b" />
      <g>
        <use fill="#000" filter="url(#43_svg__c)" xlinkHref="#43_svg__d" />
        <use fill="url(#43_svg__e)" xlinkHref="#43_svg__d" />
      </g>
    </g>
  </svg>
)

export default Icon
