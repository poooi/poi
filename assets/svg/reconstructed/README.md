# Reconstructed game icons

Imported from [poooi/icons](https://github.com/poooi/icons) at
`7230fbb0140cbb7d15e8337481190b82b41c3f4c`: 59 equipment, 11 resource,
7 aircraft proficiency, 4 operation, and 5 ship-status icons.
The original game artwork remains the property of its respective rights holders.
Lettering is outlined; no fonts are required at runtime. See the upstream
[reconstruction notes](https://github.com/poooi/icons/tree/7230fbb0140cbb7d15e8337481190b82b41c3f4c/docs)
for references, typography, shared geometry, and review criteria.
For future artwork, follow the maintained
[reconstruction guide](https://github.com/poooi/icons/blob/gh-pages/docs/reconstruction-guide.md),
which consolidates the session's final decisions and supersedes earlier experiments.

## Integration

Equipment and resource icons have independent appearance settings:
`equipmentIcons` and `resourceIcons`. Each accepts `game`, `classic`, or
`reconstructed`. Both default to `reconstructed` on a new installation.
Before loading defaults, an existing `svgicon` boolean migrates to both settings:
`false` becomes `game`, and `true` becomes `classic`. Explicit new selections
survive migration, and the obsolete boolean is removed from the saved config.
The legacy `window.useSVGIcon` getter follows the equipment selection.

The original PNG and classic SVG sets remain available. A missing reconstructed
icon falls directly back to the game PNG. Missing equipment vectors trigger the
same online atlas fetch and crop as the game icon set, including when the server
is discovered after the icon mounts. Bundled PNGs are used while the atlas loads;
equipment with no available image uses the existing unknown-item PNG. Resource
fallbacks use the bundled game PNGs. Reconstructed equipment uses the game
icon display box because its canvas includes similar whitespace.

Core proficiency consumers use SVG directly. The paths `assets/img/airplane/alv1.png`
through `alv7.png` remain available for plugins. These PNGs are rasterized from the
new proficiency SVGs at 124 × 156 px, retaining the original aspect ratio. The
[consumer audit](../../../docs/proficiency-icon-consumers.md) confirms that all five
referencing plugins set an explicit image height. Status SVGs replace unused legacy status
PNGs; no core status-image consumer currently exists. Operation notifications
retain PNGs under `assets/img/operation`, rasterized at 256 px from these SVGs:
Electron's `nativeImage.createFromPath` rejected the SVGs in the Windows smoke
check while accepting the PNGs. The SVG sources are retained here.

## Optimization

All 86 SVGs were optimized with SVGO 4.1.0, `preset-default`, multipass, and
five decimal places: 217,508 to 160,454 bytes. Source and optimized versions were
compared using resvg at 432 px, with visual inspection of the largest differences.
The four notification PNGs were generated using resvg and losslessly optimized
with OxiPNG 10.2.1 (`-o 4 --strip safe`): 292,077 to 180,753 bytes. Decoded pixels
were checked for equality. These higher-resolution PNGs are larger than the
previous low-resolution files.

The seven proficiency PNG rasterizations also passed through OxiPNG with the same
options (19,984 to 7,603 bytes); their decoded RGBA pixels match the unoptimized
rasterizations.

Maintain artwork in the upstream icon repository. Check equipment and resources
at 16–24 px and enlarged sizes on light and dark backgrounds. Check other
categories at their actual display sizes; tiny text readability is not a general
acceptance requirement. Optimize updated SVGs and any necessary raster copies
before importing them, and recheck both appearance and application usage.
