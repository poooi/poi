import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <linearGradient
        x1="50%"
        y1="50%"
        x2="48.617%"
        y2="48.558%"
        id="18_svg__c"
      >
        <stop stopColor="#50ABBC" offset="0%" />
        <stop stopColor="#74B6C2" offset="100%" />
      </linearGradient>
      <path
        d="M120 120h400v400H120V120zm40 239.764V420l60-140 20 59.785 60-139.85V140l-60 140-20-60.086-60 139.85zM360 280l-60-140v60.086L360 340v-60zm60 140l-60-140v60.086L420 480v-60zm0 0v60l60-139.914V280l-60 140zm-260 20v40h40v-40h-40zm80 0v40h40v-40h-40zm80 0v40h40v-40h-40z"
        id="18_svg__b"
      />
      <filter
        x="-3.8%"
        y="-3.8%"
        width="115%"
        height="115%"
        filterUnits="objectBoundingBox"
        id="18_svg__a"
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
      <use fill="#000" filter="url(#18_svg__a)" xlinkHref="#18_svg__b" />
      <use fill="url(#18_svg__c)" xlinkHref="#18_svg__b" />
    </g>
  </svg>
)

export default Icon
