import { Button, HTMLSelect, Tag } from '@blueprintjs/core'
import { css, keyframes, styled } from 'styled-components'
import { Avatar } from 'views/components/etc/avatar'
import { SlotitemIcon } from 'views/components/etc/icon'
import { Gradient } from 'views/components/ship-parts/styled-components'

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
  z-index: 30;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 720px;
  max-height: 100%;
  padding: 10px;
  border: 1px solid rgb(128 128 128 / 0.35);
  border-radius: 6px;
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

  > * {
    flex: 0 0 auto;
    white-space: nowrap;
  }
`

export const SearchField = styled.div`
  flex: 1 1 12em;
  min-width: 8em;
`

/**
 * The sort button cycles through labels of differing width (Lv, 艦種, 疲労,
 * Fatigue…). A fixed width keeps it from resizing — and shoving the rest of the
 * row around — every time it is clicked.
 */
export const SortButton = styled(Button)`
  && {
    width: 7.5em;
    justify-content: flex-start;
  }
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
 * Blueprint sizes a select to its widest option minus the chevron, which clips
 * CJK captions like 全艦 or 艦上爆撃機・攻撃機. Give it room and let the label
 * ellipsize instead of colliding with the arrow.
 */
export const FilterSelect = styled(HTMLSelect)<{ $wide?: boolean }>`
  && select {
    min-width: ${({ $wide }) => ($wide ? '11em' : '7em')};
    padding-right: 26px;
    text-overflow: ellipsis;
  }
`

export const Results = styled.div`
  flex: 1 1 auto;
  min-height: 140px;
  overflow-y: auto;
`

export const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px;
  border-bottom: 1px solid rgb(128 128 128 / 0.2);

  &:last-child {
    border-bottom: none;
  }
`

/**
 * Leading art for a row. `Avatar` positions its contents absolutely and only
 * sets an inline width under `useFixedWidth`, so these must carry an explicit
 * width or they collapse to nothing.
 */
/**
 * The ship tile, sized and tinted like the mini ship panel's: the avatar art
 * with the same per-ship gradient fading out of it, so the two panels read the
 * same way.
 */
export const ShipTile = styled.div`
  flex: 0 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  width: 96px;
  height: 38px;
  overflow: hidden;
  border-radius: 3px;
`

export const RowAvatar = styled(Avatar)`
  position: absolute;
  inset: 0;
  width: 70px;
  pointer-events: none;
`

export const TileGradient = styled(Gradient)`
  position: absolute;
  inset: 0 0 0 34px;
  z-index: 1;
  pointer-events: none;
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

export const PositionTagEl = styled(Tag)`
  && {
    flex: 0 0 auto;
    width: 9.5em;
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
`
