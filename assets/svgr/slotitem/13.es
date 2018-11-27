import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        d="M549.972 409.972L409.999 549.997l-29.993-30.002 140.002-139.987 29.964 29.964zM560 420.016V480l-80 80h-59.998L560 420.016zm-50.028-50.044l-139.967 140.02-109.982-110.013 139.985-139.971 109.964 109.964zm-120-120l-139.95 140.003L200 339.939V320l-80-80v-40l-20-20H80V80h100v20l20 20h40l80 80h20l49.972 49.972z"
        id="13_svg__b"
      />
      <filter
        x="-5.2%"
        y="-3.1%"
        width="110.4%"
        height="112.5%"
        filterUnits="objectBoundingBox"
        id="13_svg__a"
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
        />
      </filter>
      <linearGradient
        x1="85.495%"
        y1="0%"
        x2="43.175%"
        y2="42.663%"
        id="13_svg__c"
      >
        <stop stopColor="#933E3E" offset="0%" />
        <stop stopColor="#D15B5B" offset="100%" />
      </linearGradient>
      <linearGradient
        x1="100%"
        y1="19.61%"
        x2="59.865%"
        y2="60.392%"
        id="13_svg__d"
      >
        <stop stopColor="#913D3D" offset="0%" />
        <stop stopColor="#D15B5B" offset="100%" />
      </linearGradient>
      <radialGradient
        cx="100%"
        cy="0%"
        fx="100%"
        fy="0%"
        r="140.448%"
        id="13_svg__e"
      >
        <stop stopColor="#913D3D" offset="0%" />
        <stop stopColor="#D05B5B" offset="80.501%" />
        <stop stopColor="#D15B5B" offset="100%" />
      </radialGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#13_svg__a)" xlinkHref="#13_svg__b" />
      <use fill="#D15B5B" xlinkHref="#13_svg__b" />
      <path fill="url(#13_svg__c)" d="M320 200L200 320v20l140-140z" />
      <path fill="url(#13_svg__d)" d="M120 199.995L200 120h40L120 239.995z" />
      <path fill="url(#13_svg__e)" d="M80 80h100v20l-80 80H80z" />
    </g>
  </svg>
)

export default Icon
