import 'styled-components'
declare module 'styled-components' {
  export interface DefaultTheme {
    [key: string]: string | undefined
  }
}
