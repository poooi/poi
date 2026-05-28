import type { RootState } from 'views/redux/reducer-factory'

import { isEqual, omit } from 'lodash'
import React, {
  Children,
  forwardRef,
  memo,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { css, keyframes, styled } from 'styled-components'

const slideOutLeft = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-100%, 0, 0); }
`

const slideOutRight = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(100%, 0, 0); }
`

const PoiTabContents = styled.div`
  flex: 1 0 0;
  overflow: hidden;
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  contain: layout;
`

const PoiTabChildPositioner = styled.div<{
  transition?: boolean
  animating?: boolean
  left?: boolean
  right?: boolean
  active?: boolean
}>`
  display: flex;
  flex: 1;
  flex-direction: column;
  position: absolute;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
  ${({ transition, animating, left, right }) =>
    transition && animating
      ? left
        ? css`
            animation: ${slideOutLeft} 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            will-change: transform;
          `
        : right &&
          css`
            animation: ${slideOutRight} 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            will-change: transform;
          `
      : transition &&
        css`
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        `}
  ${({ left, right, animating }) =>
    animating
      ? css`
          pointer-events: none;
        `
      : left
        ? css`
            transform: translate3d(-100%, 0, 0);
            pointer-events: none;
          `
        : right &&
          css`
            transform: translate3d(100%, 0, 0);
            pointer-events: none;
          `}
  ${({ active }) =>
    !active &&
    css`
      & > div {
        display: none !important;
      }
    `}
`

const childrenKey = (children: React.ReactNode): string[] =>
  (
    Children.map(children, (child) =>
      React.isValidElement(child) ? String(child.key ?? '') : null,
    ) ?? []
  ).filter(Boolean) as string[]

const findChildByKey = (children: React.ReactNode, key: string): React.ReactNode =>
  (
    Children.map(children, (child) =>
      React.isValidElement(child) && child.key === key ? child : null,
    ) ?? []
  ).filter(Boolean)[0] ?? null

export interface TabContentsUnionHandle {
  childrenKey: () => string[]
  findChildByKey: (key: string) => React.ReactNode | null
}

interface Props {
  children: React.ReactNode
  activeTab: string
}

const TabContentsUnionInner = forwardRef<TabContentsUnionHandle, Props>(
  ({ children, activeTab }, ref) => {
    const enableTransition = useSelector(
      (state: RootState): boolean => state.config?.poi?.transition?.enable ?? true,
    )

    const [prevTab, setPrevTab] = useState<string | null>(null)

    useLayoutEffect(() => {
      return () => {
        setPrevTab(activeTab)
      }
    }, [activeTab])

    const handleAnimationEnd = (key: string) => {
      requestAnimationFrame(() => {
        if (prevTab === key) setPrevTab(null)
      })
    }

    useImperativeHandle(
      ref,
      () => ({
        childrenKey: () => childrenKey(children),
        findChildByKey: (key: string) => findChildByKey(children, key),
      }),
      [children],
    )

    const activeKey =
      activeTab || (React.isValidElement(children) ? String(children.key ?? '') : '')

    let onTheLeft = true
    const content: React.ReactNode[] = []
    Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const key = String(child.key ?? '')
      if (key === activeKey) onTheLeft = false
      content.push(
        <PoiTabChildPositioner
          key={key}
          className="poi-tab-child-positioner"
          transition={(key === activeKey || key === prevTab) && enableTransition}
          animating={key === prevTab && enableTransition}
          active={key === activeKey || key === prevTab}
          left={key !== activeKey && onTheLeft}
          right={key !== activeKey && !onTheLeft}
          onAnimationEnd={() => handleAnimationEnd(key)}
        >
          {child}
        </PoiTabChildPositioner>,
      )
    })

    return <PoiTabContents className="poi-tab-contents">{content}</PoiTabContents>
  },
)

TabContentsUnionInner.displayName = 'TabContentsUnion'

const propsAreEqual = (prev: Props, next: Props): boolean =>
  isEqual(omit(prev, ['children']), omit(next, ['children'])) &&
  isEqual(childrenKey(prev.children), childrenKey(next.children))

export const TabContentsUnion = memo(TabContentsUnionInner, propsAreEqual)
