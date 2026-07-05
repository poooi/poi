import {
  isTranslatedNonArm64Build,
  shouldShowArchitectureMismatchDialog,
} from '../arm64-translation-warning-utils'

describe('ARM64 translation warning', () => {
  it('detects non-arm64 builds running under ARM64 translation', () => {
    expect(isTranslatedNonArm64Build('x64', true)).toBe(true)
    expect(isTranslatedNonArm64Build('ia32', true)).toBe(true)
  })

  it('does not warn native ARM64 builds or untranslated builds', () => {
    expect(isTranslatedNonArm64Build('arm64', true)).toBe(false)
    expect(isTranslatedNonArm64Build('x64', false)).toBe(false)
    expect(isTranslatedNonArm64Build('arm64', false)).toBe(false)
  })

  it('shows again when the current version differs from the dismissed version', () => {
    expect(shouldShowArchitectureMismatchDialog('x64', true, '', '11.1.0')).toBe(true)
    expect(shouldShowArchitectureMismatchDialog('x64', true, '11.0.0', '11.1.0')).toBe(true)
    expect(shouldShowArchitectureMismatchDialog('x64', true, '11.1.0', '11.1.0')).toBe(false)
  })
})
