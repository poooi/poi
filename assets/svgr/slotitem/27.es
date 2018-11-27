import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path id="27_svg__b" d="M110 410h120v120H110z" />
      <filter
        x="-12.5%"
        y="-12.5%"
        width="150%"
        height="150%"
        filterUnits="objectBoundingBox"
        id="27_svg__a"
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
      <path
        d="M230 170v220l110-110-110-110zm-20-20h20v20zm280 280H230l-20-20V150l40-40h160l120 120v160l-40 40zm-20-20L360 300 250 410h220z"
        id="27_svg__d"
      />
      <filter
        x="-5.4%"
        y="-19.6%"
        width="125%"
        height="135.7%"
        filterUnits="objectBoundingBox"
        id="27_svg__c"
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
      <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="27_svg__e">
        <stop stopColor="#FCA825" offset="0%" />
        <stop stopColor="#CC881F" offset="100%" />
      </linearGradient>
      <linearGradient x1="0%" y1="62.427%" x2="0%" y2="13.117%" id="27_svg__f">
        <stop stopColor="#FCA825" offset="0%" />
        <stop stopColor="#CC891F" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#27_svg__a)" xlinkHref="#27_svg__b" />
      <use fill="#FCA825" xlinkHref="#27_svg__b" />
      <use fill="#000" filter="url(#27_svg__c)" xlinkHref="#27_svg__d" />
      <use fill="#FCA825" xlinkHref="#27_svg__d" />
      <path fill="url(#27_svg__e)" d="M110 410v120l120-120z" />
      <path fill="url(#27_svg__f)" d="M210 150l280 280 40-40-280-280z" />
    </g>
  </svg>
)

export default Icon
