import type { KeyChord } from '../accelerator'

import { matchesAccelerator, parseAccelerator } from '../accelerator'

const spec = it

const isMacOS = process.platform === 'darwin'

const keyEvent = ({
  key,
  ctrlKey = false,
  metaKey = false,
  altKey = false,
  shiftKey = false,
}: Partial<KeyChord> & Pick<KeyChord, 'key'>): KeyChord => ({
  key,
  ctrlKey,
  metaKey,
  altKey,
  shiftKey,
})

describe('parseAccelerator', () => {
  spec('rejects input without a key', () => {
    expect(parseAccelerator('')).toBeNull()
    expect(parseAccelerator('Ctrl+Shift')).toBeNull()
  })

  spec('resolves CmdOrCtrl per platform', () => {
    const parsed = parseAccelerator('CmdOrCtrl+F')
    expect(parsed?.key).toBe('f')
    expect(parsed?.meta).toBe(isMacOS)
    expect(parsed?.ctrl).toBe(!isMacOS)
  })

  spec('normalises named keys', () => {
    expect(parseAccelerator('Esc')?.key).toBe('escape')
    expect(parseAccelerator('Ctrl+Space')?.key).toBe(' ')
  })
})

describe('matchesAccelerator', () => {
  spec('matches the default search shortcut', () => {
    const e = keyEvent({ key: 'f', ctrlKey: !isMacOS, metaKey: isMacOS })
    expect(matchesAccelerator(e, 'CmdOrCtrl+F')).toBe(true)
  })

  spec('is case insensitive on the key', () => {
    const e = keyEvent({ key: 'F', ctrlKey: true, shiftKey: true })
    expect(matchesAccelerator(e, 'Ctrl+Shift+f')).toBe(true)
  })

  spec('rejects a superset of the configured modifiers', () => {
    const e = keyEvent({ key: 'f', ctrlKey: true, shiftKey: true })
    expect(matchesAccelerator(e, 'Ctrl+F')).toBe(false)
  })

  spec('rejects a different key', () => {
    expect(matchesAccelerator(keyEvent({ key: 'g', ctrlKey: true }), 'Ctrl+F')).toBe(false)
  })

  spec('never matches an unset shortcut', () => {
    expect(matchesAccelerator(keyEvent({ key: 'f', ctrlKey: true }), '')).toBe(false)
  })
})
