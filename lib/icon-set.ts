import { get, set, unset } from 'lodash'

export type IconSet = 'game' | 'classic' | 'reconstructed'

export const isIconSet = (value: unknown): value is IconSet =>
  value === 'game' || value === 'classic' || value === 'reconstructed'

/** Migrate the stored values before merging defaults, preserving explicit choices. */
export function migrateIconSettings(stored: unknown): boolean {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return false
  const legacy = get(stored, 'poi.appearance.svgicon')
  let changed = false
  for (const key of ['equipmentIcons', 'resourceIcons']) {
    const path = `poi.appearance.${key}`
    const value: unknown = get(stored, path)
    if (!isIconSet(value) && (value !== undefined || typeof legacy === 'boolean')) {
      // Upgrade game-style icons to HD; retain the old simplified style.
      set(stored, path, legacy === true ? 'classic' : 'reconstructed')
      changed = true
    }
  }
  if (legacy !== undefined) {
    unset(stored, 'poi.appearance.svgicon')
    changed = true
  }
  return changed
}
