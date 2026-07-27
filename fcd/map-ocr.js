// Reading spot names out of the game's map art, for fcd/gen-map.js.
//
// Spot names live in two different places in the kcs2 map resources:
//
//   * Spots revealed later in an event ("secret" _info<N>.json files) carry an
//     explicit `labels: [{x, y, img}]` array, where `img` is the name -- either
//     bare ("E1") or prefixed ("62-5_text_E1"). Those need no recognition at
//     all; gen-map.js reads them directly.
//   * Spots visible from the start have their names baked into the flattened
//     `*_point` background layer, as pixels. This module reads those.
//
// Recognition is whole-word template matching, not a general OCR. The game
// draws the baked-in text and the standalone label sprites from the same font
// at the same size, and the two are pixel-identical on the alpha channel, so an
// exact-match library is enough -- no classifier, no training, no dependency
// beyond the PNG decoder already used elsewhere in fcd/.
//
// The library is built from two sources:
//
//   1. The label sprites in the secret sheets. Their frame name IS the spot
//      name, so these samples are self-labelling and cannot be wrong. They only
//      ever cover names revealed mid-event, though, so they systematically miss
//      the early names (A, A1, B, C, ...) that the baked-in layer is made of.
//   2. The baked-in layers of the maps fcd/map.json already covers. Those names
//      are known (hand-curated over years), so every word found in one of those
//      layers can be labelled by the spot it sits next to. This is what fills in
//      A, A1, B, ... The nearest-spot guess is occasionally wrong, so samples
//      are majority-voted per name and a name backed by a single sample is kept
//      only when nothing contradicts it.
//
// Characters are deliberately NOT segmented: the font kerns the outlines of
// adjacent characters into one connected blob ("A4" is a single component), so
// per-character templates cannot be cut out reliably. A name the library has
// never seen is reported as unread rather than guessed at.

const fs = require('fs-extra')
const path = require('path')
const { PNG } = require('pngjs')

// A bitmap here is always alpha-only: { w, h, a: Uint8Array }.
const INK = 40 // alpha above this counts as ink
const SPRITE_NAME_RE = /^(?:[A-Z]{1,3}\d{0,2}|\d)$/

// ---------------------------------------------------------------------------
// bitmaps
// ---------------------------------------------------------------------------

const frameAlpha = (png, frame) => {
  const a = new Uint8Array(frame.w * frame.h)
  for (let y = 0; y < frame.h; y++) {
    for (let x = 0; x < frame.w; x++) {
      a[y * frame.w + x] = png.data[((frame.y + y) * png.width + frame.x + x) * 4 + 3]
    }
  }
  return { w: frame.w, h: frame.h, a }
}

const tightBox = (bm) => {
  let x0 = bm.w,
    y0 = bm.h,
    x1 = -1,
    y1 = -1
  for (let y = 0; y < bm.h; y++) {
    for (let x = 0; x < bm.w; x++) {
      if (bm.a[y * bm.w + x] > INK) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

const crop = (bm, box) => {
  const a = new Uint8Array(box.w * box.h)
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const sy = box.y + y
      const sx = box.x + x
      if (sy >= 0 && sy < bm.h && sx >= 0 && sx < bm.w) a[y * box.w + x] = bm.a[sy * bm.w + sx]
    }
  }
  return { w: box.w, h: box.h, a }
}

const trim = (bm) => {
  const box = tightBox(bm)
  return box ? crop(bm, box) : null
}

// Mean absolute alpha difference over the union of both bitmaps, as a 0..1
// similarity. Both are trimmed to their ink, so a size mismatch is itself
// strong evidence of a different word.
const similarity = (a, b) => {
  const w = Math.max(a.w, b.w)
  const h = Math.max(a.h, b.h)
  let sum = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const va = x < a.w && y < a.h ? a.a[y * a.w + x] : 0
      const vb = x < b.w && y < b.h ? b.a[y * b.w + x] : 0
      sum += Math.abs(va - vb)
    }
  }
  return 1 - sum / (255 * w * h)
}

// Best similarity over a 1px alignment search: the baked-in text can sit a
// pixel off the standalone sprite's own trim.
const bestSimilarity = (a, b, radius = 1) => {
  let best = 0
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const shifted = dx === 0 && dy === 0 ? a : crop(a, { x: -dx, y: -dy, w: a.w, h: a.h })
      const s = similarity(shifted, b)
      if (s > best) best = s
    }
  }
  return best
}

const encode = (bm) => ({ w: bm.w, h: bm.h, a: Buffer.from(bm.a).toString('base64') })
const decode = (o) => ({ w: o.w, h: o.h, a: new Uint8Array(Buffer.from(o.a, 'base64')) })

// ---------------------------------------------------------------------------
// pulling words out of a flattened point layer
// ---------------------------------------------------------------------------

const components = (bm) => {
  const seen = new Uint8Array(bm.w * bm.h)
  const out = []
  for (let y = 0; y < bm.h; y++) {
    for (let x = 0; x < bm.w; x++) {
      const i = y * bm.w + x
      if (seen[i] || bm.a[i] <= INK) continue
      const stack = [i]
      seen[i] = 1
      let x0 = x,
        x1 = x,
        y0 = y,
        y1 = y
      while (stack.length) {
        const p = stack.pop()
        const px = p % bm.w
        const py = (p - px) / bm.w
        if (px < x0) x0 = px
        if (px > x1) x1 = px
        if (py < y0) y0 = py
        if (py > y1) y1 = py
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx
            const ny = py + dy
            if (nx < 0 || ny < 0 || nx >= bm.w || ny >= bm.h) continue
            const ni = ny * bm.w + nx
            if (seen[ni] || bm.a[ni] <= INK) continue
            seen[ni] = 1
            stack.push(ni)
          }
        }
      }
      out.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 })
    }
  }
  return out
}

// Node circles and route arrows share the layer with the text; erase them so
// they neither merge into a word nor get matched as one. Arrows are erased
// through their own sprite's alpha, which is exact; circles have no sprite of
// their own, so they go by radius.
const eraseNonText = (bm, { spots, routeSprites, circleRadius }) => {
  const out = { w: bm.w, h: bm.h, a: Uint8Array.from(bm.a) }
  const clear = (x, y) => {
    if (x >= 0 && y >= 0 && x < out.w && y < out.h) out.a[y * out.w + x] = 0
  }
  for (const [cx, cy] of spots) {
    for (let dy = -circleRadius; dy <= circleRadius; dy++) {
      for (let dx = -circleRadius; dx <= circleRadius; dx++) {
        if (dx * dx + dy * dy <= circleRadius * circleRadius) clear(cx + dx, cy + dy)
      }
    }
  }
  for (const { bm: sprite, x, y } of routeSprites) {
    for (let sy = 0; sy < sprite.h; sy++) {
      for (let sx = 0; sx < sprite.w; sx++) {
        if (sprite.a[sy * sprite.w + sx] === 0) continue
        // 1px dilation: the flattened layer keeps anti-aliased edges that the
        // standalone sprite trims away
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) clear(x + sx + dx, y + sy + dy)
        }
      }
    }
  }
  return out
}

// Merges character components back into words: same text line, small gap.
const groupWords = (boxes) => {
  const sorted = [...boxes].sort((a, b) => a.x - b.x)
  const used = new Uint8Array(sorted.length)
  const words = []
  for (let i = 0; i < sorted.length; i++) {
    if (used[i]) continue
    used[i] = 1
    let box = sorted[i]
    let grew = true
    while (grew) {
      grew = false
      for (let j = 0; j < sorted.length; j++) {
        if (used[j]) continue
        const b = sorted[j]
        const gap = b.x - (box.x + box.w)
        const overlap = Math.min(box.y + box.h, b.y + b.h) - Math.max(box.y, b.y)
        if (gap >= -3 && gap <= 3 && overlap >= Math.min(box.h, b.h) * 0.5) {
          const x0 = Math.min(box.x, b.x)
          const y0 = Math.min(box.y, b.y)
          box = {
            x: x0,
            y: y0,
            w: Math.max(box.x + box.w, b.x + b.w) - x0,
            h: Math.max(box.y + box.h, b.y + b.h) - y0,
          }
          used[j] = 1
          grew = true
        }
      }
    }
    words.push(box)
  }
  return words
}

// Text-sized leftovers of the point layer, as trimmed bitmaps.
const extractWords = (pointLayer, { spots, routeSprites, circleRadius = 12 }) => {
  const cleaned = eraseNonText(pointLayer, { spots, routeSprites, circleRadius })
  const boxes = groupWords(components(cleaned).filter((b) => b.h >= 6 && b.h <= 24 && b.w <= 60))
  const words = []
  for (const box of boxes) {
    if (box.h < 10 || box.h > 22 || box.w < 3 || box.w > 50) continue
    const bm = trim(crop(cleaned, box))
    if (bm) words.push({ x: box.x, y: box.y, bm })
  }
  return words
}

// ---------------------------------------------------------------------------
// cache access (everything gen-map.js has already downloaded)
// ---------------------------------------------------------------------------

const mapFiles = (cacheDir, area, no) => {
  const dir = path.join(cacheDir, String(area).padStart(3, '0'))
  const base = String(no).padStart(2, '0')
  return { dir, base, image: path.join(dir, `${base}_image.json`) }
}

// Loads a map's flattened point layer plus everything needed to erase the
// non-text parts of it. Returns null when the map is not in the cache.
const loadPointLayer = async (cacheDir, area, no) => {
  const { dir, base, image } = mapFiles(cacheDir, area, no)
  if (!(await fs.pathExists(image))) return null
  const meta = await fs.readJSON(image)
  const pointKey = Object.keys(meta.frames).find((k) => /_point$/.test(k))
  if (!pointKey) return null
  const pngPath = path.join(dir, `${base}_image.png`)
  if (!(await fs.pathExists(pngPath))) return null
  const info = await fs.readJSON(path.join(dir, `${base}_info.json`))
  const png = PNG.sync.read(await fs.readFile(pngPath))

  const spots = (info.spots ?? []).map((s) => [s.x, s.y])
  const routeSprites = []
  for (const s of info.spots ?? []) {
    if (!s.line) continue
    const suffix = s.line.img ? `_${s.line.img}` : `_route_${s.no}`
    const key = Object.keys(meta.frames).find((k) => k.endsWith(suffix))
    if (!key) continue
    routeSprites.push({
      bm: frameAlpha(png, meta.frames[key].frame),
      x: s.x + s.line.x,
      y: s.y + s.line.y,
    })
  }
  return { layer: frameAlpha(png, meta.frames[pointKey].frame), spots, routeSprites }
}

// ---------------------------------------------------------------------------
// library
// ---------------------------------------------------------------------------

const addSample = (samples, name, bm, source) => {
  if (!samples.has(name)) samples.set(name, [])
  samples.get(name).push({ bm, source })
}

// Self-labelling samples: a secret sheet's label sprite is named after the spot.
const harvestSprites = async (cacheDir, samples) => {
  const dirs = (await fs.readdir(cacheDir)).filter((d) => /^\d{3}$/.test(d))
  for (const dir of dirs) {
    const files = (await fs.readdir(path.join(cacheDir, dir))).filter((f) =>
      /^\d\d_image\d+\.json$/.test(f),
    )
    for (const file of files) {
      const meta = await fs.readJSON(path.join(cacheDir, dir, file))
      const pngPath = path.join(cacheDir, dir, file.replace('.json', '.png'))
      if (!(await fs.pathExists(pngPath))) continue
      const entries = Object.entries(meta.frames)
        .map(([key, fr]) => [key.match(/^map\d+_(?:.*_text_)?(.+)$/)?.[1], fr])
        .filter(([name]) => name && SPRITE_NAME_RE.test(name))
      if (!entries.length) continue
      const png = PNG.sync.read(await fs.readFile(pngPath))
      for (const [name, fr] of entries) {
        const bm = trim(frameAlpha(png, fr.frame))
        if (bm) addSample(samples, name, bm, `sprite ${dir}/${file}`)
      }
    }
  }
}

// Samples labelled by the curated fcd/map.json: every word in a known map's
// point layer belongs to the spot it sits next to.
const harvestCurated = async (cacheDir, curated, samples, { maxDistance = 30 } = {}) => {
  for (const [id, data] of Object.entries(curated)) {
    const [area, no] = id.split('-').map(Number)
    const loaded = await loadPointLayer(cacheDir, area, no)
    if (!loaded) continue
    const known = Object.entries(data.spots).map(([name, [x, y]]) => ({ name, x, y }))
    for (const word of extractWords(loaded.layer, loaded)) {
      let best = null
      let bd = Infinity
      for (const s of known) {
        const d = Math.hypot(s.x - word.x, s.y - word.y)
        if (d < bd) {
          bd = d
          best = s
        }
      }
      if (best && bd <= maxDistance) addSample(samples, best.name, word.bm, `map ${id}`)
    }
  }
}

// One canonical bitmap per name: the rendering the most samples agree on.
// `votes` is how many samples backed it, which the matcher uses to be stricter
// about names that only ever showed up once.
const consolidate = (samples) => {
  const words = new Map()
  for (const [name, list] of samples) {
    let best = list[0]
    let bestVotes = -1
    for (const cand of list) {
      const votes = list.filter((s) => similarity(s.bm, cand.bm) > 0.99).length
      if (votes > bestVotes) {
        bestVotes = votes
        best = cand
      }
    }
    words.set(name, { bm: best.bm, votes: bestVotes, samples: list.length })
  }
  return words
}

// Builds (or loads) the template library. `curated` is the current
// fcd/map.json; pass it so the maps poi already knows contribute their names.
const buildGlyphLibrary = async (cacheDir, { curated = {}, refresh = false } = {}) => {
  const libPath = path.join(cacheDir, 'glyphs.json')
  if (!refresh && (await fs.pathExists(libPath))) {
    const raw = await fs.readJSON(libPath)
    return {
      words: new Map(Object.entries(raw.words).map(([k, v]) => [k, { ...v, bm: decode(v.bm) }])),
      builtAt: raw.builtAt,
    }
  }

  const samples = new Map()
  await harvestSprites(cacheDir, samples)
  await harvestCurated(cacheDir, curated, samples)
  const words = consolidate(samples)

  await fs.outputJSON(libPath, {
    builtAt: new Date().toISOString(),
    words: Object.fromEntries(
      [...words].map(([k, v]) => [k, { votes: v.votes, samples: v.samples, bm: encode(v.bm) }]),
    ),
  })
  return { words, builtAt: new Date().toISOString() }
}

// ---------------------------------------------------------------------------
// recognition
// ---------------------------------------------------------------------------

// Reads every name the flattened point layer draws. Returns
// [{ name, x, y, score, margin }] with x,y the word's top-left in map
// coordinates -- the same convention the game's own `labels` arrays use.
// Words that match nothing confidently are simply left out; gen-map.js reports
// the spots that were left without a name.
const readBakedLabels = (
  pointLayer,
  { spots, routeSprites, library, minScore = 0.9, minMargin = 0.01, circleRadius = 12 },
) => {
  const found = []
  for (const word of extractWords(pointLayer, { spots, routeSprites, circleRadius })) {
    let best = null
    let second = 0
    for (const [name, entry] of library.words) {
      const t = entry.bm
      if (Math.abs(t.w - word.bm.w) > 2 || Math.abs(t.h - word.bm.h) > 2) continue
      const s = bestSimilarity(word.bm, t)
      if (!best || s > best.score) {
        if (best) second = Math.max(second, best.score)
        best = { name, score: s, votes: entry.votes }
      } else if (s > second) {
        second = s
      }
    }
    if (!best) continue
    // a name seen only once during harvesting could itself be a mislabelled
    // sample, so demand a clean match before trusting it
    const scoreFloor = best.votes >= 2 ? minScore : Math.max(minScore, 0.97)
    if (best.score < scoreFloor || best.score - second < minMargin) continue
    found.push({
      name: best.name,
      x: word.x,
      y: word.y,
      score: best.score,
      margin: best.score - second,
    })
  }
  return found
}

module.exports = {
  buildGlyphLibrary,
  loadPointLayer,
  readBakedLabels,
  frameAlpha,
  extractWords,
  // exposed for fcd/verify-map-ocr.js, which leaves one map out of the library
  // and checks that map's names can still be read back
  harvestSprites,
  harvestCurated,
  consolidate,
}
