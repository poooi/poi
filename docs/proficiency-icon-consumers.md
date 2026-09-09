# Proficiency PNG consumers

Audit date: 2026-09-10. Organization-wide GitHub code searches for `alv` and
`airplane` were followed by source and stylesheet inspection at the default-branch
commits linked below. Counts refer to runtime image expressions, not individual
rank files, tests, or reference catalogs.

Five plugins each directly reference `assets/img/airplane/alv${rank}.png`.
All five constrain the image itself, so increasing the PNG resolution while
preserving its aspect ratio does not increase its displayed size.

| Plugin               | Image reference                                                                                                                                   | Applied image size                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| plugin-battle-detail | [overview-area.tsx:192](https://github.com/poooi/plugin-battle-detail/blob/2fdb44825398bc687099680e1197e408c5b987d5/views/overview-area.tsx#L192) | [Height 16 px](https://github.com/poooi/plugin-battle-detail/blob/2fdb44825398bc687099680e1197e408c5b987d5/assets/main.css#L153), automatic width      |
| plugin-hensei-nikki  | [ship.tsx:37](https://github.com/poooi/plugin-hensei-nikki/blob/3a915ab6604758f1c62da29216fcaa30b7bb0675/components/fleets-view/ship.tsx#L37)     | [14 × 14 px](https://github.com/poooi/plugin-hensei-nikki/blob/3a915ab6604758f1c62da29216fcaa30b7bb0675/assets/hensei-nikki.css#L23)                   |
| plugin-item-info     | [table-area.es:110](https://github.com/poooi/plugin-item-info/blob/ed6caa1e76c5728a09bde610d2c9ee5b1ba6ae51/src/table-area.es#L110)               | [11 × 14 px](https://github.com/poooi/plugin-item-info/blob/ed6caa1e76c5728a09bde610d2c9ee5b1ba6ae51/assets/main.css#L110)                             |
| plugin-prophet       | [slot-item.tsx:84](https://github.com/poooi/plugin-prophet/blob/ac9938d51625cdac8be25baf80d33fab4dec26b9/src/views/ship-view/slot-item.tsx#L84)   | [16 × 16 px](https://github.com/poooi/plugin-prophet/blob/ac9938d51625cdac8be25baf80d33fab4dec26b9/src/views/ship-view/slot-item.tsx#L46)              |
| plugin-ship-info     | [slotitems.tsx:61](https://github.com/poooi/plugin-ship-info/blob/9e81140209e88d2ab904d716d1bb28782a1d681a/views/table/slotitems.tsx#L61)         | [Height 14 px](https://github.com/poooi/plugin-ship-info/blob/9e81140209e88d2ab904d716d1bb28782a1d681a/views/table/slotitems.tsx#L19), automatic width |

The three external stylesheets are linked by their plugins' root components and
their selectors match the image containers. The other two use `styled.img`.
The square boxes in hensei-nikki and prophet already stretch the original 31:39
artwork; this audit does not change those plugin styles.

poi itself has four image expressions across `ship/slotitems.tsx` (two),
`main/parts/mini-ship/mini-slotitems.tsx`, and `etc/global-search/index.tsx`.
All use `ALevel` or its `RowALevel` derivative at 14 px height. They now use SVG.
This makes nine runtime references across six repositories before this integration,
with five plugin PNG references remaining afterward.

`poi-compact-info` uses text marks for proficiency, not these PNGs. `poooi/icons`
contains source inventory and preview references, not a consumer of installed poi
assets. Test fixtures and proficiency calculations are also excluded from the count.

The compatibility PNGs are therefore rendered from the new SVGs at 124 × 156 px
(four times the original dimensions), keeping existing filenames and the 31:39
aspect ratio. The table is also the migration list for moving plugins to SVG in
a future change. Historical plugin releases, non-default branches, and repositories
outside the organization were not audited.

An isolated Electron renderer loaded the five extracted image-style rules with
matching container markup. All seven ranks were compared using 31 × 39 and
124 × 156 PNGs on light and dark backgrounds (140 images). All images decoded,
and measured display sizes matched the table for both resolutions. This was a
focused rendering check, not a full launch of each plugin. OxiPNG reduced the
seven high-resolution rasterizations from 19,984 to 7,603 bytes, with decoded
RGBA equality verified against the unoptimized SVG renders.
