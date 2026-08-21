/**
 * Matches a browser `KeyboardEvent` against an Electron accelerator string, so
 * renderer-side shortcuts can be configured with the same `ShortcutConfig`
 * recorder that the boss key uses.
 *
 * Only the subset poi records is supported: `Ctrl`/`Cmd`/`CmdOrCtrl`/`Alt`/
 * `Shift` modifiers plus a single character or named key.
 */

const isMacOS = process.platform === 'darwin'

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  del: 'delete',
  ins: 'insert',
  return: 'enter',
  space: ' ',
  plus: '+',
}

interface ParsedAccelerator {
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
  key: string
}

export const parseAccelerator = (accelerator: string): ParsedAccelerator | null => {
  const parts = accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return null

  const parsed: ParsedAccelerator = {
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    key: '',
  }

  for (const part of parts) {
    switch (part.toLowerCase()) {
      case 'ctrl':
      case 'control':
        parsed.ctrl = true
        break
      case 'cmd':
      case 'command':
      case 'super':
        parsed.meta = true
        break
      case 'cmdorctrl':
      case 'commandorcontrol':
        if (isMacOS) parsed.meta = true
        else parsed.ctrl = true
        break
      case 'alt':
      case 'option':
        parsed.alt = true
        break
      case 'shift':
        parsed.shift = true
        break
      default: {
        const key = part.toLowerCase()
        parsed.key = KEY_ALIASES[key] ?? key
      }
    }
  }

  return parsed.key ? parsed : null
}

/** The part of a `KeyboardEvent` a shortcut is matched against. */
export interface KeyChord {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export const matchesAccelerator = (e: KeyChord, accelerator: string): boolean => {
  const parsed = parseAccelerator(accelerator)
  if (!parsed) return false
  return (
    e.ctrlKey === parsed.ctrl &&
    e.metaKey === parsed.meta &&
    e.altKey === parsed.alt &&
    e.shiftKey === parsed.shift &&
    e.key.toLowerCase() === parsed.key
  )
}
