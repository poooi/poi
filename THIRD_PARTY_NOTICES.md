# Third-Party Notices

poi itself is under [the MIT License](LICENSE). This file records material in this
repository that originates from other projects — code ported from them, data derived from
them, or values transcribed from them — together with the licence each one is published
under.

Scope: **source-derived material only**. npm dependencies are not listed here; they carry
their own licence metadata in `package.json` and `node_modules`, and are neither vendored
nor modified. Game assets downloaded at runtime from DMM/KADOKAWA servers are likewise out
of scope — they are the game's, not ours.

When you port code or transcribe values from another project, add an entry here as well as
a comment at the site in the code.

---

## KC3Kai

- Source: <https://github.com/KC3Kai/KC3Kai>
- Licence: MIT — Copyright (c) 2015-2026 dragonjet (see the notice at the end of this file)

Used in:

- `views/utils/combat/aaci/` — the AACI (対空カットイン) table and predicates, ported from
  `src/library/modules/AntiAir.js` at commit `a9edbe5`.
- `views/utils/improvement/table.ts` — 改修 (★) bonus values that no other source states,
  from `src/library/objects/Gear.js`. Each such rule carries a `KC3 only` comment.
- `skills/equipment-improvement/references/kc3-diff.js` — a development-time harness that
  loads `Gear.js` (downloaded, not vendored) to diff it against poi's table.

## kcs2-mapdata

- Source: <https://github.com/KagamiChan/kcs2-mapdata>
- Licence: MIT — Copyright (c) 2018 かがみ

Used in `fcd/gen-map.js`, which ports its extraction of map node coordinates and routes from
the game's `kcs2` map resources.

## kc-web (制空権シミュレータ)

- Source: <https://github.com/noro6/kc-web> by noro6
- Licence: **none published.** The repository has no `LICENSE` file and no `license` field
  in its `package.json`, so no permission to copy or adapt its source has been granted.

What poi takes from it, in `views/utils/improvement/table.ts`: measured 改修 bonus values
and equipment id groupings (爆戦, 狭義の爆雷, and the per-stat modifiers), read from
`src/classes/item/item.ts` and `src/classes/constants/items.ts`. No code was copied — poi's
table is its own structure — and the values are facts about a third-party game rather than
authored expression, most of them corroborated by wikiwiki. **This is recorded here rather
than settled here**: if the project wants a stricter footing, the options are to ask noro6
to publish a licence, or to keep only the values wikiwiki states independently.

## lbpcascade_animeface

- Source: <https://github.com/nagadomi/lbpcascade_animeface>
- Licence: none published in the repository.

`fcd/gen-shipavatar.js` can download `lbpcascade_animeface.xml` at development time for its
`--method face` path. The file is not vendored, not redistributed, and not used by the
default `--method banner`.

## wikiwiki.jp/kancolle

- Source: <https://wikiwiki.jp/kancolle/>

Game mechanics values throughout `views/utils/` (改修 bonuses, combat conditions, quest
data) are transcribed from the community wiki's per-mechanic pages, which are cited inline
next to each value. These are measured facts about the game rather than the wiki's own
expression; no wiki text is reproduced beyond short quotations of the sentence a value comes
from.

## SVG icons and the application icon

Not MIT — see [assets/svg/COPYRIGHT.md](assets/svg/COPYRIGHT.md). They may not be used in
projects unassociated with poi.

---

## KC3Kai MIT licence notice

```
The MIT License (MIT)

Copyright (c) 2015-2026 dragonjet

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## kcs2-mapdata MIT licence notice

```
MIT License

Copyright (c) 2018 かがみ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
