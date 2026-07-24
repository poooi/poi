// Compare the working-tree fcd/shipavatar.json against the version committed
// at HEAD, to report what a gen-shipavatar.js update actually changed.
// Renders visual crops from the image cache gen-shipavatar.js populates, so
// changes can be eyeballed the same way as fcd/.cache/review.html.
//
// Usage: node fcd/report-diff.js [--cache fcd/.cache] [--start2 <api_start2 json>] [--out <path>]
// --start2 is optional and only used to resolve ship names for the report.

const { execFileSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const { parseArgs } = require('util')

const REPO_ROOT = path.resolve(__dirname, '..')
const SHIPAVATAR_PATH = path.resolve(__dirname, 'shipavatar.json')

const readBeforeFromGit = () => {
  const raw = execFileSync('git', ['show', 'HEAD:fcd/shipavatar.json'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  })
  return JSON.parse(raw).marginMagics
}

const findImage = (cacheDir, id, variant) => {
  const dir = path.join(cacheDir, 'remodel')
  if (!fs.existsSync(dir)) return null
  const padId = String(id).padStart(4, '0')
  const prefix = `${padId}_${variant === 'damaged' ? 'd' : 'n'}_`
  const file = fs.readdirSync(dir).find((f) => f.startsWith(prefix))
  return file ? `remodel/${file}` : null
}

const crop = (file, margin, h = 80) =>
  file == null || margin == null
    ? '<div class="crop empty"></div>'
    : `<div class="crop" style="width:${Math.round(1.85 * h)}px;height:${h}px">` +
      `<img loading="lazy" src="${file}" style="height:${Math.round((h / 176) * 182)}px;` +
      `margin-left:${-Math.round(margin * h)}px;margin-top:${-Math.round((h / 176) * 3)}px"></div>`

const main = async () => {
  const { values: args } = parseArgs({
    options: {
      cache: { type: 'string', default: path.resolve(__dirname, '.cache') },
      start2: { type: 'string' },
      out: { type: 'string' },
    },
  })
  const outPath = args.out ?? path.join(args.cache, 'diff-report.html')

  const names = {}
  if (args.start2) {
    const start2Raw = await fs.readJSON(args.start2)
    const start2 = start2Raw.body ?? start2Raw.api_data ?? start2Raw
    for (const s of start2.api_mst_ship) names[s.api_id] = s.api_name
  }

  const before = readBeforeFromGit()
  const after = JSON.parse(await fs.readFile(SHIPAVATAR_PATH, 'utf-8')).marginMagics

  const ids = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort(
    (a, b) => Number(a) - Number(b),
  )
  const added = []
  const changed = []
  let unchangedCount = 0
  for (const id of ids) {
    const b = before[id]
    const a = after[id]
    if (!b && a) {
      added.push({ id, after: a })
    } else if (b && a && (b.normal !== a.normal || b.damaged !== a.damaged)) {
      changed.push({ id, before: b, after: a })
    } else {
      unchangedCount++
    }
  }

  console.info(`before: ${Object.keys(before).length} entries`)
  console.info(`after: ${Object.keys(after).length} entries`)
  console.info(`added: ${added.length}`)
  console.info(`changed: ${changed.length}`)
  console.info(`unchanged: ${unchangedCount}`)

  const jsonPath = outPath.replace(/\.html$/, '.json')
  await fs.outputJSON(
    jsonPath,
    { generatedAt: new Date().toISOString(), added, changed, unchangedCount },
    { spaces: 2 },
  )

  const row = (id, b, a) => {
    const name = names[id] ?? ''
    return (
      `<tr><td>${id}</td><td>${name}</td>` +
      `<td>${b?.normal ?? '—'}<br>${crop(findImage(args.cache, id, 'normal'), b?.normal)}</td>` +
      `<td>${a?.normal ?? '—'}<br>${crop(findImage(args.cache, id, 'normal'), a?.normal)}</td>` +
      `<td>${b?.damaged ?? '—'}<br>${crop(findImage(args.cache, id, 'damaged'), b?.damaged)}</td>` +
      `<td>${a?.damaged ?? '—'}<br>${crop(findImage(args.cache, id, 'damaged'), a?.damaged)}</td></tr>`
    )
  }
  const addedRows = added.map(({ id, after: a }) => row(id, null, a)).join('\n')
  const changedRows = changed.map(({ id, before: b, after: a }) => row(id, b, a)).join('\n')

  const html = `<!doctype html><meta charset="utf-8"><title>shipavatar diff report</title>
<style>
  body { font-family: sans-serif; background: #30404d; color: #f5f8fa; }
  table { border-collapse: collapse; margin-bottom: 24px; }
  td, th { border: 1px solid #5c7080; padding: 4px 8px; vertical-align: top; }
  .crop { overflow: hidden; position: relative; display: flex; align-items: center; }
  .crop img { display: block; max-width: none; }
  .crop.empty { width: 148px; height: 80px; background: #182026; }
</style>
<h1>shipavatar marginMagic diff (HEAD vs working tree)</h1>
<p>added: ${added.length} | changed: ${changed.length} | unchanged: ${unchangedCount}</p>
<h2>changed (${changed.length})</h2>
<table><tr><th>id</th><th>name</th><th>before normal</th><th>after normal</th><th>before damaged</th><th>after damaged</th></tr>
${changedRows}</table>
<h2>added (${added.length})</h2>
<table><tr><th>id</th><th>name</th><th>before normal</th><th>after normal</th><th>before damaged</th><th>after damaged</th></tr>
${addedRows}</table>`
  await fs.outputFile(outPath, html)
  console.info(`report: ${path.relative(process.cwd(), outPath)}`)
  console.info(`data: ${path.relative(process.cwd(), jsonPath)}`)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
