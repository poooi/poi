/**
 * Several Blueprint components measure the DOM once on mount and derive layout
 * from that measurement, without re-measuring when their box later changes size.
 * poi keeps inactive tabs mounted under `content-visibility: hidden`, whose
 * subtree is never laid out, so anything inside a settings or plugin tab mounts
 * against a 0px box and stays broken after the tab is first revealed.
 *
 * These patches re-run the component's own measurement whenever its element
 * actually has a size. They patch the prototype rather than wrapping components,
 * so plugins importing straight from @blueprintjs/core are covered too — poi and
 * plugins share one module instance, and the exports object is read-only.
 *
 * Private members are reached by element access, which TypeScript permits
 * without asserting the instance type away. Since those members are internal to
 * Blueprint and may be renamed by a future version, every one of them is checked
 * at runtime before patching: if any is missing the component is left untouched,
 * so a version bump degrades to the unpatched behaviour instead of throwing
 * during mount or unmount.
 */
export {}

import type { Component } from 'react'

import { MultiSlider, Tabs } from '@blueprintjs/core'

const observers = new WeakMap<object, ResizeObserver>()

/**
 * Re-run `measure` whenever the observed element is actually laid out. A
 * zero-sized callback is either the initial observation or the tab being hidden
 * again; re-measuring then would just overwrite good numbers with zeroes, and
 * the observer fires again with real values when the element comes back.
 */
const patchMeasurement = <T extends Component>({
  name,
  prototype,
  hasInternals,
  getElement,
  measure,
}: {
  name: string
  prototype: T
  /** whether the private method `measure` calls is still there to call */
  hasInternals: boolean
  getElement: (instance: T) => Element | null
  measure: (instance: T) => void
}): void => {
  const { componentDidMount, componentWillUnmount } = prototype

  if (
    !hasInternals ||
    typeof componentDidMount !== 'function' ||
    typeof componentWillUnmount !== 'function'
  ) {
    console.warn(`[blueprint-measurement] ${name} internals changed; skipping the re-measure patch`)
    return
  }

  prototype.componentDidMount = function (this: T) {
    componentDidMount.call(this)

    const element = getElement(this)
    if (element == null) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width === 0 && height === 0) {
        return
      }
      measure(this)
    })
    observer.observe(element)
    observers.set(this, observer)
  }

  prototype.componentWillUnmount = function (this: T) {
    observers.get(this)?.disconnect()
    observers.delete(this)

    componentWillUnmount.call(this)
  }
}

/**
 * <MultiSlider> (which backs <Slider> and <RangeSlider>) measures its track once
 * on mount, and only re-measures when min/max/vertical change. Pointer movement
 * is converted to values with that measurement, so a 0px track makes every drag
 * divide by zero and resolve to ±Infinity — the handle snaps between min and max
 * (poooi/poi#2692, upstream palantir/blueprint#4109). Window resizes leave the
 * same measurement stale.
 */
patchMeasurement({
  name: 'MultiSlider',
  prototype: MultiSlider.prototype,
  hasInternals: typeof MultiSlider.prototype['updateTickSize'] === 'function',
  getElement: (slider) => slider['trackElement'],
  measure: (slider) => slider['updateTickSize'](),
})

/**
 * <Tabs> positions its selection indicator from the selected tab's measured box,
 * and only re-measures when the selection or the tab children change. Mounted
 * unlaid-out, the indicator collapses to a zero-sized box at the origin and stays
 * there until the user switches tabs — poi's settings view mounts exactly that
 * way. Re-measuring on resize also covers upstream palantir/blueprint#1035.
 */
patchMeasurement({
  name: 'Tabs',
  prototype: Tabs.prototype,
  hasInternals: typeof Tabs.prototype['moveSelectionIndicator'] === 'function',
  getElement: (tabs) => tabs['tablistElement'],
  // `false` so the indicator appears in place instead of sliding in from the
  // origin the first time the tab bar is revealed
  measure: (tabs) => tabs['moveSelectionIndicator'](false),
})
