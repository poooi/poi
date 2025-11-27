import _ from 'lodash'
import reducer from '../presets'

const spec = it

// Note: partial definitions containing only essentials.
interface PresetDeck {
  api_preset_no: number
  api_name: string
  api_ship: Array<number>
}

type Decks = Record<number, PresetDeck>

interface PresetsState {
  api_max_num: number
  api_deck: Decks
}

describe('presets reducer', () => {
  const mkDeck = (): Decks => ({
    1: { api_preset_no: 1, api_name: 'ps 1', api_ship: [114, 514, 1919, 810_0721, -1, -1, -1] },
    4: { api_preset_no: 4, api_name: 'ps 4', api_ship: [1, 2, 3, 4, 5, 6, -1] },
    12: { api_preset_no: 12, api_name: 'ps 12', api_ship: [1, 2, 3, -1, -1, -1, -1] },
  })
  const mkInitState = (): PresetsState => ({
    ...reducer(undefined, { type: '@@INIT' }),
    api_deck: mkDeck(),
  })

  const mkAction = (src: number | string, dst: number | string) => ({
    type: '@@Response/kcsapi/api_req_hensei/preset_order_change',
    postBody: {
      api_verno: '1',
      api_preset_from: String(src),
      api_preset_to: String(dst),
    },
  })

  const expectApiPresetNumberingConsistency = (state: PresetsState) => _.forOwn(state.api_deck, (value, key) => {
    expect(typeof value.api_preset_no).toBe('number')
    expect(value.api_preset_no).toBe(parseInt(key, 10))
  })

  describe('api_req_hensei/preset_order_change', () => {
    spec('swap existing presets', () => {
      const mut = reducer(mkInitState(), mkAction(1, 12))
      expectApiPresetNumberingConsistency(mut)
      expect(_.get(mut.api_deck, ['12', 'api_name'])).toBe('ps 1')
      expect(_.get(mut.api_deck, ['1', 'api_name'])).toBe('ps 12')
    })

    spec('swap existing into empty', () => {
      const mut = reducer(mkInitState(), mkAction(4, 2))
      expectApiPresetNumberingConsistency(mut)
      expect(_.get(mut.api_deck, ['2', 'api_name'])).toBe('ps 4')
      expect(_.get(mut.api_deck, ['4'])).toBeUndefined()
    })

    spec('swap empty into existing (no UI coverage)', () => {
      const mut = reducer(mkInitState(), mkAction(16, 12))
      expectApiPresetNumberingConsistency(mut)
      expect(_.get(mut.api_deck, ['12'])).toBeUndefined()
      expect(_.get(mut.api_deck, ['16', 'api_name'])).toBe('ps 12')
    })

    spec('noop', () =>
      expect(
        reducer(mkInitState(), mkAction(5, 5))
      ).toStrictEqual(mkInitState()))
  })
})
