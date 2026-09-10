import fs from 'fs-extra'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { IconSet } from '../../../../lib/icon-set'
import type * as IconComponents from '../icon'

import config from '../../../../lib/config'

jest.mock('fs-extra', () => ({
  ...jest.requireActual('fs-extra'),
  accessSync: jest.fn(() => {
    throw new Error('No stored config')
  }),
  writeFileSync: jest.fn(),
}))
jest.mock('views/env', () => ({ ROOT: process.cwd() }))
jest.mock('views/create-store', () => ({
  store: { subscribe: jest.fn() },
  getStore: () => 'test-server',
}))
jest.mock('views/utils/slotitem-icon', () => ({
  getSlotitemIcon: (id: number) => (id === 999 ? undefined : { src: `game-icon-${id}.png` }),
  getSlotitemIconRevision: () => 0,
  initSlotitemIconMap: jest.fn(),
  subscribeSlotitemIconMap: jest.fn(),
}))

global.config = config
const { SlotitemIcon, MaterialIcon }: typeof IconComponents = require('../icon')

describe('icon set resolution', () => {
  const sets: IconSet[] = ['game', 'classic', 'reconstructed']
  it.each(sets.flatMap((equipment) => sets.map((resource) => [equipment, resource])))(
    'renders equipment %s independently from resources %s',
    (equipment, resource) => {
      config.set('poi.appearance.equipmentIcons', equipment)
      config.set('poi.appearance.resourceIcons', resource)
      const slot = renderToStaticMarkup(<SlotitemIcon slotitemId={6} />)
      const material = renderToStaticMarkup(<MaterialIcon materialId={2} />)
      const directory = (set: IconSet) => (set === 'reconstructed' ? 'svg/reconstructed' : 'svg')
      expect(slot).toContain(
        equipment === 'game' ? 'game-icon-6.png' : `${directory(equipment)}/slotitem/6.svg`,
      )
      expect(material).toContain(
        resource === 'game' ? 'img/material/02.png' : `${directory(resource)}/material/2.svg`,
      )
      expect(slot).toContain(
        `class="${equipment === 'game' ? 'png' : equipment === 'classic' ? 'svg' : 'svg reconstructed'}"`,
      )
    },
  )

  it('uses the actual fallback format and canvas class for missing vector artwork', () => {
    config.set('poi.appearance.equipmentIcons', 'reconstructed')
    // The classic set has icon 0, but a missing reconstructed icon goes directly to PNG.
    expect(renderToStaticMarkup(<SlotitemIcon slotitemId={0} />)).toContain('game-icon-0.png')
    expect(renderToStaticMarkup(<SlotitemIcon slotitemId={0} />)).toContain('class="png"')
    expect(renderToStaticMarkup(<SlotitemIcon slotitemId={998} />)).toContain('game-icon-998.png')
    expect(renderToStaticMarkup(<SlotitemIcon slotitemId={998} />)).toContain('class="png"')
    expect(renderToStaticMarkup(<SlotitemIcon slotitemId={999} />)).toContain('img/slotitem/-1.png')
  })

  it('falls back to the resource PNG even when the classic SVG exists', () => {
    const existsSync = fs.existsSync
    const spy = jest
      .spyOn(fs, 'existsSync')
      .mockImplementation((path) =>
        String(path).endsWith('/reconstructed/material/7.svg') ? false : existsSync(path),
      )
    try {
      config.set('poi.appearance.resourceIcons', 'reconstructed')
      const material = renderToStaticMarkup(<MaterialIcon materialId={7} />)
      expect(material).toContain('img/material/07.png')
      expect(material).toContain('class="png"')
      config.set('poi.appearance.resourceIcons', 'classic')
      expect(renderToStaticMarkup(<MaterialIcon materialId={7} />)).toContain('svg/material/7.svg')
    } finally {
      spy.mockRestore()
    }
  })
})
