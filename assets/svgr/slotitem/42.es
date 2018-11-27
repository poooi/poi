import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-3.4%"
        y="-3.3%"
        width="113.6%"
        height="113%"
        filterUnits="objectBoundingBox"
        id="42_svg__a"
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
      <linearGradient
        x1="63.089%"
        y1="0%"
        x2="28.387%"
        y2="100%"
        id="42_svg__b"
      >
        <stop stopColor="#9EBAE0" offset="0%" />
        <stop stopColor="#8299B7" offset="100%" />
      </linearGradient>
    </defs>
    <g
      filter="url(#42_svg__a)"
      transform="translate(100 90)"
      fill="none"
      fillRule="evenodd"
    >
      <path
        d="M120 40h-20V0h80v40h-20v100h20v-40h-20V60h80v40h-20v40h20v-20h20v20h20v-20h20v20h20v-20h20v180h-20v-40h-20v40h-20v-40h-20v40h-20v-40h-20v60h-40v-60h-20v60h-40V40zm40 140v40h20v-40h-20zm60 40h20v-40h-20v40zm40 0h20v-40h-20v40zm40 0h20v-40h-20v40z"
        fill="#9EBAE0"
      />
      <path fill="#9EBAE0" d="M0 320v40l120 100h200l120-120v-40H240v20z" />
      <path
        fill="url(#42_svg__b)"
        d="M240 300v20H0v40l120 100h200l120.193-120-.193-40z"
      />
    </g>
  </svg>
)

export default Icon
