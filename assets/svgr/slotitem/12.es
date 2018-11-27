import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-5.2%"
        y="-3.1%"
        width="110.4%"
        height="112.5%"
        filterUnits="objectBoundingBox"
        id="12_svg__a"
      >
        <feOffset dy={20} in="SourceAlpha" result="shadowOffsetOuter1" />
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
      <linearGradient x1="50%" y1="0%" x2="50%" y2="91.494%" id="12_svg__b">
        <stop stopColor="#61AA6E" offset="0%" />
        <stop stopColor="#74CC83" offset="100%" />
      </linearGradient>
      <linearGradient
        x1="72.831%"
        y1="28.256%"
        x2="28.68%"
        y2="72.033%"
        id="12_svg__c"
      >
        <stop stopColor="#62AB6E" offset="0%" />
        <stop stopColor="#74CC83" offset="100%" />
      </linearGradient>
    </defs>
    <g
      filter="url(#12_svg__a)"
      transform="translate(80 80)"
      fill="none"
      fillRule="evenodd"
    >
      <path
        d="M0 0h140l340 340v60l-80 80h-60L0 140V0zm80 140v40h40v-40H80zm120 0v40h40v-40h-40zm0 120v40h40v-40h-40z"
        fill="url(#12_svg__b)"
      />
      <path
        fill="#74CC83"
        d="M40 280h60v60H40zM260 20h60v60h-60zM340 100h60v60h-60z"
      />
      <path fill="url(#12_svg__c)" d="M0 0v140L140 0z" />
    </g>
  </svg>
)

export default Icon
