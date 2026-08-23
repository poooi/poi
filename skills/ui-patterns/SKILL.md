---
name: ui-patterns
description: poi-specific UI constraints and patterns — why hidden tabs and fleet decks must stay mounted, how to capture a previous value for CSS transitions, and why backdrop-filter must keep its external SVG filter. Use when editing views/components/**, assets/css/**, assets/svg/ui/**, when optimizing rendering of hidden panes, when adding a CSS transition driven by a changing selector value, or when touching blur/vibrancy styling.
---

# poi UI Patterns and Constraints

## Never unmount inactive tabs or fleet decks

Inactive main tabs, plugin tabs, and fleet decks **must stay mounted** — some plugins rely on
in-component React state that would be lost on unmount. The user explicitly rejected
conditional mounting as a performance fix.

Hide them with `content-visibility: hidden` instead: it preserves layout state and skips
rendering. Applied in `views/components/tab-area/tab-contents-union.tsx`
(`PoiTabChildPositioner`) and `views/components/ship-parts/styled-components.tsx` (`ShipDeck`),
replacing the older `& > div { display: none }`.

Also deferred by the user: performance fixes that change visuals — backdrop-filter blur,
text-shadows, mask-image, `transition: all`, tooltip count. Do not "clean these up" without
asking.

## Capturing a previous value for a CSS transition

Use a `useLayoutEffect` **cleanup** to capture the outgoing value before a dependency changes.
The cleanup closure holds the old value and runs synchronously before paint (and before the new
effect body), so the state update lands before the transition's first paint.

```tsx
const [prevFleetId, setPrevFleetId] = useState<number | null>(null)

useLayoutEffect(() => {
  return () => {
    setPrevFleetId(activeFleetId) // cleanup fires with the old value before re-running
  }
}, [activeFleetId])
```

This avoids three problems at once:

1. No `setState` during render (React's `getDerivedStateFromProps` pattern) — the user prefers
   not to use it, even though the React docs allow it.
2. No `react-hooks/set-state-in-effect` lint error — `setState` inside the _cleanup return_ is
   not flagged, only direct calls in the effect body are.
3. No `useEffect` flash — `useLayoutEffect` cleanup runs synchronously before paint.

Pair it with a `handleTransitionEnd` callback that resets the value to `null` once the CSS
transition finishes, removing the outgoing element from active rendering.

## backdrop-filter needs the external SVG filter

In poi's vibrant (transparent) Electron window, `backdrop-filter: blur(...)` and the other CSS
filter functions do **not** produce a blur — the backdrop is semi-transparent, so the plain
functions composite to nothing visible.

The working construct is an _external_ SVG file reference:

```css
backdrop-filter: url('../svg/ui/filter.svg#blur');
```

**Do not replace the SVG-filter structure in `assets/css/blueprint-vibrant.css` with CSS filter
functions.** Tune either the filter chain in `assets/svg/ui/filter.svg` (`#blur`) or the CSS
properties around it.

The `#blur` chain un-premultiplies alpha, dilates and blurs RGB, clips to a blurred dilated
alpha mask, re-boosts opacity, then saturates by 1.25 — the OS acrylic recipe. The tint layered
on top lives in `--poi-vibrancy-tint` (per theme), kept separate from
`--bp-surface-background-color-default-rest` so blurred surfaces can be darkened toward the
native look without affecting buttons, inputs, or cards.

Verify blur/vibrancy changes with the `visual-verification` skill — they cannot be checked from
tests.
