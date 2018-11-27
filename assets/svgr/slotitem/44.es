import React from "react"

const Icon = props => (
  <svg width="1em" height="1em" viewBox="0 0 640 640" {...props}>
    <defs>
      <filter
        x="-2.8%"
        y="-5.8%"
        width="111.1%"
        height="123.5%"
        filterUnits="objectBoundingBox"
        id="44_svg__a"
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
      <linearGradient x1="0%" y1="50%" x2="50%" y2="100%" id="44_svg__d">
        <stop stopColor="#C7EFCD" offset="0%" />
        <stop stopColor="#9BEEBE" offset="100%" />
      </linearGradient>
      <path
        d="M420 155l220 220-220 220-220-220 220-220zm-24.74 142.08v14.08h43.34v23.76h-49.28v14.52h114.62v-14.52H454v-23.76h42.9v-14.08H454v-27.5h-15.4v27.5h-43.34zm1.32 109.12v14.52h42.24v29.48h-52.14v14.52H507.9V450.2h-53.68v-29.48h44.22V406.2h-44.22v-31.24h-15.4v31.24h-42.24zm71.5-54.78l-9.46 9.24c16.28 12.1 29.04 23.54 38.28 34.32l10.34-10.12c-10.56-11.22-23.76-22.44-39.16-33.44zm-44.22.44c-10.12 12.76-22.66 23.76-37.62 33.44l8.58 11c15.62-10.12 28.82-21.78 39.38-35.42l-10.34-9.02zM318.7 277.94v192.72h15.4V292.9h34.54c-5.72 18.48-13.42 39.16-23.54 62.04 14.74 18.26 22.22 34.76 22.22 49.5 0 5.06-1.32 8.58-3.74 10.78-2.42 1.98-7.26 3.3-14.52 3.74-2.42 0-5.28-.44-8.58-.88l5.06 16.06c14.52-.22 24.86-2.86 30.58-8.14 4.4-4.4 6.6-11.66 6.6-21.56-1.1-15.4-8.36-32.78-22-51.92 9.02-21.56 16.94-42.24 23.54-62.04v-12.54H318.7z"
        id="44_svg__c"
      />
      <filter
        x="-3.4%"
        y="-3.4%"
        width="113.6%"
        height="113.6%"
        filterUnits="objectBoundingBox"
        id="44_svg__b"
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
      <g filter="url(#44_svg__a)" transform="translate(20 45)" fill="#9BEEBE">
        <path d="M40 240l20-40 40-20 20-40 80-20 20 20 180-40 60-80 40-20-40 120-220 120-180 20H20z" />
        <path d="M140 180L0 80l20-20h60l100 80zM428.713 134.68L520 160l20-20-100-23.926zM400 120l-60-60h40l40 40z" />
      </g>
      <use fill="#000" filter="url(#44_svg__b)" xlinkHref="#44_svg__c" />
      <use fill="url(#44_svg__d)" xlinkHref="#44_svg__c" />
    </g>
  </svg>
)

export default Icon
