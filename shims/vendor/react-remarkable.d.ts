declare module 'react-remarkable' {
  import * as React from 'react'

  interface Props {
    source?: string
    options?: {
      linkTarget?: string
      [key: string]: unknown
    }
    container?: string
  }

  class ReactMarkdown extends React.Component<Props> {}
  export = ReactMarkdown
}
