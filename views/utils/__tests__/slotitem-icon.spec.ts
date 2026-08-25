const mockReadKcsResource = jest.fn()
const mockReadKcsResourceOverride = jest.fn()
const mockReaddirSync = jest.fn()
const mockCrop = jest.fn()
const mockCreateFromBitmap = jest.fn()

jest.mock('@electron/remote', () => ({
  require: () => ({
    readKcsResource: mockReadKcsResource,
    readKcsResourceOverride: mockReadKcsResourceOverride,
  }),
}))

jest.mock('fs-extra', () => ({ readdirSync: mockReaddirSync }))
jest.mock('views/env', () => ({ ROOT: 'C:\\poi' }))

jest.mock('electron', () => ({
  nativeImage: {
    createFromBuffer: () => ({ crop: mockCrop }),
    createFromBitmap: mockCreateFromBitmap,
  },
}))

describe('slotitem icon map', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockReadKcsResourceOverride.mockResolvedValue(undefined)
    mockReaddirSync.mockReturnValue([])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('restores a clockwise-packed atlas frame and exposes a PNG object', async () => {
    const pixel = (value: number) => Buffer.alloc(4, value)
    const packedBitmap = Buffer.concat([pixel(5), pixel(3), pixel(1), pixel(6), pixel(4), pixel(2)])
    const restoredImage = {
      isEmpty: () => false,
      toDataURL: () => 'data:image/png;base64,restored',
    }

    mockReadKcsResource
      .mockResolvedValueOnce(
        Buffer.from(
          JSON.stringify({
            frames: {
              common_icon_weapon_id_7: {
                frame: { x: 0, y: 0, w: 3, h: 2 },
                rotated: true,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(Buffer.from('atlas'))
    mockCrop.mockReturnValue({
      getSize: () => ({ width: 3, height: 2 }),
      toBitmap: () => packedBitmap,
    })
    mockCreateFromBitmap.mockReturnValue(restoredImage)

    const { getSlotitemIcon, initSlotitemIconMap } = require('../slotitem-icon')

    await expect(initSlotitemIconMap('example.invalid')).resolves.toBe(true)
    expect(mockCreateFromBitmap).toHaveBeenCalledWith(
      Buffer.concat([pixel(1), pixel(2), pixel(3), pixel(4), pixel(5), pixel(6)]),
      { width: 2, height: 3 },
    )
    expect(getSlotitemIcon(7)).toEqual({
      src: 'data:image/png;base64,restored',
    })
    expect(Object.isFrozen(getSlotitemIcon(7))).toBe(true)

    await expect(initSlotitemIconMap('example.invalid')).resolves.toBe(true)
    expect(mockReadKcsResource).toHaveBeenCalledTimes(2)

    const updatedImage = {
      isEmpty: () => false,
      toDataURL: () => 'data:image/png;base64,updated',
    }
    mockReadKcsResource
      .mockResolvedValueOnce(
        Buffer.from(
          JSON.stringify({
            frames: {
              common_icon_weapon_id_8: {
                frame: { x: 0, y: 0, w: 2, h: 3 },
                rotated: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(Buffer.from('updated-atlas'))
    mockCrop.mockReturnValue(updatedImage)

    await expect(initSlotitemIconMap('another.invalid')).resolves.toBe(true)
    expect(mockReadKcsResource).toHaveBeenCalledTimes(4)
    expect(getSlotitemIcon(7)).toBeUndefined()
    expect(getSlotitemIcon(8)).toEqual({
      src: 'data:image/png;base64,updated',
    })

    mockReadKcsResource.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined)
    await expect(initSlotitemIconMap('failed.invalid')).resolves.toBe(false)
    expect(getSlotitemIcon(8)).toEqual({
      src: 'data:image/png;base64,updated',
    })

    await expect(initSlotitemIconMap('another.invalid')).resolves.toBe(true)
    expect(mockReadKcsResource).toHaveBeenCalledTimes(6)
  })

  it('selects override, original and bundled PNGs independently by icon ID', async () => {
    const png = (src: string) => ({
      isEmpty: () => false,
      toDataURL: () => src,
    })

    mockReaddirSync.mockReturnValue(['161.png', '-1.png'])
    mockReadKcsResource
      .mockResolvedValueOnce(
        Buffer.from(
          JSON.stringify({
            frames: {
              common_icon_weapon_id_59: {
                frame: { x: 0, y: 0, w: 54, h: 54 },
                rotated: false,
              },
              common_icon_weapon_id_60: {
                frame: { x: 54, y: 0, w: 54, h: 54 },
                rotated: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(Buffer.from('original-atlas'))
    mockReadKcsResourceOverride
      .mockResolvedValueOnce(
        Buffer.from(
          JSON.stringify({
            frames: {
              common_icon_weapon_id_59: {
                frame: { x: 0, y: 0, w: 54, h: 54 },
                rotated: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(Buffer.from('override-atlas'))
    mockCrop
      .mockReturnValueOnce(png('data:image/png;base64,original-59'))
      .mockReturnValueOnce(png('data:image/png;base64,original-60'))
      .mockReturnValueOnce(png('data:image/png;base64,override-59'))

    const { getSlotitemIcon, initSlotitemIconMap } = require('../slotitem-icon')

    await expect(initSlotitemIconMap('example.invalid')).resolves.toBe(true)
    expect(getSlotitemIcon(59)).toEqual({
      src: 'data:image/png;base64,override-59',
    })
    expect(getSlotitemIcon(60)).toEqual({
      src: 'data:image/png;base64,original-60',
    })
    expect(getSlotitemIcon(61)?.src).toContain('161.png')
    expect(getSlotitemIcon(62)).toBeUndefined()
  })

  it('skips an invalid frame without discarding other frames from the atlas', async () => {
    const frameError = new Error('invalid frame')
    const warn = jest.spyOn(console, 'warn').mockImplementation()
    mockReadKcsResource
      .mockResolvedValueOnce(
        Buffer.from(
          JSON.stringify({
            frames: {
              common_icon_weapon_id_1: {
                frame: { x: 0, y: 0, w: 54, h: 54 },
                rotated: false,
              },
              common_icon_weapon_id_2: {
                frame: { x: 54, y: 0, w: 54, h: 54 },
                rotated: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(Buffer.from('atlas'))
    mockCrop.mockImplementationOnce(() => {
      throw frameError
    })
    mockCrop.mockReturnValueOnce({
      isEmpty: () => false,
      toDataURL: () => 'data:image/png;base64,valid-frame',
    })

    const { getSlotitemIcon, initSlotitemIconMap } = require('../slotitem-icon')

    await expect(initSlotitemIconMap('example.invalid')).resolves.toBe(true)
    expect(getSlotitemIcon(1)).toBeUndefined()
    expect(getSlotitemIcon(2)).toEqual({
      src: 'data:image/png;base64,valid-frame',
    })
    expect(warn).toHaveBeenCalledWith(
      'slotitem-icon: failed to parse original frame common_icon_weapon_id_1',
      frameError,
    )
  })
})
