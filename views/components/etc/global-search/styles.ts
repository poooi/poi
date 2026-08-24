import { Button, SegmentedControl, Tag } from '@blueprintjs/core'
import { css, keyframes, styled } from 'styled-components'
import { Avatar } from 'views/components/etc/avatar'
import { SlotitemIcon } from 'views/components/etc/icon'
import ScrollShadow from 'views/components/etc/scroll-shadow'
import { ALevel, Gradient, overAvatarText } from 'views/components/ship-parts/styled-components'

// Matching the plugin drawer's motion, so the two overlays feel like one app.
const backdropReveal = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const backdropDismiss = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

const panelReveal = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`

const panelDismiss = keyframes`
  from { opacity: 1; transform: translateY(0)    scale(1);    }
  to   { opacity: 0; transform: translateY(-8px) scale(0.97); }
`

export interface AnimatedProps {
  $closing?: boolean
  $noAnimation?: boolean
}

export const Backdrop = styled.div<AnimatedProps>`
  position: absolute;
  inset: 0;

  /* Above the tab area (which tops out at 18) but below Blueprint's overlay
     layer at 20, so real modals — the quit prompt, plugin dialogs — draw over
     this panel rather than under it. It also puts the panel's own popovers and
     tooltips, which portal at 20, above it for free. */
  z-index: 19;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6vh 12px 12px;
  background: rgb(0 0 0 / 0.35);
  will-change: opacity;
  animation: ${({ $closing, $noAnimation }) =>
    $noAnimation
      ? 'none'
      : $closing
        ? css`
            ${backdropDismiss} 0.15s cubic-bezier(0.4, 0, 1, 1) forwards
          `
        : css`
            ${backdropReveal} 0.2s cubic-bezier(0, 0, 0.2, 1) forwards
          `};
`

// The panel deliberately does not use Blueprint's Card: the roster list has to
// stay readable over whatever the tab area is showing behind it, so the
// background is the theme's opaque token rather than a translucent surface.
export const Panel = styled.div<AnimatedProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 720px;
  max-height: 100%;
  padding: 10px;
  border: 1px solid rgb(128 128 128 / 0.35);
  border-radius: 6px;
  /* The result list is pulled out over the bottom padding to put its scroll
     shadow on the panel edge, which would otherwise square off the corners. */
  overflow: hidden;
  background: var(--poi-background-color-opaque, rgb(47 52 60));
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.2),
    0 8px 24px rgb(0 0 0 / 0.4);
  will-change: transform, opacity;
  animation: ${({ $closing, $noAnimation }) =>
    $noAnimation
      ? 'none'
      : $closing
        ? css`
            ${panelDismiss} 0.15s cubic-bezier(0.4, 0, 1, 1) forwards
          `
        : css`
            ${panelReveal} 0.2s cubic-bezier(0, 0, 0.2, 1) forwards
          `};
`

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const FilterRow = styled(Row)`
  flex-wrap: wrap;
  font-size: 12px;

  /* The eight-tab strip wraps onto another line rather than squeezing labels */
  .bp6-button-group {
    flex-wrap: wrap;
  }
`

/**
 * The search box is the only thing here that should give up width. Everything
 * else holds its natural size, because CJK labels wrap between characters
 * (艦娘 → 艦/娘) the moment a flex item is squeezed below its content.
 */
export const SearchRow = styled(Row)`
  flex-wrap: wrap;
  /* Room for the close button, which is pinned to the panel corner rather than
     riding along in the flow — see CloseSlot. */
  padding-right: 34px;

  > * {
    flex: 0 0 auto;
    white-space: nowrap;
  }
`

/**
 * The close button belongs to the panel, not to the first row: once the row is
 * narrow enough to wrap, a button at the end of the flow lands wherever the
 * last line happens to end. Pinned to the corner it stays where a close button
 * is looked for.
 */
export const CloseSlot = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`

/**
 * The land base tabs, whose five captions are the widest labels in the panel.
 * Clipped rather than wrapped: a two-line caption would set the height of the
 * whole strip for the sake of one tab.
 */
export const PillControl = styled(SegmentedControl)`
  min-width: 0;

  .bp6-button {
    min-width: 0;
  }

  .bp6-button-text {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const SearchField = styled.div`
  flex: 1 1 12em;
  min-width: 8em;
`

/**
 * Filter toggles read as pressed rather than merely hovered: Blueprint's
 * minimal active state is too faint against the panel, so selected tabs get a
 * filled background and unselected ones are dimmed.
 */
export const TabButton = styled(Button)<{ $selected: boolean }>`
  && {
    flex: 0 0 auto;
    white-space: nowrap;
    opacity: ${({ $selected }) => ($selected ? 1 : 0.45)};
    font-weight: ${({ $selected }) => ($selected ? 600 : 400)};
    background: ${({ $selected }) => ($selected ? 'rgb(45 114 210 / 0.85)' : 'transparent')};
    color: ${({ $selected }) => ($selected ? '#fff' : 'inherit')};
    border: 1px solid ${({ $selected }) => ($selected ? 'transparent' : 'rgb(128 128 128 / 0.4)')};
  }
`

/**
 * The scrolling result list. Rows are full-width block siblings already, so
 * ScrollShadow's sentinels sit directly among them.
 *
 * The negative margin pulls the box out over the panel's padding and the
 * matching padding puts the rows back where they were, so the shadow is drawn
 * on the panel's own edge rather than floating short of it — the same trick the
 * task panel uses. Only the sides and bottom: the top edge of this list is not
 * the top of the panel, the search row is.
 */
export const Results = styled(ScrollShadow)`
  flex: 1 1 auto;
  min-height: 140px;
  margin: 0 -10px -10px;
  padding: 0 10px 10px;
  overflow-y: auto;
`

export const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px;
  border-bottom: 1px solid rgb(128 128 128 / 0.2);
  transition: background-color 0.15s ease;

  /* Rounded so the highlight reads as a row, not a full-bleed band, and inset
     slightly since the list is pulled out over the panel's padding. */
  &:hover {
    border-radius: 3px;
    background: rgb(128 128 128 / 0.14);
  }

  &:last-child {
    border-bottom: none;
  }
`

/**
 * The ship tile, mirroring the mini ship panel's grid so the two read
 * identically: avatar, then the name and level stacked over it, then HP and the
 * status label. Only the trailing columns differ, since a search row ends with
 * the per-ship button and the position tag instead of morale and an HP bar.
 */
export const ShipTile = styled.div<{ $avatar?: boolean }>`
  align-items: start;
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  position: relative;
  white-space: nowrap;

  /* Avatar plus name is capped at 140px, as in the mini panel, so the art does
     not stretch across the row. The spacer column then holds HP and the status
     label flush right, aligned all the way down the list. */
  grid-template-columns:
    ${({ $avatar = true }) => ($avatar ? '50px' : '0')} minmax(35px, 90px)
    1fr 74px 32px;
  grid-template-rows: 20px 13px;
  gap: 2px 6px;
`

export const RowAvatar = styled(Avatar)`
  pointer-events: none;
  align-items: end;
  align-self: center;
  grid-row: 1 / 3;
  grid-column: 1 / 3;
`

// Same treatment as MiniGradient: span the avatar column too, so the ramp has
// room to reach full colour before the name starts.
export const TileGradient = styled(Gradient)`
  grid-row: 1 / 3;
  grid-column: 2 / 3;
  mask-image: linear-gradient(to right, transparent, rgb(0 0 0 / 1));
`

export const TileName = styled.div<{ $avatar?: boolean }>`
  z-index: 2;
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ $avatar }) => $avatar && overAvatarText({ fontWeight: 600, shadowBlur: '3px' })}
`

export const TileLevel = styled.div<{ $avatar?: boolean }>`
  z-index: 2;
  grid-row: 2 / 3;
  grid-column: 2 / 3;
  font-size: 70%;
  line-height: 1;
  overflow: hidden;
  align-items: center;
  ${({ $avatar }) => $avatar && overAvatarText({ shadowBlur: '3px' })}
`

export const TileHP = styled.span`
  font-size: 110%;
  grid-row: 1 / 3;
  grid-column: 4 / 5;
  align-self: center;
  text-align: right;
`

/**
 * Wide enough for the tag Blueprint draws inside it — at the mini panel's 18px
 * the icon is clipped, since that column carries no tag of its own.
 */
export const TileStatusLabel = styled.div`
  grid-row: 1 / 3;
  grid-column: 5 / 6;
  align-self: center;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 101;

  .bp6-tag {
    padding: 2px 4px;
  }
`

/**
 * Equipment leads with the game's own gear icon rather than the item artwork:
 * it is the glyph the picker itself shows, and it honours the SVG/PNG icon
 * setting.
 */
export const RowIcon = styled(SlotitemIcon)`
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  object-fit: contain;
  pointer-events: none;
`

/** The same glyph in a dropdown option, which needs its own gap from the label. */
export const OptionIcon = styled(SlotitemIcon)`
  width: 20px;
  height: 20px;
  margin-right: 6px;
  vertical-align: middle;
  object-fit: contain;
`

/** And in a segmented-control pill, where Blueprint supplies the gap. */
export const PillIcon = styled(SlotitemIcon)`
  width: 18px;
  height: 18px;
  object-fit: contain;
`

/** Aircraft proficiency chevrons, as the ship panel draws them. */
export const RowALevel = styled(ALevel)`
  flex: 0 0 auto;
  margin-bottom: 0;
`

export const Name = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/**
 * Every column right of the name is fixed-width so the rows line up: the
 * metadata, the per-ship button and the tags all vary in length ("行 1" vs
 * "行 10", "Lv.9" vs "Lv.178"), which otherwise leaves the column edges ragged.
 */
export const Meta = styled.div`
  flex: 0 0 auto;
  width: 11em;
  font-size: 11px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
`

/**
 * Sized to its content rather than a fixed width: the remodel scene's その他
 * tag carries three segments ("Other · Page 10 · Row 10") where every other
 * mode carries two, and a fixed width sized for the short case clips the long
 * one — worse once any of the three segments runs long in translation. The
 * ship tile and name column absorb the difference; both already shrink.
 */
export const PositionTagEl = styled(Tag)`
  && {
    flex: 0 0 auto;
    white-space: nowrap;
    justify-content: center;
    text-align: center;
  }
`

export const ListModeTagEl = styled(Tag)`
  && {
    flex: 0 0 auto;
    width: 8em;
    justify-content: center;
    text-align: center;
  }
`

export const Empty = styled.div`
  padding: 16px;
  text-align: center;
  opacity: 0.7;
`

export const ScopeBar = styled(Row)`
  padding: 4px 6px;
  border-radius: 4px;
  background: rgb(45 114 210 / 0.18);
  font-size: 12px;
  /* Ship name + a slot per equipment slot + the count outgrow one line on the
     wider hulls, so let the row break rather than clip inside the panel. */
  flex-wrap: wrap;
`
