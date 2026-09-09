import type { ConfigInstance } from '../config'

jest.mock('fs-extra', () => ({
  accessSync: jest.fn(),
  writeFileSync: jest.fn(),
  constants: {},
}))
jest.mock('cson')

import CSON from 'cson'
import fs from 'fs-extra'

describe('stored icon settings at startup', () => {
  it.each([
    [{ svgicon: true }, 'classic', 'classic'],
    [{ svgicon: false }, 'game', 'game'],
    [{}, 'reconstructed', 'reconstructed'],
    [{ svgicon: true, resourceIcons: 'game' }, 'classic', 'game'],
    [{ equipmentIcons: 'classic', resourceIcons: 'reconstructed' }, 'classic', 'reconstructed'],
  ])('loads %j before applying defaults', (appearance, equipment, resource) => {
    jest.mocked(CSON.parseCSONFile).mockReturnValue({ poi: { appearance } })
    jest.isolateModules(() => {
      const config: ConfigInstance = require('../config')
      expect(config.get('poi.appearance.equipmentIcons')).toBe(equipment)
      expect(config.get('poi.appearance.resourceIcons')).toBe(resource)
      expect(config.get('poi.appearance')).not.toHaveProperty('svgicon')
      if ('svgicon' in appearance) {
        expect(fs.writeFileSync).toHaveBeenCalled()
        expect(CSON.stringify).toHaveBeenCalledWith(
          expect.objectContaining({
            poi: expect.objectContaining({
              appearance: expect.objectContaining({
                equipmentIcons: equipment,
                resourceIcons: resource,
              }),
            }),
          }),
          undefined,
          2,
        )
      }
    })
  })
})
