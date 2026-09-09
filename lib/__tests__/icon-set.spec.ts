import defaultConfig from '../default-config'
import { migrateIconSettings } from '../icon-set'

describe('icon preference migration', () => {
  it.each([
    [false, 'reconstructed'],
    [true, 'classic'],
  ])('migrates the old %s choice for both categories', (svgicon, expected) => {
    const stored = { poi: { appearance: { svgicon, theme: 'dark' } } }
    expect(migrateIconSettings(stored)).toBe(true)
    expect(stored.poi.appearance).toEqual({
      theme: 'dark',
      equipmentIcons: expected,
      resourceIcons: expected,
    })
    expect(migrateIconSettings(stored)).toBe(false)
  })

  it('preserves separate new choices even when an old switch remains', () => {
    const stored = {
      poi: {
        appearance: { svgicon: false, equipmentIcons: 'reconstructed', resourceIcons: 'classic' },
      },
    }
    migrateIconSettings(stored)
    expect(stored.poi.appearance).toEqual({
      equipmentIcons: 'reconstructed',
      resourceIcons: 'classic',
    })
  })

  it('migrates only the missing category in a partially upgraded config', () => {
    const stored = { poi: { appearance: { svgicon: true, resourceIcons: 'game' } } }
    migrateIconSettings(stored)
    expect(stored.poi.appearance).toEqual({ equipmentIcons: 'classic', resourceIcons: 'game' })
  })

  it.each(['equipmentIcons', 'resourceIcons'] as const)(
    'preserves an explicit game choice for %s while upgrading the missing category',
    (key) => {
      const stored = { poi: { appearance: { svgicon: false, [key]: 'game' } } }
      migrateIconSettings(stored)
      expect(stored.poi.appearance).toEqual({
        equipmentIcons: 'reconstructed',
        resourceIcons: 'reconstructed',
        [key]: 'game',
      })
      expect(migrateIconSettings(stored)).toBe(false)
    },
  )

  it('defaults new installs to reconstructed icons without inventing an old choice', () => {
    const stored = { poi: { appearance: { theme: 'light' } } }
    expect(migrateIconSettings(stored)).toBe(false)
    expect(stored).toEqual({ poi: { appearance: { theme: 'light' } } })
    expect(defaultConfig.poi.appearance.equipmentIcons).toBe('reconstructed')
    expect(defaultConfig.poi.appearance.resourceIcons).toBe('reconstructed')
  })

  it('replaces unsupported set names with the new default', () => {
    const stored = { poi: { appearance: { equipmentIcons: 'invalid', resourceIcons: 1 } } }
    migrateIconSettings(stored)
    expect(stored.poi.appearance).toEqual({
      equipmentIcons: 'reconstructed',
      resourceIcons: 'reconstructed',
    })
  })
})
