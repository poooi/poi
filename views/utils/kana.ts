import { toRomaji } from 'wanakana'

/**
 * Loose romaji matching, for searching ship names by their reading.
 *
 * `api_yomi` is hiragana for Japanese ships and katakana for foreign ones, so a
 * user typing "kasumi" has nothing to match against directly. wanakana does the
 * transliteration; this module's job is to fold its Hepburn output and the
 * user's query onto one spelling, so Hepburn ("shimakaze"), Kunrei
 * ("simakaze") and the usual in-between spellings all reach the same entry.
 *
 * Accuracy is deliberately traded for recall: the goal is that a reasonable
 * spelling finds the ship, not that the output is publishable romaji.
 */

/**
 * Alternate spellings folded onto one canonical form. Order matters: the
 * longer sequences have to be tried before the shorter ones they contain.
 */
const SPELLING_FOLDS: [RegExp, string][] = [
  // wanakana marks a syllabic n as in "jun'you"
  [/['’]/g, ''],
  [/shi/g, 'si'],
  [/sha/g, 'sya'],
  [/shu/g, 'syu'],
  [/sho/g, 'syo'],
  [/chi/g, 'ti'],
  [/cha/g, 'tya'],
  [/chu/g, 'tyu'],
  [/cho/g, 'tyo'],
  [/tsu/g, 'tu'],
  [/ja/g, 'zya'],
  [/ju/g, 'zyu'],
  [/jo/g, 'zyo'],
  [/ji/g, 'zi'],
  [/di/g, 'zi'],
  [/fu/g, 'hu'],
  [/[lr]/g, 'r'],
  [/[cq]/g, 'k'],
  [/v/g, 'b'],
  // Long vowels are written inconsistently; collapse them everywhere.
  [/ou/g, 'o'],
  [/([aiueo])\1+/g, '$1'],
]

/**
 * Folds a romaji string onto the canonical spelling. Applied to both the
 * transliterated reading and the user's query so either romanisation matches.
 */
export const normalizeRomaji = (input: string): string => {
  let out = input.toLowerCase()
  for (const [pattern, replacement] of SPELLING_FOLDS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

/**
 * The searchable romaji form of a name.
 *
 * wanakana leaves non-kana text alone, so this accepts an already-romanised
 * name ("Shimakaze" from poi-plugin-translator) just as happily as a kana
 * reading — both come out folded onto the same spelling.
 */
export const romajiOf = (reading: string | undefined): string =>
  reading ? normalizeRomaji(toRomaji(reading)) : ''

/**
 * Does a romaji query match this name? Substring matching, so "kasu" finds
 * かすみ. Works against a kana reading or an existing romanisation.
 */
export const matchesRomaji = (query: string, reading: string | undefined): boolean => {
  if (!query || !reading) return false
  return romajiOf(reading).includes(normalizeRomaji(query))
}
