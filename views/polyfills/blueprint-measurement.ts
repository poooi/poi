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
 * without asserting the instance type away.
 */
export {}

import { MultiSlider, Tabs } from '@blueprintjs/core'

const observers = new WeakMap<object, ResizeObserver>()

/**
 * Only measure once the element is actually laid out. A zero-sized callback is
 * either the initial observation or the tab being hidden again; re-measuring
 * then would just overwrite good numbers with zeroes, and the observer fires
 * again with real values when the element comes back.
 */
const observeLayout = (instance: object, element: Element, measure: () => void) => {
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect
    if (width === 0 && height === 0) {
      return
    }
    measure()
  })
  observer.observe(element)
  observers.set(instance, observer)
}

const disconnectLayoutObserver = (instance: object) => {
  observers.get(instance)?.disconnect()
  observers.delete(instance)
}

/**
 * <MultiSlider> (which backs <Slider> and <RangeSlider>) measures its track once
 * on mount, and only re-measures when min/max/vertical change. Pointer movement
 * is converted to values with that measurement, so a 0px track makes every drag
 * divide by zero and resolve to ±Infinity — the handle snaps between min and max
 * (poooi/poi#2692, upstream palantir/blueprint#4109). Window resizes leave the
 * same measurement stale.
 */
{
  const { componentDidMount, componentWillUnmount } = MultiSlider.prototype

  MultiSlider.prototype.componentDidMount = function () {
    componentDidMount.call(this)

    const track = this['trackElement']
    if (track != null) {
      observeLayout(this, track, () => this['updateTickSize']())
    }
  }

  MultiSlider.prototype.componentWillUnmount = function () {
    disconnectLayoutObserver(this)
    componentWillUnmount.call(this)
  }
}

/**
 * <Tabs> positions its selection indicator from the selected tab's measured box,
 * and only re-measures when the selection or the tab children change. Mounted
 * unlaid-out, the indicator collapses to a zero-sized box at the origin and stays
 * there until the user switches tabs — poi's settings view mounts exactly that
 * way. Re-measuring on resize also covers upstream palantir/blueprint#1035.
 */
{
  const { componentDidMount, componentWillUnmount } = Tabs.prototype

  Tabs.prototype.componentDidMount = function () {
    componentDidMount.call(this)

    const tablist = this['tablistElement']
    if (tablist != null) {
      // `false` so the indicator appears in place instead of sliding in from the
      // origin the first time the tab bar is revealed
      observeLayout(this, tablist, () => this['moveSelectionIndicator'](false))
    }
  }

  Tabs.prototype.componentWillUnmount = function () {
    disconnectLayoutObserver(this)
    componentWillUnmount.call(this)
  }
}
