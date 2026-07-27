// Leave-one-out check of fcd/map-ocr.js against the hand-curated names in
// fcd/map.json: for every map, rebuild the template library with that map's own
// samples removed, then read its names back off the art and compare.
//
// This is the accuracy measurement behind trusting the "ocr" name source, and
// it is worth re-running whenever map-ocr.js changes. It needs a populated
// resource cache, so run fcd/gen-map.js once first.
//
// Usage: node fcd/verify-map-ocr.js [--cache fcd/.cache-map]

const path = require('path')
const { parseArgs } = require('util')

const ocr = require('./map-ocr')
const curated = require('./map.json')

const { values: args } = parseArgs({
  options: { cache: { type: 'string', default: path.resolve(__dirname, '.cache-map') } },
})
const C = path.resolve(args.cache)

const main = async () => {
  const t0 = Date.now()
  const samples = new Map()
  await ocr.harvestSprites(C, samples)
  console.info(`sprite samples: ${[...samples.values()].reduce((n, l) => n + l.length, 0)}`)
  await ocr.harvestCurated(C, curated, samples)
  console.info(
    `total samples: ${[...samples.values()].reduce((n, l) => n + l.length, 0)} over ${samples.size} names (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
  )

  let ok = 0,
    wrong = 0,
    unplaced = 0,
    unread = 0
  const problems = []
  for (const id of Object.keys(curated)) {
    const [area, no] = id.split('-').map(Number)
    const loaded = await ocr.loadPointLayer(C, area, no)
    if (!loaded) continue
    // leave this map out of the library entirely
    const held = new Map()
    for (const [name, list] of samples) {
      const kept = list.filter((s) => s.source !== `map ${id}`)
      if (kept.length) held.set(name, kept)
    }
    const library = { words: ocr.consolidate(held) }

    const known = Object.entries(curated[id].spots).map(([name, [x, y]]) => ({ name, x, y }))
    const words = ocr.extractWords(loaded.layer, loaded)
    const read = ocr.readBakedLabels(loaded.layer, { ...loaded, library })
    unread += words.length - read.length
    for (const f of read) {
      let best = null,
        bd = Infinity
      for (const s of known) {
        const d = Math.hypot(s.x - f.x, s.y - f.y)
        if (d < bd) {
          bd = d
          best = s
        }
      }
      if (!best || bd > 40) {
        unplaced++
        continue
      }
      if (best.name === f.name) ok++
      else {
        wrong++
        problems.push(
          `${id}: read "${f.name}" at ${f.x},${f.y} -> spot "${best.name}" (d=${bd.toFixed(0)}, score=${f.score.toFixed(3)}, margin=${f.margin.toFixed(3)})`,
        )
      }
    }
  }
  console.info(
    `\ncorrect: ${ok}  wrong: ${wrong}  unplaced: ${unplaced}  words-not-recognised: ${unread}`,
  )
  console.info(problems.slice(0, 40).join('\n'))
  console.info(`${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
