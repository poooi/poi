import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        d="M110 320v20.412l60 59.854h20l80-79.73L490 540h40v-39.902c-146.05-146.31-219.383-219.464-220-219.464-.617 0 46.05-46.552 140-139.658V100l-40 1.074-220 139.658L110 320z"
        id="14_svg__b"
      />
      <filter
        x="-3.6%"
        y="-3.4%"
        width="111.9%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="14_svg__a"
      >
        <feOffset
          dx={10}
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
      <linearGradient
        x1="30.335%"
        y1="74.517%"
        x2="30.335%"
        y2="-18.161%"
        id="14_svg__c"
      >
        <stop stopColor="#E8E8E8" offset="0%" />
        <stop stopColor="#BBB" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#14_svg__a)" xlinkHref="#14_svg__b" />
      <use fill="#E8E8E8" xlinkHref="#14_svg__b" />
      <path
        d="M270 319.902l220 219.464h40v-39.903C383.95 353.154 310.617 280 310 280c-.617 0-13.95 13.3-40 39.902z"
        fill="url(#14_svg__c)"
      />
    </g>
  </svg>
)

export default Icon
