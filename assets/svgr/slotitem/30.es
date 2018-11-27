import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-12.5%"
        y="-15%"
        width="150%"
        height="161%"
        filterUnits="objectBoundingBox"
        id="30_svg__a"
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
      <path id="30_svg__c" d="M120 420l80-40h180l140 40-80 40H260z" />
      <filter
        x="-3.7%"
        y="-18.8%"
        width="115%"
        height="175%"
        filterUnits="objectBoundingBox"
        id="30_svg__b"
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
      <path id="30_svg__e" d="M440 260l80-40v200l-80 40z" />
      <filter
        x="-18.8%"
        y="-6.2%"
        width="175%"
        height="125%"
        filterUnits="objectBoundingBox"
        id="30_svg__d"
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
      <path fill="#899A4D" d="M120 220h400v200H120z" />
      <path fill="#899A4D" d="M120 280l-20 40 20 60 20-40z" />
      <path fill="#899A4D" d="M60 280h80v100H60z" />
      <path fill="#91A353" d="M80 340h60l-20 40H60z" />
      <path fill="#A1B55D" d="M80 340h60l-20-60H60z" />
      <path fill="#899A4D" d="M60 280l-20 40 20 60 20-40z" />
      <g filter="url(#30_svg__a)" transform="matrix(-1 0 0 1 600 260)">
        <path fill="#899A4D" d="M20 0L0 60l20 40 20-60z" />
        <path fill="#899A4D" d="M20 0h80v100H20z" />
        <path fill="#91A353" d="M20 100h100l-20-40H0z" />
        <path fill="#A1B55D" d="M20 0h100l-20 60H0z" />
      </g>
      <path fill="#95A755" d="M120 220l80-40h180l140 40-80 40H260z" />
      <g>
        <use fill="#000" filter="url(#30_svg__b)" xlinkHref="#30_svg__c" />
        <use fill="#899A4D" xlinkHref="#30_svg__c" />
      </g>
      <path fill="#A1B55D" d="M260 260h180v200H260z" />
      <g>
        <use fill="#000" filter="url(#30_svg__d)" xlinkHref="#30_svg__e" />
        <use fill="#94A656" xlinkHref="#30_svg__e" />
      </g>
    </g>
  </svg>
)

export default Icon
