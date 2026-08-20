import { matchesRomaji, normalizeRomaji, romajiOf } from '../kana'

const spec = it

describe('normalizeRomaji', () => {
  spec('folds Hepburn onto the canonical spelling', () => {
    expect(normalizeRomaji('shimakaze')).toBe(normalizeRomaji('simakaze'))
    expect(normalizeRomaji('chitose')).toBe(normalizeRomaji('titose'))
    expect(normalizeRomaji('junyou')).toBe(normalizeRomaji('zyunyou'))
    expect(normalizeRomaji('fusou')).toBe(normalizeRomaji('husou'))
    expect(normalizeRomaji('tsushima')).toBe(normalizeRomaji('tusima'))
  })

  spec("drops wanakana's syllabic-n apostrophe", () => {
    expect(normalizeRomaji("jun'you")).toBe(normalizeRomaji('junyou'))
  })

  spec('collapses long vowels', () => {
    expect(normalizeRomaji('ryuujou')).toBe(normalizeRomaji('ryujo'))
  })
})

describe('romajiOf', () => {
  spec('transliterates readings in either script', () => {
    expect(romajiOf('かすみ')).toBe('kasumi')
    expect(romajiOf('カスミ')).toBe('kasumi')
  })

  spec('is empty for a missing reading', () => {
    expect(romajiOf(undefined)).toBe('')
    expect(romajiOf('')).toBe('')
  })
})

describe('matchesRomaji', () => {
  const cases: [string, string][] = [
    ['kasumi', 'かすみ'],
    ['kasu', 'かすみ'],
    ['shimakaze', 'しまかぜ'],
    ['simakaze', 'しまかぜ'],
    ['yukikaze', 'ゆきかぜ'],
    ['yamato', 'やまと'],
    ['fusou', 'ふそう'],
    ['husou', 'ふそう'],
    ['junyou', 'じゅんよう'],
    ['zyunyou', 'じゅんよう'],
    ['ryuujou', 'りゅうじょう'],
    ['ryujo', 'りゅうじょう'],
    ['chitose', 'ちとせ'],
    ['titose', 'ちとせ'],
    // sokuon and katakana readings
    ['happu', 'はっぷ'],
    ['supaito', 'ウォースパイト'],
    ['kasumi', 'カスミ'],
  ]

  cases.forEach(([query, reading]) => {
    spec(`"${query}" matches ${reading}`, () => {
      expect(matchesRomaji(query, reading)).toBe(true)
    })
  })

  spec('rejects unrelated readings', () => {
    expect(matchesRomaji('yamato', 'かすみ')).toBe(false)
    expect(matchesRomaji('kasumi', 'ゆきかぜ')).toBe(false)
  })

  spec('is false for empty input', () => {
    expect(matchesRomaji('', 'かすみ')).toBe(false)
    expect(matchesRomaji('kasumi', undefined)).toBe(false)
  })
})

describe('matching an existing romanisation', () => {
  // poi-plugin-translator supplies curated English names, which for Japanese
  // ships are already romaji. wanakana passes them through untouched, so the
  // same fold applies and Kunrei input finds a Hepburn name.
  const cases: [string, string][] = [
    ['shimakaze', 'Shimakaze'],
    ['simakaze', 'Shimakaze'],
    ['junyou', "Jun'you"],
    ['zyunyou', "Jun'you"],
    ['ryuujou', 'Ryuujou'],
    ['ryujo', 'Ryuujou'],
    ['fusou', 'Fusou'],
    ['husou', 'Fusou'],
    ['kasumi', 'Kasumi Kai Ni'],
    ['warspite', 'Warspite'],
  ]

  cases.forEach(([query, name]) => {
    spec(`"${query}" matches the translated name ${name}`, () => {
      expect(matchesRomaji(query, name)).toBe(true)
    })
  })

  spec('still rejects unrelated names', () => {
    expect(matchesRomaji('yamato', 'Shimakaze')).toBe(false)
  })

  spec('a kana reading and its romanisation fold to the same form', () => {
    expect(romajiOf('しまかぜ')).toBe(romajiOf('Shimakaze'))
    expect(romajiOf('じゅんよう')).toBe(romajiOf("Jun'you"))
  })
})
