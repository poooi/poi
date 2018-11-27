import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <path
        id="31_svg__b"
        d="M150 150v40h20v60l180 180h40l40-40v-40L250 170h-60v-20z"
      />
      <filter
        x="-8.9%"
        y="-5.4%"
        width="117.9%"
        height="121.4%"
        filterUnits="objectBoundingBox"
        id="31_svg__a"
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
      <path
        id="31_svg__d"
        d="M310 150v40h20v40l140 140h40l20-20v-40L390 170h-40v-20z"
      />
      <filter
        x="-11.4%"
        y="-6.8%"
        width="122.7%"
        height="127.3%"
        filterUnits="objectBoundingBox"
        id="31_svg__c"
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
      <path
        id="31_svg__f"
        d="M150 310v40h20v40l140 140h40l20-20v-40L230 330h-40v-20z"
      />
      <filter
        x="-11.4%"
        y="-6.8%"
        width="122.7%"
        height="127.3%"
        filterUnits="objectBoundingBox"
        id="31_svg__e"
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
      <linearGradient x1="61.24%" y1="0%" x2="0%" y2="0%" id="31_svg__g">
        <stop stopColor="#FF3636" offset="0%" />
        <stop stopColor="#A02121" offset="100%" />
      </linearGradient>
      <linearGradient x1="50%" y1="0%" x2="0%" y2="0%" id="31_svg__h">
        <stop stopColor="#FF3636" offset="0%" />
        <stop stopColor="#A02121" offset="100%" />
      </linearGradient>
      <linearGradient x1="53.184%" y1="0%" x2="0%" y2="0%" id="31_svg__i">
        <stop stopColor="#FF3636" offset="0%" />
        <stop stopColor="#A02121" offset="100%" />
      </linearGradient>
      <linearGradient
        x1="99.478%"
        y1="53.719%"
        x2="0%"
        y2="53.719%"
        id="31_svg__j"
      >
        <stop stopColor="#FF3636" offset="0%" />
        <stop stopColor="#CA2727" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <use fill="#000" filter="url(#31_svg__a)" xlinkHref="#31_svg__b" />
      <use fill="#EF3232" xlinkHref="#31_svg__b" />
      <use fill="#000" filter="url(#31_svg__c)" xlinkHref="#31_svg__d" />
      <use fill="#EF3232" xlinkHref="#31_svg__d" />
      <use fill="#000" filter="url(#31_svg__e)" xlinkHref="#31_svg__f" />
      <use fill="#EF3232" xlinkHref="#31_svg__f" />
      <path fill="url(#31_svg__g)" d="M170 190h-20v-40h40v20h60l-80 80z" />
      <path fill="url(#31_svg__h)" d="M330 190h-20v-40h40v20h40l-60 60z" />
      <path fill="url(#31_svg__i)" d="M170 350h-20v-40h40v20h40l-60 60z" />
      <path
        fill="url(#31_svg__j)"
        d="M330 230l140 140 60-60-140-140zM170 390l140 140 60-60-140-140zM170 250l180 180 80-80-180-180z"
      />
    </g>
  </svg>
)

export default Icon
