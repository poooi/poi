import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path id="23_svg__b" d="M80 360v40l160 160h40l280-280v-40L400 80h-40z" />
      <filter
        x="-3.1%"
        y="-3.1%"
        width="112.5%"
        height="112.5%"
        filterUnits="objectBoundingBox"
        id="23_svg__a"
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
      <linearGradient x1="100%" y1="80.552%" x2="0%" y2="0%" id="23_svg__c">
        <stop stopColor="#997EAE" offset="0%" />
        <stop stopColor="#613E7D" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#23_svg__a)" xlinkHref="#23_svg__b" />
      <use fill="#997EAE" xlinkHref="#23_svg__b" />
      <path d="M360 160l-20 20 20 20 20-20zM180 340l-20 20 20 20 20-20zM270 250l-20 20 20 20 20-20zM460 260l-20 20 20 20 20-20zM280 440l-20 20 20 20 20-20zM370 350l-20 20 20 20 20-20z" />
      <path
        fill="#7F5E99"
        d="M160 360l20.178-20L200 360l-10 10-10-10-10 10zM340 180l20.178-20L380 180l-10 10-10-10-10 10zM250 270l20.178-20L290 270l-10 10-10-10-10 10zM440 280l20.178-20L480 280l-10 10-10-10-10 10zM350 370l20.178-20L390 370l-10 10-10-10-10 10zM260 460l20.178-20L300 460l-10 10-10-10-10 10z"
      />
      <path fill="#7F5E99" d="M160 360l20.178-20L200 360l-10 10-10-10-10 10z" />
      <path
        fill="url(#23_svg__c)"
        transform="matrix(-1 0 0 1 900 0)"
        d="M340 240v52l220 208v-52z"
      />
    </g>
  </svg>
)

export default Icon
