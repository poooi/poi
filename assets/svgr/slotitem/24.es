import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-3.8%"
        y="-3.1%"
        width="115%"
        height="112.5%"
        filterUnits="objectBoundingBox"
        id="24_svg__a"
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
    </defs>
    <g fill="none" fillRule="evenodd">
      <g filter="url(#24_svg__a)" transform="translate(120 80)" fill="#E87428">
        <path d="M40 240h40v240H40zM320 240h40v240h-40zM80 420h240v60H80z" />
        <path d="M0 440h400v40H0zM160 0L0 160v40l160 160h80l160-160v-40L240 0z" />
      </g>
      <path fill="#F78D48" d="M320 120L180 260l140 140 140-140z" />
    </g>
  </svg>
)

export default Icon
