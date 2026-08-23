---
name: fcd-assets
description: Regenerating fcd data, in particular ship-avatar marginMagic values via fcd/gen-shipavatar.js. Use when editing anything under fcd/, when asked to regenerate or fix ship avatar crops, or when ship portraits in the fleet view are framed wrongly.
---

# fcd Assets — Ship Avatar Generation

`fcd/gen-shipavatar.js` generates the `marginMagic` values in `fcd/shipavatar.json`, which
control how each ship's remodel art is cropped into an avatar.

## Two methods — use `banner`

`--method banner` (the default) substantially outperforms `--method face`:

- **banner**: the game's 160x40 `banner` art is the game's _own_ face-framed crop of the remodel
  art. The script registers banner -> remodel via ORB keypoints + RANSAC (scale + translation,
  no rotation); `marginMagic` is then linear in the transform `(tx, s)`, and the two-feature
  least-squares fit implicitly finds the anchor (~x = 101px in the banner).
  Full run: R^2 = 0.82, MAE = 0.059, 4 failures out of 1724.

  The banner frame is removed by a cross-banner pixel-identity mask: background pixels are
  byte-identical across banners of the same stype, so >= 4 matches within +-2 marks background;
  the pool falls back to all banners for stypes < 6. Note that banner character scale varies per
  ship (2.15x–2.98x), so plain template matching fails; whole-banner matching also fails,
  because the banner band covers more vertical content than the remodel strip.

- **face**: lbpcascade_animeface. Pad 48px first (faces touch the strip edges) and do **not**
  use `equalizeHist` (the transparent-black background kills it).
  R^2 = 0.67, MAE = 0.073, 253 failures, with catastrophic outliers.

## Workflow

```bash
node fcd/gen-shipavatar.js --start2 <api_start2 capture>   # default: fill missing/partial only
node fcd/gen-shipavatar.js --start2 <capture> --overwrite   # replace all
node fcd/gen-shipavatar.js --start2 <capture> --write       # merge into fcd/shipavatar.json
cd fcd && node build.js
```

The `api_start2` capture comes from the response-saver — see the `redux-api-testing` skill.

Review the results in `fcd/.cache/review.html` **before** using `--write`.
`fcd/report-diff.js` produces a before/after comparison against git HEAD with visual crops in
`fcd/.cache/diff-report.html`.

Visual spot-check trick: bitblt the source-space window crop (`x = m * 80 / (83/182)`,
`w` ~ 325) out of the remodel PNG and view it.

## Calibration warning

The fit is calibrated against the _current_ `fcd/shipavatar.json`. Once machine-generated values
are committed, that ground truth is polluted — if you recalibrate, fit against a hand-tuned
revision instead:

```bash
git show <hand-tuned-rev>:fcd/shipavatar.json
```

## Environment notes

- CDN: the legacy IP `203.104.209.71` is dead — use `w01y.kancolle-server.com`.
- Remodel art is 998x182; the 182 matches `avatar.tsx`'s `(height / 176) * 182`.
- devDeps: `opencv-wasm` (has ORB / BFMatcher / CascadeClassifier but **no**
  `estimateAffinePartial2D`, hence the hand-rolled RANSAC) and `pngjs`.

## History

Applied 2026-07-24 with overwrite-all + banner method: 862 entries (up from 465), build version
2026/07/24/03. Both methods independently flagged the same hand-tuned values as wrong
(Ooshio 0.877 -> 0.65, Michishio, Akatsuki Kai, Kongo 0.335 -> 0.541, Shiratsuyu Kai); visual
crop checks confirmed the machine values were correct, so nothing was reverted.
