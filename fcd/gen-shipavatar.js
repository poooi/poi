// Generate marginMagic suggestions for shipavatar.json from the game's own
// art, calibrated against the existing hand-tuned entries.
//
// marginMagic shifts the remodel banner left so the face lands in the avatar
// window (views/components/etc/avatar.tsx). Two methods:
//
// - banner (default): the game's `banner` art (160x40) is the game's own
//   face-framed crop of the same artwork. Register the banner inside the
//   remodel strip (ORB keypoints + RANSAC scale/translation; the banner's
//   opaque frame is removed via a cross-banner pixel-identity mask, since
//   background pixels are byte-identical across same-stype banners) and map a
//   fixed anchor point of the banner into remodel coordinates. The transform
//   is (tx, s) per ship; marginMagic is linear in both, so the anchor never
//   needs to be chosen explicitly — least squares over the existing table
//   recovers it.
// - face: lbpcascade_animeface face detection on the remodel strip;
//   marginMagic is linear in faceCenterX / imageHeight.
//
// Usage:
//   node fcd/gen-shipavatar.js --start2 <api_start2 capture or response JSON>
// Options:
//   --method <m>        banner (default) or face
//   --host <host>       game CDN host (default w01y.kancolle-server.com)
//   --limit <n>         only process the first n ships (pipeline testing)
//   --concurrency <n>   parallel downloads (default 6)
//   --cache <dir>       image/cascade cache dir (default fcd/.cache)
//   --overwrite         suggest detected values for ALL ships, replacing the
//                       hand-tuned entries (default: only fill entries missing
//                       or partial in fcd/shipavatar.json)
//   --write             merge the suggestions into fcd/shipavatar.json
//                       (run build.js after)
//
// Without --write it only prints the calibration report and writes
// <cache>/report.json and <cache>/review.html for inspection.

const fs = require('fs-extra')
const { cv } = require('opencv-wasm')
const path = require('path')
const { PNG } = require('pngjs')
const { parseArgs } = require('util')

// Installs a require() hook that transpiles .ts on the fly with the app's
// own babel.config.js, so the line below loads the *actual* app module —
// not a hand-copied reimplementation that could silently drift from it.
require('../babel-hook')(require('../babel-register.config'))
const { createCipher } = require('../views/utils/ship-img-cipher')

const CASCADE_URL =
  'https://raw.githubusercontent.com/nagadomi/lbpcascade_animeface/master/lbpcascade_animeface.xml'
const SHIPAVATAR_PATH = path.resolve(__dirname, 'shipavatar.json')

const shipImgUrl = (host, kind, id, damaged, version) => {
  const ntype = kind + (damaged ? '_dmg' : '')
  const cipher = createCipher(id, `ship_${ntype}`)
  const padId = String(id).padStart(4, '0')
  const versionQuery = version && parseInt(version) > 1 ? `?version=${version}` : ''
  return `https://${host}/kcs2/resources/ship/${ntype}/${padId}_${cipher}.png${versionQuery}`
}

const fetchBuffer = async (url) => {
  let lastError
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

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

const grayMatFromPng = (png) => {
  const src = cv.matFromImageData(png)
  const gray = new cv.Mat()
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
  src.delete()
  return gray
}

// ---------------------------------------------------------------------------
// face method
// ---------------------------------------------------------------------------

const loadClassifier = async (cacheDir) => {
  const xmlPath = path.join(cacheDir, 'lbpcascade_animeface.xml')
  if (!(await fs.pathExists(xmlPath))) {
    console.info('downloading lbpcascade_animeface.xml ...')
    const buf = await fetchBuffer(CASCADE_URL)
    if (!buf) throw new Error('cascade download returned 404')
    await fs.outputFile(xmlPath, buf)
  }
  cv.FS_createDataFile(
    '/',
    'cascade.xml',
    new Uint8Array(await fs.readFile(xmlPath)),
    true,
    false,
    false,
  )
  const classifier = new cv.CascadeClassifier()
  if (!classifier.load('cascade.xml')) throw new Error('failed to load cascade')
  return classifier
}

// The face nearly fills the 182px-tall remodel strip and touches its edges,
// where a cascade cannot place its sliding window — pad the image first.
// equalizeHist is skipped on purpose: the art sits on a transparent (black
// once flattened) background and equalization washes the faces out.
const DETECT_PAD = 48

// Returns feature { x } (faceCenterX / imgHeight) or null
const detectFace = (classifier, pngBuffer) => {
  const png = PNG.sync.read(pngBuffer)
  const gray = grayMatFromPng(png)
  const padded = new cv.Mat()
  const faces = new cv.RectVector()
  try {
    cv.copyMakeBorder(
      gray,
      padded,
      DETECT_PAD,
      DETECT_PAD,
      DETECT_PAD,
      DETECT_PAD,
      cv.BORDER_CONSTANT,
      new cv.Scalar(0),
    )
    // second pass is a relaxed retry for art the strict pass misses
    let face = null
    for (const [scaleFactor, minNeighbors, minSize] of [
      [1.03, 3, 32],
      [1.02, 2, 24],
    ]) {
      classifier.detectMultiScale(
        padded,
        faces,
        scaleFactor,
        minNeighbors,
        0,
        new cv.Size(minSize, minSize),
        new cv.Size(0, 0),
      )
      for (let i = 0; i < faces.size(); i++) {
        const r = faces.get(i)
        if (!face || r.width * r.height > face.w * face.h) {
          face = { x: r.x - DETECT_PAD, w: r.width, h: r.height }
        }
      }
      if (face) break
    }
    if (!face) return null
    return { x: (face.x + face.w / 2) / png.height }
  } finally {
    gray.delete()
    padded.delete()
    faces.delete()
  }
}

// ---------------------------------------------------------------------------
// banner method
// ---------------------------------------------------------------------------

const BANNER_UPSCALE = 4 // bring banner->remodel scale near 1 for ORB
const MIN_INLIERS = 20
const MASK_POOL_LIMIT = 40

// Character mask: a pixel is background when byte-near-identical to the same
// position in >= `needed` other banners of the pool (the frame is shared art;
// character pixels essentially never coincide across ships).
const characterMask = (png, pool, W, H) => {
  const me = png.data
  const needed = Math.min(4, Math.max(1, pool.length - 1))
  const mask = Buffer.alloc(W * H)
  for (let p = 0; p < W * H; p++) {
    let matches = 0
    for (let k = 0; k < pool.length && matches < needed; k++) {
      const other = pool[k].data
      if (other === me) continue
      if (
        Math.abs(me[p * 4] - other[p * 4]) <= 2 &&
        Math.abs(me[p * 4 + 1] - other[p * 4 + 1]) <= 2 &&
        Math.abs(me[p * 4 + 2] - other[p * 4 + 2]) <= 2
      ) {
        matches++
      }
    }
    mask[p] = matches >= needed ? 0 : 255
  }
  return mask
}

// deterministic LCG so runs are reproducible
const makeRng = (seed) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

// Register the banner character inside the remodel strip. Returns feature
// { tx, s, inliers } (remodel_x = s * banner_x + tx) or null.
const registerBanner = (orb, matcher, remodelPngBuffer, bannerPng, mask) => {
  const W = bannerPng.width
  const H = bannerPng.height
  const maskMat = cv.matFromArray(H, W, cv.CV_8UC1, mask)
  const eroded = new cv.Mat()
  const kernel = cv.Mat.ones(3, 3, cv.CV_8UC1)
  cv.erode(maskMat, eroded, kernel)
  const bGray = grayMatFromPng(bannerPng)
  const bUp = new cv.Mat()
  cv.resize(bGray, bUp, new cv.Size(W * BANNER_UPSCALE, H * BANNER_UPSCALE), 0, 0, cv.INTER_CUBIC)
  const mUp = new cv.Mat()
  cv.resize(
    eroded,
    mUp,
    new cv.Size(W * BANNER_UPSCALE, H * BANNER_UPSCALE),
    0,
    0,
    cv.INTER_NEAREST,
  )
  const rGray = grayMatFromPng(PNG.sync.read(remodelPngBuffer))
  const kb = new cv.KeyPointVector()
  const db = new cv.Mat()
  const kr = new cv.KeyPointVector()
  const dr = new cv.Mat()
  const emptyMask = new cv.Mat()
  const toDelete = [maskMat, eroded, kernel, bGray, bUp, mUp, rGray, kb, db, kr, dr, emptyMask]
  try {
    orb.detectAndCompute(bUp, mUp, kb, db)
    orb.detectAndCompute(rGray, emptyMask, kr, dr)
    if (db.rows < 8 || dr.rows < 8) return null
    const matches = new cv.DMatchVector()
    toDelete.push(matches)
    matcher.match(db, dr, matches)
    const pts = []
    for (let i = 0; i < matches.size(); i++) {
      const m = matches.get(i)
      const pb = kb.get(m.queryIdx).pt
      const pr = kr.get(m.trainIdx).pt
      pts.push({ bx: pb.x / BANNER_UPSCALE, by: pb.y / BANNER_UPSCALE, rx: pr.x, ry: pr.y })
    }
    if (pts.length < 8) return null
    // RANSAC for scale + translation (no rotation: art is axis-aligned)
    const rand = makeRng(0x5eed)
    let best = { inliers: [] }
    for (let iter = 0; iter < 3000; iter++) {
      const i = (rand() * pts.length) | 0
      const j = (rand() * pts.length) | 0
      if (i === j) continue
      const a = pts[i]
      const b = pts[j]
      const bannerDist = Math.hypot(a.bx - b.bx, a.by - b.by)
      const remodelDist = Math.hypot(a.rx - b.rx, a.ry - b.ry)
      if (bannerDist < 6) continue
      const s = remodelDist / bannerDist
      if (s < 2 || s > 9) continue
      const tx = a.rx - s * a.bx
      const ty = a.ry - s * a.by
      const inliers = pts.filter(
        (p) => Math.hypot(p.rx - (s * p.bx + tx), p.ry - (s * p.by + ty)) < 4,
      )
      if (inliers.length > best.inliers.length) best = { inliers }
    }
    if (best.inliers.length < MIN_INLIERS) return null
    // least-squares refine over inliers
    const n = best.inliers.length
    let sbx = 0
    let sby = 0
    let srx = 0
    let sry = 0
    let sbb = 0
    let sbr = 0
    for (const p of best.inliers) {
      sbx += p.bx
      sby += p.by
      srx += p.rx
      sry += p.ry
      sbb += p.bx * p.bx + p.by * p.by
      sbr += p.bx * p.rx + p.by * p.ry
    }
    const s = (sbr - (sbx * srx + sby * sry) / n) / (sbb - (sbx * sbx + sby * sby) / n)
    const tx = (srx - s * sbx) / n
    return { tx, s, inliers: n }
  } finally {
    toDelete.forEach((m) => m.delete())
  }
}

// ---------------------------------------------------------------------------
// calibration: least squares y = coef . [features, 1]
// ---------------------------------------------------------------------------

const solveLinearSystem = (A, b) => {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    if (Math.abs(M[pivot][col]) < 1e-12) return null
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / M[col][col]
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / M[i][i])
}

// pairs: [featureArray, y][]
const fitAffine = (pairs) => {
  if (pairs.length < 3) return null
  const k = pairs[0][0].length + 1
  const XtX = Array.from({ length: k }, () => new Array(k).fill(0))
  const XtY = new Array(k).fill(0)
  for (const [features, y] of pairs) {
    const row = [...features, 1]
    for (let r = 0; r < k; r++) {
      XtY[r] += row[r] * y
      for (let c = 0; c < k; c++) XtX[r][c] += row[r] * row[c]
    }
  }
  const coef = solveLinearSystem(XtX, XtY)
  if (!coef) return null
  const predict = (features) => features.reduce((s, f, i) => s + coef[i] * f, coef[k - 1])
  const meanY = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length
  let ssRes = 0
  let ssTot = 0
  let sumAbs = 0
  for (const [features, y] of pairs) {
    const r = y - predict(features)
    ssRes += r * r
    ssTot += (y - meanY) * (y - meanY)
    sumAbs += Math.abs(r)
  }
  return {
    coef,
    predict,
    r2: ssTot > 0 ? 1 - ssRes / ssTot : 1,
    mae: sumAbs / pairs.length,
    n: pairs.length,
  }
}

const round3 = (v) => Math.round(v * 1000) / 1000

// ---------------------------------------------------------------------------

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      start2: { type: 'string' },
      method: { type: 'string', default: 'banner' },
      host: { type: 'string', default: 'w01y.kancolle-server.com' },
      limit: { type: 'string' },
      concurrency: { type: 'string', default: '6' },
      cache: { type: 'string', default: path.resolve(__dirname, '.cache') },
      overwrite: { type: 'boolean', default: false },
      write: { type: 'boolean', default: false },
    },
  })
  if (!args.start2 || !['banner', 'face'].includes(args.method)) {
    console.error(
      'usage: node fcd/gen-shipavatar.js --start2 <api_start2 json> [--method banner|face] [--overwrite] [--write]',
    )
    process.exitCode = 1
    return
  }

  const start2Raw = await fs.readJSON(args.start2)
  // accept response-saver capture ({body}), raw svdata ({api_data}) or bare master data
  const start2 = start2Raw.body ?? start2Raw.api_data ?? start2Raw
  const graphVersions = new Map(
    (start2.api_mst_shipgraph ?? []).map((g) => [g.api_id, g.api_version?.[0]]),
  )
  let ships = start2.api_mst_ship.filter((s) => s.api_id < 1500)
  if (args.limit) ships = ships.slice(0, parseInt(args.limit))
  const concurrency = parseInt(args.concurrency)
  const cacheDir = args.cache

  const current = await fs.readJSON(SHIPAVATAR_PATH)
  console.info(
    `${ships.length} ships, ${Object.keys(current.marginMagics).length} existing entries, method: ${args.method}`,
  )

  // phase 1: download (cache-aware)
  const kinds = args.method === 'banner' ? ['remodel', 'banner'] : ['remodel']
  const tasks = ships.flatMap((ship) =>
    ['normal', 'damaged'].flatMap((variant) => kinds.map((kind) => ({ ship, variant, kind }))),
  )
  let downloaded = 0
  const fileEntries = await mapPool(tasks, concurrency, async ({ ship, variant, kind }) => {
    const version = graphVersions.get(ship.api_id) ?? '1'
    const file = path.join(
      cacheDir,
      kind,
      `${String(ship.api_id).padStart(4, '0')}_${variant === 'damaged' ? 'd' : 'n'}_v${version}.png`,
    )
    const entry = { id: ship.api_id, variant, kind, file }
    if (await fs.pathExists(file)) return entry
    try {
      const buf = await fetchBuffer(
        shipImgUrl(args.host, kind, ship.api_id, variant === 'damaged', version),
      )
      if (!buf) return { ...entry, file: null, reason: '404' }
      await fs.outputFile(file, buf)
      if (++downloaded % 200 === 0) console.info(`downloaded ${downloaded} images ...`)
      return entry
    } catch (e) {
      return { ...entry, file: null, reason: e.message }
    }
  })
  const fileOf = new Map(fileEntries.map((e) => [`${e.id}/${e.variant}/${e.kind}`, e]))

  // phase 2: per-ship features
  const detections = new Map() // api_id -> { normal?: {features, file}, damaged?: ... }
  const failures = []
  const nameOf = new Map(ships.map((s) => [s.api_id, s.api_name]))
  const relFile = (file) => path.relative(cacheDir, file).split(path.sep).join('/')

  const record = (id, variant, features, remodelFile) => {
    const entry = detections.get(id) ?? {}
    entry[variant] = { features, file: relFile(remodelFile) }
    detections.set(id, entry)
  }
  const fail = (id, variant, reason) => failures.push({ id, name: nameOf.get(id), variant, reason })

  if (args.method === 'face') {
    const classifier = await loadClassifier(cacheDir)
    let processed = 0
    for (const ship of ships) {
      for (const variant of ['normal', 'damaged']) {
        processed++
        if (processed % 200 === 0) console.info(`detected ${processed}/${ships.length * 2} ...`)
        const remodel = fileOf.get(`${ship.api_id}/${variant}/remodel`)
        if (!remodel.file) {
          fail(ship.api_id, variant, remodel.reason)
          continue
        }
        try {
          const feature = detectFace(classifier, await fs.readFile(remodel.file))
          if (!feature) fail(ship.api_id, variant, 'no face detected')
          else record(ship.api_id, variant, [feature.x], remodel.file)
        } catch (e) {
          fail(ship.api_id, variant, e.message)
        }
      }
    }
  } else {
    const orb = new cv.ORB(800)
    const matcher = new cv.BFMatcher(cv.NORM_HAMMING, true)
    let processed = 0
    for (const variant of ['normal', 'damaged']) {
      // decode all banners of this variant, grouped by stype for masking
      const bannerPngs = new Map()
      for (const ship of ships) {
        const banner = fileOf.get(`${ship.api_id}/${variant}/banner`)
        if (banner?.file) {
          try {
            bannerPngs.set(ship.api_id, PNG.sync.read(await fs.readFile(banner.file)))
          } catch (e) {
            fail(ship.api_id, variant, `banner decode: ${e.message}`)
          }
        }
      }
      const byStype = new Map()
      for (const ship of ships) {
        if (!bannerPngs.has(ship.api_id)) continue
        if (!byStype.has(ship.api_stype)) byStype.set(ship.api_stype, [])
        byStype.get(ship.api_stype).push(bannerPngs.get(ship.api_id))
      }
      const allPngs = [...bannerPngs.values()]
      for (const ship of ships) {
        processed++
        if (processed % 200 === 0) console.info(`registered ${processed}/${ships.length * 2} ...`)
        const remodel = fileOf.get(`${ship.api_id}/${variant}/remodel`)
        const banner = fileOf.get(`${ship.api_id}/${variant}/banner`)
        const bannerPng = bannerPngs.get(ship.api_id)
        if (!remodel.file || !bannerPng) {
          fail(
            ship.api_id,
            variant,
            !remodel.file ? remodel.reason : (banner?.reason ?? 'no banner'),
          )
          continue
        }
        // same-stype pool isolates the stype label; small stypes fall back to
        // all banners (label areas become RANSAC outliers)
        const stypePool = byStype.get(ship.api_stype) ?? []
        const pool = (stypePool.length >= 6 ? stypePool : allPngs).slice(0, MASK_POOL_LIMIT)
        try {
          const mask = characterMask(bannerPng, pool, bannerPng.width, bannerPng.height)
          const feature = registerBanner(
            orb,
            matcher,
            await fs.readFile(remodel.file),
            bannerPng,
            mask,
          )
          if (!feature) fail(ship.api_id, variant, 'registration failed (few inliers)')
          else record(ship.api_id, variant, [feature.tx, feature.s], remodel.file)
        } catch (e) {
          fail(ship.api_id, variant, e.message)
        }
      }
    }
  }

  // phase 3: calibrate on existing hand-tuned entries (normal art only; many
  // damaged hand values are just copies of normal and would dilute the fit)
  const normalPairs = []
  const damagedPairs = []
  for (const [id, det] of detections) {
    const gt = current.marginMagics[id]
    if (!gt) continue
    if (det.normal != null && gt.normal != null)
      normalPairs.push([det.normal.features, gt.normal, id])
    if (det.damaged != null && gt.damaged != null && gt.damaged !== gt.normal) {
      damagedPairs.push([det.damaged.features, gt.damaged, id])
    }
  }
  const fit = fitAffine(normalPairs.map(([f, y]) => [f, y]))
  if (!fit) {
    await fs.outputJSON(path.join(cacheDir, 'report.json'), { failures }, { spaces: 2 })
    console.error(
      `not enough ground-truth pairs to calibrate (${failures.length} failures, see report)`,
    )
    process.exitCode = 1
    return
  }
  const damagedMae =
    damagedPairs.length > 0
      ? damagedPairs.reduce((s, [f, y]) => s + Math.abs(y - fit.predict(f)), 0) /
        damagedPairs.length
      : null

  const residuals = normalPairs
    .map(([f, gt, id]) => ({ id, name: nameOf.get(id), gt, pred: round3(fit.predict(f)) }))
    .map((o) => ({ ...o, diff: round3(o.pred - o.gt) }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  const outliers = residuals.slice(0, 15)

  // phase 4: suggestions
  const gtValues = normalPairs.map(([, y]) => y)
  const saneMin = Math.min(...gtValues) - 0.05
  const saneMax = Math.max(...gtValues) + 0.05
  const suggestions = {}
  const rejected = []
  for (const ship of ships) {
    const existing = current.marginMagics[ship.api_id]
    if (!args.overwrite && existing?.normal != null && existing?.damaged != null) continue
    const det = detections.get(ship.api_id)
    const detNormal = det?.normal != null ? round3(fit.predict(det.normal.features)) : null
    const detDamaged = det?.damaged != null ? round3(fit.predict(det.damaged.features)) : detNormal
    // --overwrite prefers detected values and keeps hand values only as a
    // fallback; the default mode fills only the fields the entry is missing
    // (some existing entries are partial, e.g. damaged only)
    const normal = args.overwrite
      ? (detNormal ?? existing?.normal)
      : (existing?.normal ?? detNormal)
    const damaged = args.overwrite
      ? (detDamaged ?? existing?.damaged ?? normal)
      : (existing?.damaged ?? detDamaged ?? normal)
    if (normal == null) continue
    // reject (keep the current entry) when a newly detected value is implausible
    const changed = args.overwrite
      ? [detNormal, detDamaged]
      : [existing?.normal == null && normal, existing?.damaged == null && damaged]
    if (changed.some((v) => typeof v === 'number' && (v < saneMin || v > saneMax))) {
      rejected.push({ id: ship.api_id, name: ship.api_name, normal, damaged })
      continue
    }
    if (existing != null && existing.normal === normal && existing.damaged === damaged) continue
    suggestions[ship.api_id] = { normal, damaged }
  }

  const fitDescription = `margin = ${fit.coef
    .map((c, i) =>
      i < fit.coef.length - 1
        ? `${c.toFixed(5)}*${args.method === 'banner' ? ['tx', 's'][i] : 'x'}`
        : c.toFixed(4),
    )
    .join(' + ')}`
  const report = {
    generatedAt: new Date().toISOString(),
    mode: args.overwrite ? 'overwrite' : 'fill-missing',
    method: args.method,
    host: args.host,
    fit: {
      description: fitDescription,
      coef: fit.coef,
      r2: round3(fit.r2),
      maeNormal: round3(fit.mae),
      maeDamaged: damagedMae != null ? round3(damagedMae) : null,
      pairsNormal: fit.n,
      pairsDamaged: damagedPairs.length,
    },
    outliers,
    suggestions,
    rejected,
    failures,
  }
  const reportPath = path.join(cacheDir, 'report.json')
  await fs.outputJSON(reportPath, report, { spaces: 2 })

  // review.html next to the image cache: replicates the avatar crop CSS
  // (views/components/etc/avatar.tsx) so hand vs detected margins can be
  // compared visually before merging
  const crop = (file, margin, h = 80) =>
    file == null || margin == null
      ? '<div class="crop empty"></div>'
      : `<div class="crop" style="width:${Math.round(1.85 * h)}px;height:${h}px">` +
        `<img loading="lazy" src="${file}" style="height:${Math.round((h / 176) * 182)}px;` +
        `margin-left:${-Math.round(margin * h)}px;margin-top:${-Math.round((h / 176) * 3)}px"></div>`
  const disagreementRows = residuals
    .slice(0, 30)
    .map((o) => {
      const det = detections.get(o.id)
      return (
        `<tr><td>${o.id}</td><td>${o.name}</td><td>${o.gt}<br>${crop(det?.normal?.file, o.gt)}</td>` +
        `<td>${o.pred}<br>${crop(det?.normal?.file, o.pred)}</td><td>${o.diff}</td></tr>`
      )
    })
    .join('\n')
  const suggestionRows = Object.entries(suggestions)
    .map(([id, s]) => {
      const det = detections.get(Number(id))
      return (
        `<tr><td>${id}</td><td>${nameOf.get(Number(id))}</td>` +
        `<td>${s.normal}<br>${crop(det?.normal?.file, s.normal)}</td>` +
        `<td>${s.damaged}<br>${crop(det?.damaged?.file ?? det?.normal?.file, s.damaged)}</td></tr>`
      )
    })
    .join('\n')
  const reviewHtml = `<!doctype html><meta charset="utf-8"><title>shipavatar review</title>
<style>
  body { font-family: sans-serif; background: #30404d; color: #f5f8fa; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #5c7080; padding: 4px 8px; vertical-align: top; }
  .crop { overflow: hidden; position: relative; display: flex; align-items: center; }
  .crop img { display: block; max-width: none; }
  .crop.empty { width: 148px; height: 80px; background: #182026; }
</style>
<h1>shipavatar marginMagic review (method: ${args.method})</h1>
<p>fit: ${fitDescription} | R²=${fit.r2.toFixed(3)} MAE=${fit.mae.toFixed(3)} (n=${fit.n})</p>
<h2>top disagreements with existing entries</h2>
<table><tr><th>id</th><th>name</th><th>hand</th><th>detected</th><th>Δ</th></tr>
${disagreementRows}</table>
<h2>suggestions for ${Object.keys(suggestions).length} ships (${args.overwrite ? 'overwrite all' : 'fill missing only'})</h2>
<table><tr><th>id</th><th>name</th><th>normal</th><th>damaged</th></tr>
${suggestionRows}</table>`
  await fs.outputFile(path.join(cacheDir, 'review.html'), reviewHtml)

  console.info('')
  console.info(`calibration: ${fitDescription}`)
  console.info(`  n=${fit.n}  R²=${fit.r2.toFixed(4)}  MAE=${fit.mae.toFixed(4)} (normal)`)
  if (damagedMae != null) {
    console.info(`  damaged holdout: n=${damagedPairs.length}  MAE=${damagedMae.toFixed(4)}`)
  }
  console.info(
    `suggestions for ${Object.keys(suggestions).length} ships in ${args.overwrite ? 'overwrite-all' : 'fill-missing'} mode (${rejected.length} rejected as out of range)`,
  )
  console.info(`failures: ${failures.length} (see report)`)
  console.info(`report: ${path.relative(process.cwd(), reportPath)}`)
  console.info('top disagreements with existing entries:')
  for (const o of outliers.slice(0, 10)) {
    console.info(
      `  ${String(o.id).padStart(4)} ${o.name}: hand=${o.gt} detected=${o.pred} (Δ${o.diff})`,
    )
  }

  if (args.write) {
    const merged = { ...current.marginMagics }
    for (const [id, value] of Object.entries(suggestions)) merged[id] = value
    await fs.writeFile(SHIPAVATAR_PATH, JSON.stringify({ ...current, marginMagics: merged }))
    console.info(
      `merged ${Object.keys(suggestions).length} entries into fcd/shipavatar.json — review, then run fcd/build.js`,
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
