import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-4.2%"
        y="-3%"
        width="116.7%"
        height="112%"
        filterUnits="objectBoundingBox"
        id="28_svg__a"
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
        x1="126.171%"
        y1="117.801%"
        x2="0%"
        y2="0%"
        id="28_svg__b"
      >
        <stop stopColor="#6A568F" offset="0%" />
        <stop stopColor="#746098" offset="25.758%" />
        <stop stopColor="#907CB4" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <g filter="url(#28_svg__a)" transform="translate(139 70)" fill="#907CB4">
        <path d="M20 500l120-300h80l120 300h-60L180 240 80 500z" />
        <path d="M130 280h100v40H130zM80 420h200v40H80zM0 120v40l140 40h80l140-40v-40zM180 320l-40 100h80zM180 0l-60 60 60 60 60-60z" />
      </g>
      <path
        d="M388.23 490l-38.46-100H319v-40h15.385L319 310v-40h40l120 300h-60l-15.385-40H319v-40h69.23zM319 190h180l2.558 40L359 270h-40v-80zm0 200l40 100h-40V390zm0-320l60 60-60 60V70z"
        fill="url(#28_svg__b)"
      />
    </g>
  </svg>
)

export default Icon
