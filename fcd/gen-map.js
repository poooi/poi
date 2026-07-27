// Regenerate fcd/map.json (sortie map routes/spots) straight from the game's
// own kcs2 map resources, and render an HTML review page so the result can be
// eyeballed against the map art before committing.
//
// Port of the extraction in https://github.com/KagamiChan/kcs2-mapdata
// (get-map.ts + map-generate.ts), with the manual Electron annotation step
// replaced by carrying spot names over from the current fcd/map.json.
//
// Data per map lives at /kcs2/resources/map/<area:3>/<no:2>_{info,image}.json
// (+ _image.png):
//   info.bg     background sprite names; the "*_point" layer is the game's own
//               rendering of the node circles AND their letters -- that layer
//               is what makes the review page a real verification.
//   info.spots  one entry per route number: the destination coordinate, plus a
//               `line` offset to the route-arrow sprite. A spot without `line`
//               is a sortie start. The arrow sprite is centred on the segment,
//               so reflecting the destination through the sprite centre gives
//               the segment's other end, which is then snapped to the nearest
//               known spot.
// Event maps hide later spots in "secret" files (_info<N>.json, N = number of
// spots revealed so far); those are merged in the same way the game does.
//
// Worlds past 10 are events, and only one event is ever live -- the one
// api_mst_mapinfo lists. Every other event area in map.json is finished and can
// never change again, so those are skipped by default (--all-events to include
// them); their existing entries are kept as-is.
//
// Names (A, B, ... / 1, 2, ... for starts) come from the game where possible:
// spots revealed mid-event are named outright in the secret files' `labels`
// arrays, and the rest have their names painted into the flattened `*_point`
// layer, which fcd/map-ocr.js reads back by template matching. Resolution
// order, each recorded on the spot so the review page can colour it:
//   1. --names override file (same shape as kcs2-mapdata's notation.json)
//   2. the current fcd/map.json, matched by exact coordinate ("exact")
//   3. the game's own `labels` data ("label")
//   4. the name read off the map art ("ocr")
//   5. the current fcd/map.json, matched by nearest coordinate within --snap
//      (the game nudges nodes around between updates) -> "moved"
//   6. guessed: next unused letter in first-appearance order (starts: next
//      unused number) -> "guessed", ALWAYS needs manual review.
// Whenever the game states a name and something else won, the spot is reported
// as a name clash rather than silently overwritten; --prefer-game-names flips
// steps 2 and 3/4 so the game wins instead.
//
// Usage:
//   node fcd/gen-map.js --start2 <api_start2 capture or response JSON>
// Options:
//   --host <host>       game CDN host (default w01y.kancolle-server.com)
//   --cache <dir>       resource cache dir (default fcd/.cache-map)
//   --only <list>       comma-separated map filter, e.g. "1-3,49-*"
//   --names <file>      spot name overrides, {"1-1":{"260,246":"A"}} (map id
//                       may also be written as "11", as in notation.json)
//   --snap <px>         max distance for reusing a moved spot's name (def 40)
//   --merge-dist <px>   collapse spots this close into one node (default 4)
//   --label-dist <px>   max distance from a spot to its label (default 45)
//   --prefer-game-names let the game's own names override fcd/map.json
//   --no-ocr            skip reading names off the map art
//   --rebuild-glyphs    rebuild the template library used to read the art
//   --all-events        also re-derive finished event maps (needed once on a
//                       cold cache to build a full glyph library)
//   --concurrency <n>   parallel downloads (default 4)
//   --refresh           ignore the cache and re-download
//   --write             write the result into fcd/map.json (run build.js after)
//
// Without --write nothing in the repo is touched; the run only produces
// <cache>/review.html, <cache>/report.json and <cache>/names-todo.json.
//
// Typical run:
//   node fcd/gen-map.js --start2 <capture>       # dry run
//   open fcd/.cache-map/review.html              # check the flagged maps
//   $EDITOR fcd/.cache-map/names-todo.json       # fix any wrong guessed name
//   node fcd/gen-map.js --start2 <capture> --names fcd/.cache-map/names-todo.json --write
//   node fcd/build.js                            # bump meta + emit assets

const fs = require('fs-extra')
const path = require('path')
const { parseArgs } = require('util')

const { buildGlyphLibrary, loadPointLayer, readBakedLabels } = require('./map-ocr')

const MAP_PATH = path.resolve(__dirname, 'map.json')
const MAP_W = 1200
const MAP_H = 720
// Worlds past 10 are events. Only the one listed in api_mst_mapinfo is live.
const EVENT_AREA = 11
// A route's start is snapped to the nearest spot; warn when a runner-up is
// close enough that the choice is not obvious (kcs2-mapdata's FIT_TOLERANCE).
const FIT_TOLERANCE = 0.7

// ---------------------------------------------------------------------------
// fetching
// ---------------------------------------------------------------------------

const mapPool = async (items, concurrency, fn) => {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

const fetchBuffer = async (url) => {
  let lastError
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

// Caches both hits and misses; event maps probe for "secret" files that 404 by
// design, and re-asking the CDN for those on every run is pure noise.
const cachedFetch = async (args, relPath) => {
  const dest = path.join(args.cache, relPath)
  const missMarker = `${dest}.404`
  if (!args.refresh) {
    if (await fs.pathExists(dest)) return fs.readFile(dest)
    if (await fs.pathExists(missMarker)) return null
  }
  const buf = await fetchBuffer(`https://${args.host}/kcs2/resources/map/${relPath}`)
  if (buf == null) {
    await fs.outputFile(missMarker, '')
    return null
  }
  await fs.outputFile(dest, buf)
  await fs.remove(missMarker)
  return buf
}

const cachedFetchJSON = async (args, relPath) => {
  const buf = await cachedFetch(args, relPath)
  return buf == null ? null : JSON.parse(buf.toString('utf-8'))
}

// Downloads one map, merging in any "secret" (initially hidden) spot files.
// Returns null when the map has no resources on this server, which is normal
// for the past event maps that fcd/map.json still carries.
const fetchMap = async (args, area, no) => {
  const dir = String(area).padStart(3, '0')
  const id = String(no).padStart(2, '0')
  const base = `${dir}/${id}`

  const info = await cachedFetchJSON(args, `${base}_info.json`)
  if (info == null) return null
  const image = await cachedFetchJSON(args, `${base}_image.json`)
  if (image == null) return null
  await cachedFetch(args, `${base}_image.png`)

  // frame name -> the png it lives in, so the review page can position sprites
  const frameFiles = {}
  for (const key of Object.keys(image.frames)) frameFiles[key] = `${base}_image.png`

  // Secret files are not event-exclusive: 5-6 for instance splits its later
  // phases off the same way, so probe every map rather than only area > 6.
  info.spots = info.spots ?? []
  let secret = info.spots.length
  for (;;) {
    const secretInfo = await cachedFetchJSON(args, `${base}_info${secret}.json`)
    if (secretInfo == null) break
    const secretImage = await cachedFetchJSON(args, `${base}_image${secret}.json`)
    if (secretImage == null) break
    await cachedFetch(args, `${base}_image${secret}.png`)
    for (const key of Object.keys(secretImage.frames)) {
      image.frames[key] = secretImage.frames[key]
      frameFiles[key] = `${base}_image${secret}.png`
    }
    info.spots = info.spots.concat(secretInfo.spots ?? [])
    info.labels = (info.labels ?? []).concat(secretInfo.labels ?? [])
    if (info.spots.length === secret) break // no new spots: stop probing
    secret = info.spots.length
  }

  // Where each `labels` entry's art lives. The base map's names are baked into
  // the flattened `*_point` layer, but the names revealed later ship as
  // standalone sprites in the delta sheets -- the review page has to blit those
  // itself or the later half of an event map shows no game-drawn names at all.
  const labelSprites = []
  for (const label of info.labels ?? []) {
    const re = new RegExp(`^map\\d+_${escapeRe(String(label.img))}$`)
    const key = Object.keys(image.frames).find((k) => re.test(k))
    if (!key) continue
    labelSprites.push({
      x: label.x,
      y: label.y,
      file: frameFiles[key],
      frame: image.frames[key].frame,
    })
  }

  return { info, image, frameFiles, labelSprites }
}

// ---------------------------------------------------------------------------
// extraction
// ---------------------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const findFrame = (frames, spot) => {
  const suffix = spot.line?.img ? `_${spot.line.img}` : `_route_${spot.no}`
  const re = new RegExp(`${escapeRe(suffix)}$`)
  const key = Object.keys(frames).find((k) => re.test(k))
  return key == null ? null : frames[key]
}

const dist = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by)

// info.spots -> { routes: {no: {start, end}}, spots: {"x,y": {...}} }.
// Coordinates only; naming happens later.
const extract = ({ info, image }, warn) => {
  const routes = {}
  const spots = {}
  let order = 0

  for (const spot of info.spots) {
    const end = [spot.x, spot.y]
    let start = null
    if (spot.line) {
      const frame = findFrame(image.frames, spot)
      if (!frame) {
        warn(`no route sprite for spot no=${spot.no} (img=${spot.line.img ?? 'route_' + spot.no})`)
        continue
      }
      const { w, h } = frame.sourceSize
      // The arrow sprite spans the whole segment, so its centre is the
      // segment's midpoint: reflect the destination through it.
      start = [
        2 * (spot.line.x + Math.round(w / 2)) + spot.x,
        2 * (spot.line.y + Math.round(h / 2)) + spot.y,
      ]
    }
    routes[spot.no] = { start, end }
    const key = end.join()
    if (!spots[key]) spots[key] = { coord: end, order: order++, isStart: start == null }
  }

  return { routes, spots }
}

// The game sometimes re-emits the same node a pixel or two off for a later
// route (45-1's L is 375,392 on one route and 375,391 on another). Those are
// one node on screen and must be one spot here, or the second copy would be
// handed a brand new letter.
const mergeNearby = ({ routes, spots }, { previous, mergeDist }, warn) => {
  const entries = Object.values(spots).sort((a, b) => a.order - b.order)
  const groups = []
  for (const spot of entries) {
    const group = groups.find((g) => g.some((s) => dist(s.coord, spot.coord) <= mergeDist))
    if (group) group.push(spot)
    else groups.push([spot])
  }

  const known = new Set(Object.values(previous?.spots ?? {}).map(([x, y]) => [x, y].join()))
  for (const group of groups) {
    if (group.length === 1) continue
    // keep the coordinate the current map.json already uses, else the round
    // one (the game's art is drawn there), else the first seen
    const keep =
      group.find((s) => known.has(s.coord.join())) ??
      group.find((s) => s.coord.every((n) => n % 10 === 0)) ??
      group[0]
    warn(
      `merging near-duplicate spots ${group.map((s) => s.coord.join()).join(' / ')} ` +
        `into ${keep.coord.join()}`,
    )
    keep.order = Math.min(...group.map((s) => s.order))
    for (const spot of group) {
      if (spot === keep) continue
      delete spots[spot.coord.join()]
      for (const route of Object.values(routes)) {
        if (route.end.join() === spot.coord.join()) route.end = keep.coord
      }
      keep.isStart = keep.isStart || spot.isStart
    }
  }
}

// Two coordinates that the game draws as one node (it re-emits a node at a
// slightly different position for a later route) collapse once they are given
// the same name.
const mergeByName = ({ routes, spots }, warn) => {
  const byName = {}
  for (const [key, spot] of Object.entries(spots)) {
    if (spot.name == null) continue
    ;(byName[spot.name] = byName[spot.name] ?? []).push(key)
  }
  for (const [name, keys] of Object.entries(byName)) {
    if (keys.length === 1) continue
    // prefer the round coordinate: that is the one the game's art is drawn at
    const keep = keys.find((k) => spots[k].coord.every((n) => n % 10 === 0)) ?? keys[0]
    warn(`merging spots ${keys.join(' / ')} into ${keep} (all named ${name})`)
    for (const key of keys) {
      if (key === keep) continue
      delete spots[key]
      for (const route of Object.values(routes)) {
        if (route.end.join() === key) route.end = spots[keep].coord
        if (route.start?.join() === key) route.start = spots[keep].coord
      }
    }
  }
}

// The reflected start is only approximate (sprite rounding), so snap it onto
// the nearest real spot.
const snapRouteStarts = ({ routes, spots }, warn) => {
  const entries = Object.values(spots)
  for (const [no, route] of Object.entries(routes)) {
    if (route.start == null) continue
    const sorted = entries
      .map((spot) => ({ spot, d: dist(spot.coord, route.start) }))
      .sort((a, b) => a.d - b.d)
    const [best, second] = sorted
    if (!best) continue
    if (second && best.d > second.d * FIT_TOLERANCE) {
      warn(
        `route ${no} start is ambiguous: ${best.spot.coord.join()} (${best.d.toFixed(1)}px) vs ` +
          `${second.spot.coord.join()} (${second.d.toFixed(1)}px)`,
      )
    }
    route.start = best.spot.coord
    route.startSnapDistance = best.d
  }
}

// ---------------------------------------------------------------------------
// naming
// ---------------------------------------------------------------------------

// The game states the names of spots revealed mid-event outright, in the
// `labels` array of the secret info files. `img` is either the bare name or
// "<map>_text_<name>".
const gameLabels = ({ info }) =>
  (info.labels ?? []).map(({ x, y, img }) => ({
    x,
    y,
    name: String(img).replace(/^.*_text_/, ''),
    source: 'label',
  }))

// Pairs labels with spots, closest first, one label per spot. A plain
// nearest-spot lookup mixes up neighbours whose labels are drawn on opposite
// sides; requiring both sides to be free resolves those.
const assignLabels = (labels, spots, { maxDistance, warn }) => {
  const pairs = []
  for (const label of labels) {
    for (const spot of spots) {
      const d = Math.hypot(spot.coord[0] - label.x, spot.coord[1] - label.y)
      if (d <= maxDistance) pairs.push({ label, spot, d })
    }
  }
  pairs.sort((a, b) => a.d - b.d)
  const bySpot = new Map()
  const takenLabels = new Set()
  for (const { label, spot, d } of pairs) {
    if (takenLabels.has(label) || bySpot.has(spot)) continue
    takenLabels.add(label)
    bySpot.set(spot, { ...label, distance: d })
  }
  for (const label of labels) {
    if (!takenLabels.has(label)) {
      warn(`${label.source} "${label.name}" at ${label.x},${label.y} sits next to no spot`)
    }
  }
  return bySpot
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const nextFreeName = (isStart, used) => {
  if (isStart) {
    for (let i = 1; ; i++) if (!used.has(String(i))) return String(i)
  }
  for (const letter of LETTERS) if (!used.has(letter)) return letter
  // events run past Z; the game's own convention there is Z1, Z2, ...
  for (let i = 1; ; i++) if (!used.has(`Z${i}`)) return `Z${i}`
}

// Resolves a name for every spot, recording where each name came from so the
// review page can flag the guesses.
const nameSpots = ({ spots }, { overrides, previous, snap, labels, preferGameNames }, warn) => {
  const used = new Set()
  const ordered = Object.values(spots).sort((a, b) => a.order - b.order)
  const fromGame = labels ?? new Map()

  for (const spot of ordered) {
    const name = overrides?.[spot.coord.join()]
    if (name != null && !used.has(name)) {
      spot.name = name
      spot.nameSource = 'override'
      used.add(name)
    }
  }

  // What the game itself says this spot is called, either stated in the data
  // (`label`) or read off the map art (`ocr`).
  const takeGameName = (spot) => {
    const label = fromGame.get(spot)
    if (!label || used.has(label.name)) return false
    spot.name = label.name
    spot.nameSource = label.source
    if (label.score != null) spot.nameScore = label.score
    used.add(label.name)
    return true
  }

  if (preferGameNames) for (const spot of ordered) if (spot.name == null) takeGameName(spot)

  const prevByCoord = new Map()
  for (const [name, [x, y]] of Object.entries(previous?.spots ?? {})) {
    prevByCoord.set([x, y].join(), name)
  }
  for (const spot of ordered) {
    if (spot.name != null) continue
    const name = prevByCoord.get(spot.coord.join())
    if (name != null && !used.has(name)) {
      spot.name = name
      spot.nameSource = 'exact'
      used.add(name)
    }
  }

  if (!preferGameNames) for (const spot of ordered) if (spot.name == null) takeGameName(spot)

  // The game nudges nodes by a few pixels between updates; pair the leftovers
  // up by distance, closest first, so a moved node keeps its letter.
  const unnamed = ordered.filter((spot) => spot.name == null)
  if (unnamed.length) {
    const free = Object.entries(previous?.spots ?? {})
      .filter(([name]) => !used.has(name))
      .map(([name, [x, y]]) => ({ name, coord: [x, y] }))
    const pairs = []
    for (const spot of unnamed) {
      for (const cand of free) {
        const d = dist(spot.coord, cand.coord)
        if (d <= snap) pairs.push({ spot, cand, d })
      }
    }
    pairs.sort((a, b) => a.d - b.d)
    const takenSpots = new Set()
    for (const { spot, cand, d } of pairs) {
      if (takenSpots.has(spot) || used.has(cand.name)) continue
      spot.name = cand.name
      spot.nameSource = 'moved'
      spot.movedFrom = cand.coord
      spot.movedBy = d
      takenSpots.add(spot)
      used.add(cand.name)
    }
  }

  const guessed = []
  for (const spot of ordered) {
    if (spot.name != null) continue
    spot.name = nextFreeName(spot.isStart, used)
    spot.nameSource = 'guessed'
    used.add(spot.name)
    guessed.push(spot.name)
  }
  if (guessed.length) {
    warn(
      `${guessed.length} guessed name(s): ${guessed.join(' ')} -- ` +
        `verify each against the letter drawn in the map art`,
    )
  }

  // Wherever the game states a name and something else won, say so. These are
  // the cases worth a human's attention: either fcd/map.json carries a name the
  // game disagrees with, or a name was read off the art incorrectly.
  for (const spot of ordered) {
    const label = fromGame.get(spot)
    if (!label || label.name === spot.name) continue
    spot.disagreement = label
    warn(
      `spot ${spot.coord.join()} is named "${spot.name}" (${spot.nameSource}) but the game ` +
        `${label.source === 'ocr' ? 'art reads' : 'data says'} "${label.name}"`,
    )
  }
}

// ---------------------------------------------------------------------------
// fcd/map.json shape
// ---------------------------------------------------------------------------

const toFcd = ({ routes, spots }) => {
  const route = {}
  for (const no of Object.keys(routes).sort((a, b) => Number(a) - Number(b))) {
    const { start, end } = routes[no]
    route[no] = [start ? spots[start.join()].name : null, spots[end.join()].name]
  }
  const outSpots = {}
  for (const spot of Object.values(spots).sort((a, b) => a.order - b.order)) {
    outSpots[spot.name] = [spot.coord[0], spot.coord[1], spot.isStart ? 'start' : '']
  }
  return { route: route, spots: outSpots }
}

const diffMap = (previous, next) => {
  if (!previous) return { status: 'new', spots: [], routes: [] }

  const spotChanges = []
  const names = [...new Set([...Object.keys(previous.spots), ...Object.keys(next.spots)])]
  for (const name of names) {
    const before = previous.spots[name]
    const after = next.spots[name]
    if (!before) spotChanges.push({ name, kind: 'added', after })
    else if (!after) spotChanges.push({ name, kind: 'removed', before })
    else if (before[0] !== after[0] || before[1] !== after[1] || before[2] !== after[2]) {
      spotChanges.push({ name, kind: 'changed', before, after })
    }
  }

  const routeChanges = []
  const nos = [...new Set([...Object.keys(previous.route), ...Object.keys(next.route)])].sort(
    (a, b) => Number(a) - Number(b),
  )
  for (const no of nos) {
    const before = previous.route[no]
    const after = next.route[no]
    if (!before) routeChanges.push({ no, kind: 'added', after })
    else if (!after) routeChanges.push({ no, kind: 'removed', before })
    else if (before[0] !== after[0] || before[1] !== after[1]) {
      routeChanges.push({ no, kind: 'changed', before, after })
    }
  }

  const status = spotChanges.length || routeChanges.length ? 'changed' : 'unchanged'
  return { status, spots: spotChanges, routes: routeChanges }
}

// ---------------------------------------------------------------------------
// review page
// ---------------------------------------------------------------------------

const NAME_COLORS = {
  override: '#48aff0',
  label: '#3dcc91',
  ocr: '#a3e64a',
  exact: '#7bd1a0',
  moved: '#ffb366',
  guessed: '#ff7373',
}

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )

const bgLayers = ({ info, image, frameFiles }) => {
  const layers = []
  for (const entry of info.bg ?? []) {
    const name = typeof entry === 'string' ? entry : (entry.img ?? entry.name)
    if (!name) continue
    const re = new RegExp(`_${escapeRe(name)}$`)
    const key = Object.keys(image.frames).find((k) => re.test(k))
    if (!key) continue
    const { frame } = image.frames[key]
    layers.push(
      `<div class="layer" style="background-image:url(${esc(frameFiles[key])});` +
        `background-position:${-frame.x}px ${-frame.y}px"></div>`,
    )
  }
  return layers.join('')
}

// The game's own names for spots revealed mid-event, blitted out of the delta
// sheets at the position the game places them, so every spot on the page can be
// checked against game-drawn art rather than only the initially visible ones.
const deltaLabels = ({ labelSprites }) =>
  (labelSprites ?? [])
    .map(
      ({ x, y, file, frame }) =>
        `<div class="delta" style="left:${x}px;top:${y}px;width:${frame.w}px;height:${frame.h}px;` +
        `background-image:url(${esc(file)});background-position:${-frame.x}px ${-frame.y}px"></div>`,
    )
    .join('')

const overlaySvg = (extracted, fcd, previous) => {
  const parts = [
    `<defs><marker id="arrow" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="7" ` +
      `markerHeight="6" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="#ffee55"/></marker></defs>`,
  ]

  for (const [no, { start, end }] of Object.entries(extracted.routes)) {
    if (!start) continue
    const [x1, y1] = start
    const [x2, y2] = end
    parts.push(
      `<line class="route" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
        `marker-end="url(#arrow)"/>`,
      `<text class="rno" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 4}">${esc(no)}</text>`,
    )
  }

  // where the spot used to sit, so drift is visible rather than described
  for (const [name, [x, y]] of Object.entries(previous?.spots ?? {})) {
    const after = fcd.spots[name]
    if (after && after[0] === x && after[1] === y) continue
    parts.push(
      `<circle class="old" cx="${x}" cy="${y}" r="11"/>`,
      `<text class="oldlabel" x="${x}" y="${y - 15}">${esc(name)}</text>`,
    )
  }

  for (const spot of Object.values(extracted.spots)) {
    const [x, y] = spot.coord
    const color = NAME_COLORS[spot.nameSource]
    parts.push(
      `<circle class="spot" cx="${x}" cy="${y}" r="13" stroke="${color}"/>`,
      `<text class="label" x="${x + 16}" y="${y + 6}" fill="${color}">${esc(spot.name)}</text>`,
    )
    if (spot.disagreement) {
      parts.push(
        `<text class="clash" x="${x + 16}" y="${y + 22}">game: ${esc(spot.disagreement.name)}</text>`,
      )
    }
  }

  return `<svg class="overlay" viewBox="0 0 ${MAP_W} ${MAP_H}">${parts.join('')}</svg>`
}

const changeRows = (diff) => {
  const cell = (v) => (v == null ? '—' : esc(JSON.stringify(v)))
  const rows = [
    ...diff.spots.map(
      (c) =>
        `<tr><td>spot ${esc(c.name)}</td><td>${esc(c.kind)}</td>` +
        `<td>${cell(c.before)}</td><td>${cell(c.after)}</td></tr>`,
    ),
    ...diff.routes.map(
      (c) =>
        `<tr><td>route ${esc(c.no)}</td><td>${esc(c.kind)}</td>` +
        `<td>${cell(c.before)}</td><td>${cell(c.after)}</td></tr>`,
    ),
  ]
  if (!rows.length) return ''
  return `<table class="changes"><tr><th>what</th><th>kind</th><th>before</th><th>after</th></tr>${rows.join('')}</table>`
}

const renderReview = (results, summary) => {
  const legend = Object.entries(NAME_COLORS)
    .map(([k, c]) => `<span class="chip" style="border-color:${c};color:${c}">${k}</span>`)
    .join('')

  const summaryRows = results
    .map(
      (r) =>
        `<tr class="st-${r.status}"><td><a href="#m${esc(r.id)}">${esc(r.id)}</a></td>` +
        `<td>${esc(r.status)}</td><td>${r.spotCount ?? '—'}</td><td>${r.routeCount ?? '—'}</td>` +
        `<td>${r.guessed ?? 0}</td><td>${r.disagreements ?? 0}</td><td>${r.moved ?? 0}</td>` +
        `<td>${(r.diff?.spots.length ?? 0) + (r.diff?.routes.length ?? 0)}</td>` +
        `<td>${r.warnings.length}</td></tr>`,
    )
    .join('')

  const sections = results
    .filter((r) => r.extracted)
    .map((r) => {
      const warnings = r.warnings.length
        ? `<ul class="warn">${r.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`
        : ''
      return `<section id="m${esc(r.id)}" class="st-${r.status}">
<h2>${esc(r.id)} <span class="status">${esc(r.status)}</span>
<span class="counts">${r.spotCount} spots / ${r.routeCount} routes</span></h2>
${warnings}
<div class="stage"><div class="scaler">${bgLayers(r.raw)}${deltaLabels(r.raw)}${overlaySvg(r.extracted, r.fcd, r.previous)}</div></div>
${changeRows(r.diff)}
</section>`
    })
    .join('\n')

  return `<!doctype html><meta charset="utf-8"><title>fcd map.json review</title>
<style>
  body { font-family: sans-serif; background: #1c2127; color: #f5f8fa; margin: 16px; }
  a { color: #48aff0; }
  h2 { font-size: 16px; margin: 0 0 8px; }
  .status { font-weight: normal; opacity: .8; margin-left: 8px; }
  .counts { font-weight: normal; opacity: .6; font-size: 12px; margin-left: 8px; }
  table { border-collapse: collapse; margin: 8px 0 16px; font-size: 12px; }
  td, th { border: 1px solid #404854; padding: 2px 8px; text-align: left; }
  section { border-top: 1px solid #404854; padding-top: 16px; margin-top: 16px; }
  .st-changed h2 .status { color: #ffb366; }
  .st-new h2 .status { color: #ff7373; }
  .st-stale h2 .status, .st-failed h2 .status { color: #c23030; }
  tr.st-finished-event { opacity: .55; }
  .stage { width: ${MAP_W}px; height: ${MAP_H}px; overflow: hidden; }
  .scaler { width: ${MAP_W}px; height: ${MAP_H}px; position: relative;
            transform-origin: 0 0; background: #000; }
  body.half .stage { width: ${MAP_W / 2}px; height: ${MAP_H / 2}px; }
  body.half .scaler { transform: scale(.5); }
  .layer, .overlay { position: absolute; inset: 0; width: ${MAP_W}px; height: ${MAP_H}px; }
  .delta { position: absolute; }
  .route { stroke: #ffee55; stroke-width: 2; opacity: .85; }
  .rno { fill: #ffee55; font: bold 13px sans-serif; text-anchor: middle;
         paint-order: stroke; stroke: #000; stroke-width: 3px; }
  .spot { fill: none; stroke-width: 3; }
  .old { fill: none; stroke: #ff7373; stroke-width: 2; stroke-dasharray: 4 3; }
  .oldlabel { fill: #ff7373; font: 12px sans-serif; text-anchor: middle; }
  .label { font: bold 18px sans-serif; paint-order: stroke; stroke: #000; stroke-width: 4px; }
  .clash { fill: #ff7373; font: bold 12px sans-serif; paint-order: stroke;
           stroke: #000; stroke-width: 3px; }
  .warn { color: #ffb366; font-size: 12px; margin: 0 0 8px; }
  .chip { border: 1px solid; border-radius: 3px; padding: 1px 6px; margin-right: 6px;
          font-size: 12px; }
  .controls { position: sticky; top: 0; background: #1c2127; padding: 8px 0; z-index: 1; }
  body.no-bg .layer { display: none; }
  body.no-delta .delta { display: none; }
  body.no-routes .route, body.no-routes .rno { display: none; }
  body.no-labels .label, body.no-labels .spot { display: none; }
  body.no-old .old, body.no-old .oldlabel { display: none; }
</style>
<h1>fcd/map.json review</h1>
<div class="controls">
  <label><input type="checkbox" onchange="document.body.classList.toggle('no-bg',!this.checked)" checked> map art</label>
  <label><input type="checkbox" onchange="document.body.classList.toggle('no-delta',!this.checked)" checked> revealed-spot names</label>
  <label><input type="checkbox" onchange="document.body.classList.toggle('no-routes',!this.checked)" checked> routes</label>
  <label><input type="checkbox" onchange="document.body.classList.toggle('no-labels',!this.checked)" checked> spots</label>
  <label><input type="checkbox" onchange="document.body.classList.toggle('no-old',!this.checked)" checked> previous positions</label>
  <label><input type="checkbox" onchange="document.body.classList.toggle('half',this.checked)"> half size</label>
  &nbsp; name source: ${legend}
</div>
<p>Compare each overlaid spot name with the letter the game itself draws in the
map art underneath it. <b>label</b> and <b>ocr</b> names came from the game and
should already agree; a red <b>game:</b> note marks a spot where they do not.
<b>guessed</b> names are not verified by anything and must be checked. Correct
them in <code>names-todo.json</code> (written next to this page, pre-filled with the
guesses) and re-run with <code>--names</code>.</p>
<p>${esc(summary)}</p>
<table><tr><th>map</th><th>status</th><th>spots</th><th>routes</th><th>guessed</th><th>name clashes</th><th>moved</th><th>changes</th><th>warnings</th></tr>
${summaryRows}</table>
${sections}`
}

// ---------------------------------------------------------------------------

const parseOnly = (only) => {
  if (!only) return null
  const patterns = only
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return (id) =>
    patterns.some((p) => {
      const [area, no] = p.split('-')
      const [mapArea, mapNo] = id.split('-')
      return (area === '*' || area === mapArea) && (no === '*' || no == null || no === mapNo)
    })
}

const loadNameOverrides = async (file) => {
  if (!file) return {}
  const raw = await fs.readJSON(file)
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    // accept both "1-1" and notation.json's "11" (area digits + single map no)
    const id = key.includes('-') ? key : `${key.slice(0, -1)}-${key.slice(-1)}`
    out[id] = value
  }
  return out
}

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      start2: { type: 'string' },
      host: { type: 'string', default: 'w01y.kancolle-server.com' },
      cache: { type: 'string', default: path.resolve(__dirname, '.cache-map') },
      only: { type: 'string' },
      names: { type: 'string' },
      snap: { type: 'string', default: '40' },
      'merge-dist': { type: 'string', default: '4' },
      concurrency: { type: 'string', default: '4' },
      refresh: { type: 'boolean', default: false },
      write: { type: 'boolean', default: false },
      'label-dist': { type: 'string', default: '45' },
      'prefer-game-names': { type: 'boolean', default: false },
      'no-ocr': { type: 'boolean', default: false },
      'rebuild-glyphs': { type: 'boolean', default: false },
      'all-events': { type: 'boolean', default: false },
    },
  })
  args.cache = path.resolve(args.cache)
  const snap = Number(args.snap)
  const mergeDist = Number(args['merge-dist'])
  const labelDist = Number(args['label-dist'])
  const concurrency = Number(args.concurrency)
  const preferGameNames = args['prefer-game-names']

  const current = await fs.readJSON(MAP_PATH)
  const overrides = await loadNameOverrides(args.names)

  // Union of what the server currently advertises and what fcd/map.json already
  // knows: api_mst_mapinfo only lists normal maps plus the live event, but
  // map.json also carries every past event map.
  const ids = new Set(Object.keys(current))
  const liveEventAreas = args.start2 ? new Set() : null
  if (args.start2) {
    const start2Raw = await fs.readJSON(args.start2)
    const start2 = start2Raw.body ?? start2Raw.api_data ?? start2Raw
    for (const m of start2.api_mst_mapinfo ?? []) {
      ids.add(`${m.api_maparea_id}-${m.api_no}`)
      if (m.api_maparea_id >= EVENT_AREA) liveEventAreas.add(m.api_maparea_id)
    }
  } else {
    console.warn('no --start2 given: only maps already in fcd/map.json will be refreshed')
  }

  // Only one event is ever live; every other event area in map.json is a
  // finished event that cannot change again, so there is nothing to gain from
  // re-deriving it. Without --start2 there is no way to tell which event is the
  // live one, so nothing is skipped.
  //
  // NOTE: the glyph library learns its A/A1/B/C templates from the point layers
  // of the maps in map.json, and past events are where most of those names
  // occur. Run once with --all-events on a cold cache to build a full library
  // (it is cached in <cache>/glyphs.json afterwards).
  const isObsoleteEvent = (id) => {
    if (args['all-events'] || !liveEventAreas) return false
    const area = Number(id.split('-')[0])
    return area >= EVENT_AREA && !liveEventAreas.has(area)
  }

  const filter = parseOnly(args.only)
  const byMapId = (a, b) => {
    const [aa, an] = a.split('-').map(Number)
    const [ba, bn] = b.split('-').map(Number)
    return aa - ba || an - bn
  }
  const selected = [...ids].filter((id) => !filter || filter(id)).sort(byMapId)
  const targets = selected.filter((id) => !isObsoleteEvent(id))
  const obsolete = selected.filter((id) => isObsoleteEvent(id))
  if (obsolete.length) {
    console.info(
      `skipping ${obsolete.length} finished event maps (areas ` +
        `${[...new Set(obsolete.map((id) => id.split('-')[0]))].join(', ')}); ` +
        `--all-events to include them`,
    )
  }

  console.info(`fetching ${targets.length} maps from ${args.host} ...`)

  // Everything is downloaded first so the glyph library below can harvest name
  // samples from the whole cache before any map is named.
  const downloaded = await mapPool(targets, concurrency, async (id) => {
    const [area, no] = id.split('-').map(Number)
    try {
      return { id, raw: await fetchMap(args, area, no) }
    } catch (e) {
      return { id, error: e }
    }
  })

  let library = null
  if (!args['no-ocr']) {
    const t0 = Date.now()
    library = await buildGlyphLibrary(args.cache, {
      curated: current,
      refresh: args['rebuild-glyphs'],
    })
    console.info(
      `glyph library: ${library.words.size} names (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
    )
  }

  const skipped = obsolete.map((id) => ({
    id,
    status: 'finished-event',
    previous: current[id],
    warnings: [],
  }))

  const processed = await mapPool(downloaded, 1, async ({ id, raw, error }) => {
    const [area, no] = id.split('-').map(Number)
    const previous = current[id]
    const warnings = []
    const warn = (msg) => warnings.push(msg)

    if (error) {
      return { id, status: 'failed', previous, warnings: [`download failed: ${error.message}`] }
    }
    if (!raw) {
      // no resources on this server at all; keep what we have
      return { id, status: 'stale', previous, warnings: [] }
    }

    const extracted = extract(raw, warn)
    mergeNearby(extracted, { previous, mergeDist }, warn)

    // What the game itself calls these spots: stated outright for spots
    // revealed mid-event, painted into the art for the rest.
    const labels = gameLabels(raw)
    if (library) {
      const pointLayer = await loadPointLayer(args.cache, area, no)
      if (pointLayer) {
        for (const read of readBakedLabels(pointLayer.layer, { ...pointLayer, library })) {
          labels.push({ ...read, source: 'ocr' })
        }
      }
    }
    const spotList = Object.values(extracted.spots)
    const assigned = assignLabels(labels, spotList, { maxDistance: labelDist, warn })

    nameSpots(
      extracted,
      { overrides: overrides[id], previous, snap, labels: assigned, preferGameNames },
      warn,
    )
    mergeByName(extracted, warn)
    snapRouteStarts(extracted, warn)
    const fcd = toFcd(extracted)
    const diff = diffMap(previous, fcd)

    const sources = Object.values(extracted.spots).map((s) => s.nameSource)
    return {
      id,
      status: diff.status,
      previous,
      raw,
      extracted,
      fcd,
      diff,
      warnings,
      spotCount: Object.keys(fcd.spots).length,
      routeCount: Object.keys(fcd.route).length,
      disagreements: Object.values(extracted.spots).filter((s) => s.disagreement).length,
      guessed: sources.filter((s) => s === 'guessed').length,
      moved: sources.filter((s) => s === 'moved').length,
    }
  })

  const results = [...processed, ...skipped].sort((a, b) => byMapId(a.id, b.id))
  const count = (status) => results.filter((r) => r.status === status).length
  const guessed = results.reduce((n, r) => n + (r.guessed ?? 0), 0)
  const clashes = results.reduce((n, r) => n + (r.disagreements ?? 0), 0)
  const summary =
    `new: ${count('new')} | changed: ${count('changed')} | unchanged: ${count('unchanged')} | ` +
    `finished events (kept): ${count('finished-event')} | ` +
    `stale (no server data, kept): ${count('stale')} | failed: ${count('failed')} | ` +
    `guessed names: ${guessed} | name clashes with the game: ${clashes}`
  console.info(summary)
  for (const r of results) {
    for (const w of r.warnings) console.warn(`  ${r.id}: ${w}`)
  }

  await fs.outputJSON(
    path.join(args.cache, 'report.json'),
    {
      generatedAt: new Date().toISOString(),
      host: args.host,
      summary,
      maps: results.map(
        ({ id, status, diff, warnings, guessed: g, moved, disagreements, fcd }) => ({
          id,
          status,
          guessed: g,
          disagreements,
          moved,
          warnings,
          diff,
          fcd,
        }),
      ),
    },
    { spaces: 2 },
  )
  // Scaffold for the manual step: every guessed name, pre-filled with the
  // guess, in the shape --names expects. Correct the wrong ones and re-run
  // with --names <cache>/names-todo.json.
  const todo = {}
  for (const r of results) {
    const guesses = Object.values(r.extracted?.spots ?? {}).filter(
      (s) => s.nameSource === 'guessed',
    )
    if (!guesses.length) continue
    todo[r.id] = Object.fromEntries(guesses.map((s) => [s.coord.join(), s.name]))
  }
  const todoPath = path.join(args.cache, 'names-todo.json')
  await fs.outputJSON(todoPath, todo, { spaces: 2 })

  const reviewPath = path.join(args.cache, 'review.html')
  await fs.outputFile(reviewPath, renderReview(results, summary))
  console.info(`review: ${path.relative(process.cwd(), reviewPath)}`)
  console.info(`report: ${path.relative(process.cwd(), path.join(args.cache, 'report.json'))}`)
  if (guessed) {
    console.info(
      `names to check: ${path.relative(process.cwd(), todoPath)} (feed back via --names)`,
    )
  }

  if (args.write) {
    const next = { ...current }
    for (const r of results) {
      if (r.fcd) next[r.id] = r.fcd
    }
    const sorted = {}
    for (const id of Object.keys(next).sort((a, b) => {
      const [aa, an] = a.split('-').map(Number)
      const [ba, bn] = b.split('-').map(Number)
      return aa - ba || an - bn
    })) {
      sorted[id] = next[id]
    }
    await fs.outputJSON(MAP_PATH, sorted)
    console.info(`written: fcd/map.json (${Object.keys(sorted).length} maps) -- run fcd/build.js`)
  } else {
    console.info('dry run; pass --write to update fcd/map.json')
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
