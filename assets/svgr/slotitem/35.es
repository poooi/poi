import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path id="35_svg__b" d="M320 60l-160 60 160 60 160-60z" />
      <filter
        x="-4.7%"
        y="-12.5%"
        width="118.8%"
        height="150%"
        filterUnits="objectBoundingBox"
        id="35_svg__a"
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
        d="M160 140l159.455 61.155L480 140v380l-160 60-160-60V140zm0 180v20l160 60 160-60v-20l-160 60-160-60z"
        id="35_svg__d"
      />
      <filter
        x="-4.7%"
        y="-3.4%"
        width="118.8%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="35_svg__c"
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
      <use fill="#000" filter="url(#35_svg__a)" xlinkHref="#35_svg__b" />
      <use fill="#6FDBB1" xlinkHref="#35_svg__b" />
      <use fill="#000" filter="url(#35_svg__c)" xlinkHref="#35_svg__d" />
      <use fill="#5DC19A" xlinkHref="#35_svg__d" />
      <path
        fill="#78E3B9"
        d="M320 200l.037 180 160-60V140zM320 400l.037 180 160-60V340z"
      />
    </g>
  </svg>
)

export default Icon
