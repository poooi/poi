import type * as BlueprintColors from '@blueprintjs/colors'
import type * as BlueprintCore from '@blueprintjs/core'

import 'styled-components'

type BlueprintThemeColors = typeof BlueprintCore.Colors
type BlueprintLegacyThemeColors = typeof BlueprintColors.LegacyColors

declare module 'styled-components' {
  export interface DefaultTheme extends BlueprintThemeColors, BlueprintLegacyThemeColors {
    name: string
    variant: string
    slotBg: string
  }
}
