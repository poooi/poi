import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <linearGradient x1="54.77%" y1="53.078%" x2="50%" y2="50%" id="19_svg__c">
        <stop stopColor="#E7AB28" offset="0%" />
        <stop stopColor="#F8C04B" offset="100%" />
      </linearGradient>
      <path
        d="M240 160h160l80 80v160l-80 80H240l-80-80V240l80-80zm40 60l-60 60v80l60 60h80l60-60v-80l-60-60h-80zm20-100h40v40h-40v-40zm0 360h40v40h-40v-40zM120 300h40v40h-40v-40zm360 0h40v40h-40v-40zM240 120h40v40h-40v-40zm120 0h40v40h-40v-40zm0 360h40v40h-40v-40zm-120 0h40v40h-40v-40zM120 360h40v40h-40v-40zm0-120h40v40h-40v-40zm360 0h40v40h-40v-40zm0 120h40v40h-40v-40zm-40 80h40v40h-40v-40zM160 160h40v40h-40v-40zm280 0h40v40h-40v-40zM160 440h40v40h-40v-40z"
        id="19_svg__b"
      />
      <filter
        x="-3.8%"
        y="-3.8%"
        width="115%"
        height="115%"
        filterUnits="objectBoundingBox"
        id="19_svg__a"
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
      <path
        d="M240 160h160l80 80v160l-80 80H240l-80-80V240l80-80zm40 60l-60 60v80l60 60h80l60-60v-80l-60-60h-80zM300 120h40v40h-40zM300 480h40v40h-40zM120 300h40v40h-40zM480 300h40v40h-40zM240 120h40v40h-40zM360 120h40v40h-40zM360 480h40v40h-40zM240 480h40v40h-40zM120 360h40v40h-40zM120 240h40v40h-40zM480 240h40v40h-40zM480 360h40v40h-40z"
        fill="#F8C04B"
      />
      <path
        fill="#F8C04B"
        d="M440 440h40v40h-40zM160 160h40v40h-40zM440 160h40v40h-40zM160 440h40v40h-40z"
      />
      <use fill="#000" filter="url(#19_svg__a)" xlinkHref="#19_svg__b" />
      <use fill="url(#19_svg__c)" xlinkHref="#19_svg__b" />
    </g>
  </svg>
)

export default Icon
